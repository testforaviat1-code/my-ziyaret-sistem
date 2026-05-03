"use server";

import { gecmisZamaniEngelle } from "@/lib/supabase/zamanKontrol"; // Seninki supabase klasöründeydi, yolu böyle olmalı
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function yeniZiyaretciKaydet(ziyaretcilerArray: any[], tarih: string, saat: string) {
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

  if (profil.rol !== "admin" && (profil.kampus_id === null || profil.kampus_id === undefined)) {
    return { basarili: false, mesaj: "Profilinize atanmış bir yerleşke yok; kayıt açılamıyor." };
  }

  // ziyaret_edilecek_kisi: DB ve taleplerim ekranı sicil (veya e-posta ön eki) ile eşleşiyor; frontend değerine güvenilmez.
  const ziyaretEdilecekKisi = (profil.sicil_no || user.email?.split("@")[0] || "").trim();
  if (!ziyaretEdilecekKisi) {
    return { basarili: false, mesaj: "Profil kimlik bilgisi (sicil) eksik; kayıt yapılamıyor." };
  }

  const guvenliKayitlar = ziyaretcilerArray.map((kayit) => ({
    ...kayit,
    ziyaret_edilecek_kisi: ziyaretEdilecekKisi,
    kampus_id: profil.rol === "admin" ? kayit.kampus_id : profil.kampus_id,
  }));

  // 3. KAYIT İŞLEMİ (Senin tumZiyaretciler dizini buraya basıyoruz)
  const { error } = await supabase.from("talepler").insert(guvenliKayitlar);

  if (error) {
    return { basarili: false, mesaj: error.message };
  }

  return { basarili: true, mesaj: "Kayıt başarıyla oluşturuldu!" };
}