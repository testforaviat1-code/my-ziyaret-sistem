"use server";

import { gecmisZamaniEngelle } from "@/lib/supabase/zamanKontrol"; // Seninki supabase klasöründeydi, yolu böyle olmalı
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Ziyaretçi ön kayıt formundan sunucuya iletilen talep satırı sözleşmesi.
 *
 * **İş Kuralı (Business Logic):** THY personelinin ziyaretçi (ve refakatçi) bilgilerini dijital
 * talep olarak oluşturması; ev sahibi personel ve kampüs bilgisi sunucuda profilden tamamlanır,
 * böylece sahte ev-sahibi ataması engellenir.
 *
 * **Yetki (Access Control):** Formu `personel`, `guvenlik` veya `admin` oturumu doldurabilir;
 * hassas alanlar (`ziyaretci_tc`, `ziyaretci_gsm`) KVKK kapsamında düz metin taşınır — Faz 2
 * HSM/KMS ile at-rest şifreleme THY altyapı sorumluluğundadır.
 */
export interface ZiyaretciVerisi {
  ziyaretci_ad_soyad: string;
  ziyaretci_tc: string;
  ziyaretci_gsm: string;
  ziyaret_nedeni: string;
  ziyaret_tarihi: string;
  ziyaret_saati: string;
  durum: string;
  plaka?: string | null;
  firma_bilgisi?: string | null;
  bitis_tarihi?: string | null;
  kampus_id?: number | null;
  ziyaret_edilecek_kisi?: string | null;
}

/** INSERT öncesi sunucunun yazdığı zorunlu/üstün alanlar */
type GuvenliTalepInsert = ZiyaretciVerisi & {
  ziyaret_edilecek_kisi: string;
  kampus_id: number | null | undefined;
};

/**
 * Yeni ziyaretçi talep kayıtlarını toplu olarak `talepler` tablosuna yazar.
 *
 * **İş Kuralı (Business Logic):** E-posta tabanlı manuel onay sürecinin yerine, personelin
 * ziyaretçi/refakatçi kaydını tek akışta oluşturması; geçmiş tarih/saat ile kayıt açılması
 * sunucu zaman kilidiyle engellenir.
 *
 * **Yetki (Access Control):** Oturum açmış `personel`, `guvenlik` veya `admin`. `ziyaret_edilecek_kisi`
 * istemci girdisine güvenilmez; `sicil_no` veya e-posta ön eki profilden türetilir.
 *
 * @param ziyaretcilerArray - Ana ve ek ziyaretçi satırları; spread ile gelen fazla alanlar RLS ve
 *   şema ile sınırlanmalıdır — `durum` manipülasyonu üretimde ek beyaz liste önerilir.
 * @param tarih - Planlanan ziyaret tarihi (`YYYY-MM-DD`); `gecmisZamaniEngelle` ile doğrulanır.
 * @param saat - Planlanan ziyaret saati; geçmiş zaman kombinasyonu reddedilir.
 * @returns `basarili` ve kullanıcıya yönelik `mesaj`; DB hata metni kontrollü iletilir, oturum yoksa
 *   yetkisiz yanıt döner.
 */
export async function yeniZiyaretciKaydet(ziyaretcilerArray: ZiyaretciVerisi[], tarih: string, saat: string) {
  // 1. ZAMAN KONTROLÜ (SUNUCU TARAFI) - HACKER KİLİDİ
  const zamanDurumu = gecmisZamaniEngelle(tarih, saat);
  if (!zamanDurumu.izinVer) {
    return { basarili: false, mesaj: "Sistem Reddi: Geçmiş zamana kayıt açılamaz!" };
  }

  // 2. GÜVENLİ VERİTABANI BAĞLANTISI (Senin guvenlik.ts dosyasındaki kusursuz yapın)
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; }
      }
    }
  );

  // 2.5. ZORUNLU KİMLİK + ROL KONTROLÜ
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { basarili: false, mesaj: "Yetkisiz işlem: Lütfen giriş yapın." };
  }

  const { data: profil, error: profilError } = await supabase
    .from("profiller")
    .select("rol, sicil_no, kampus_id")
    .eq("id", user.id)
    .single();

  if (profilError || !profil || !["personel", "guvenlik", "admin"].includes(profil.rol)) {
    return { basarili: false, mesaj: "Yetkisiz işlem: Bu formu doldurma yetkiniz yok." };
  }

  

  // ziyaret_edilecek_kisi: DB ve taleplerim ekranı sicil (veya e-posta ön eki) ile eşleşiyor; frontend değerine güvenilmez.
    
    const ziyaretEdilecekKisi = (profil.sicil_no || user.email?.split("@")[0] || "").trim();
    if (!ziyaretEdilecekKisi) {
      return { basarili: false, mesaj: "Profil kimlik bilgisi (sicil) eksik; kayıt yapılamıyor." };
    }
  
    const guvenliKayitlar: GuvenliTalepInsert[] = ziyaretcilerArray.map((kayit): GuvenliTalepInsert => ({
      ...kayit,
      ziyaret_edilecek_kisi: ziyaretEdilecekKisi,
      // Personel hangi kampüsü seçtiyse onu kullan, admin ise zaten geleni kullan
      kampus_id: kayit.kampus_id || profil.kampus_id,
    }));
  
    // 3. KAYIT İŞLEMİ (Senin tumZiyaretciler dizini buraya basıyoruz)
    const { error } = await supabase.from("talepler").insert(guvenliKayitlar);
  
    if (error) {
      return { basarili: false, mesaj: error.message };
    }
  
    return { basarili: true, mesaj: "Kayıt başarıyla oluşturuldu!" }; 
  }