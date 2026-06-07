"use server";

import { gecmisZamaniEngelle } from "@/lib/supabase/zamanKontrol";
import { hizSiniriAsildi } from "@/lib/guvenlik/rateLimit";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const GENEL_HATA_MESAJI = "İşlem sırasında sistemsel bir hata oluştu. Lütfen tekrar deneyin.";
const MAX_BATCH = 20;
const HIZ_SINIRI_MESAJI = "Çok sık istek gönderildi. Lütfen kısa süre bekleyip tekrar deneyin.";

/** Sunucu tarafı metin uzunluğu sınırı (DoS / aşırı payload). */
function kirp(deger: string | null | undefined, maxUzunluk: number): string {
  return String(deger ?? "").trim().slice(0, maxUzunluk);
}

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
type GuvenliTalepInsert = Omit<ZiyaretciVerisi, "durum" | "ziyaret_edilecek_kisi"> & {
  durum: "onaylandi";
  ziyaret_edilecek_kisi: string;
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

  if (hizSiniriAsildi(`ziyaretci-kayit:${user.id}`, 5, 60_000)) {
    return { basarili: false, mesaj: HIZ_SINIRI_MESAJI };
  }

  if (!Array.isArray(ziyaretcilerArray) || ziyaretcilerArray.length === 0) {
    return { basarili: false, mesaj: "En az bir ziyaretçi kaydı gerekli." };
  }
  if (ziyaretcilerArray.length > MAX_BATCH) {
    return { basarili: false, mesaj: `Tek seferde en fazla ${MAX_BATCH} ziyaretçi kaydedilebilir.` };
  }

  const ziyaretEdilecekKisi = (profil.sicil_no || user.email?.split("@")[0] || "").trim();
  if (!ziyaretEdilecekKisi) {
    return { basarili: false, mesaj: "Profil kimlik bilgisi (sicil) eksik; kayıt yapılamıyor." };
  }
// --- TC / GSM format doğrulaması (sunucu tarafı) ---
  // Kesmeden önce ham değeri doğrula; geçersiz formatlı kayıt DB'ye yazılmaz.
  for (const kayit of ziyaretcilerArray) {
    const tc = String(kayit.ziyaretci_tc ?? "").trim();
    const gsm = String(kayit.ziyaretci_gsm ?? "").trim().replace(/\s/g, "");

    if (!/^\d{11}$/.test(tc) || tc[0] === "0") {
      return { basarili: false, mesaj: "Geçersiz TC Kimlik No. 11 haneli olmalıdır." };
    }
    if (!/^\d{10,11}$/.test(gsm)) {
      return { basarili: false, mesaj: "Geçersiz GSM numarası." };
    }
  }
  const guvenliTarih = kirp(tarih, 10);
  const guvenliSaat = kirp(saat, 32);

  const guvenliKayitlar: GuvenliTalepInsert[] = ziyaretcilerArray.map((kayit) => ({
    ziyaretci_ad_soyad: kirp(kayit.ziyaretci_ad_soyad, 120),
    ziyaretci_tc: kirp(kayit.ziyaretci_tc, 11),
    ziyaretci_gsm: kirp(kayit.ziyaretci_gsm, 20),
    ziyaret_nedeni: kirp(kayit.ziyaret_nedeni, 500),
    ziyaret_tarihi: kirp(kayit.ziyaret_tarihi, 10) || guvenliTarih,
    ziyaret_saati: kirp(kayit.ziyaret_saati, 32) || guvenliSaat,
    plaka: kirp(kayit.plaka, 20) || null,
    firma_bilgisi: kirp(kayit.firma_bilgisi, 200) || null,
    bitis_tarihi: kayit.bitis_tarihi ? kirp(kayit.bitis_tarihi, 10) : null,
    kampus_id: kayit.kampus_id ?? profil.kampus_id ?? null,
    durum: "onaylandi" as const,
    ziyaret_edilecek_kisi: ziyaretEdilecekKisi,
  }));

  const { error } = await supabase.from("talepler").insert(guvenliKayitlar);

  if (error) {
    console.error("[yeniZiyaretciKaydet] insert hatası:", error.message);
    return { basarili: false, mesaj: GENEL_HATA_MESAJI };
  }

  return { basarili: true, mesaj: "Kayıt başarıyla oluşturuldu!" };
}