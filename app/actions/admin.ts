"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from "@supabase/supabase-js";
import { hizSiniriAsildi } from "@/lib/guvenlik/rateLimit";

/**
 * İdari Server Action yanıt sözleşmesi.
 *
 * **İş Kuralı (Business Logic):** THY idari operasyon ekranındaki kampüs atama ve benzeri
 * yönetim işlemlerinin sonucunu standart biçimde arayüze iletir; başarı/hata ayrımı operasyon
 * personelinin anlık geri bildirim almasını sağlar.
 *
 * **Yetki (Access Control):** Bu tip yalnızca `admin` rolüyle çağrılan action çıktılarında
 * kullanılır; istemci tarafında yetki doğrulaması yerine geçmez.
 */
export interface AdminIslemSonuc {
  basarili: boolean;
  mesaj: string;
}

/**
 * Oturum sahibinin `profiller` tablosundan okunan minimal yetki görünümü.
 *
 * **İş Kuralı (Business Logic):** İdari müdahale öncesi işlemi başlatan kullanıcının kurumsal
 * rolünün (`admin`) doğrulanması için kullanılır; tam profil yükü taşınmaz.
 *
 * **Yetki (Access Control):** Sunucu tarafında `admin` kontrolü için iç veri modeli; dışa
 * doğrudan API olarak açılmaz.
 */
export interface ProfilRolOzeti {
  rol: string;
}

/**
 * Güvenlik personeline kampüs bağlama güncellemesinin veritabanı gövdesi.
 *
 * **İş Kuralı (Business Logic):** THY kampüs bazlı güvenlik görevlendirmesinde, idari birimin
 * güvenlik personelini fiziksel lokasyona (kampüs) atamasını `profiller.kampus_id` üzerinden
 * kalıcılaştırır.
 *
 * **Yetki (Access Control):** Yalnızca doğrulanmış `admin` oturumuyla üretilir; RLS politikası
 * güncellemeyi reddederse işlem sessizce başarısız sayılır.
 */
export interface ProfilKampusGuncellePayload {
  kampus_id: string | null;
}

const GENEL_HATA_MESAJI = "İşlem sırasında sistemsel bir hata oluştu. Lütfen tekrar deneyin.";
const HIZ_SINIRI_MESAJI = "Çok sık istek gönderildi. Lütfen kısa süre bekleyip tekrar deneyin.";

function hataMesajiAl(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "string" ? error : String(error);
}

/**
 * Admin oturumu doğrular ve yetkili bir Supabase client döndürür.
 * Yetki yoksa { supabase: null, hata } döner — çağıran action güvenli mesajı iletir.
 */
async function adminClientGetir(): Promise<
  | { supabase: SupabaseClient; user: { id: string }; hata: null }
  | { supabase: null; user: null; hata: string }
> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name: string) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return { supabase: null, user: null, hata: "Oturum bulunamadı, lütfen tekrar giriş yapın." };
  }

  const { data: profil, error: profilError } = await supabase
    .from("profiller")
    .select("rol")
    .eq("id", user.id)
    .single();

  if (profilError || !profil || profil.rol !== "admin") {
    return { supabase: null, user: null, hata: "Güvenlik İhlali: Bu işlem için 'Admin' yetkiniz bulunmuyor!" };
  }

  return { supabase, user: { id: user.id }, hata: null };
}

/**
 * Güvenlik personelinin görev kampüsünü idari olarak günceller.
 *
 * **Yetki (Access Control):** Yalnızca `admin` rolü; hedef kayıt yalnızca `guvenlik` olabilir.
 */
export async function personelKampusGuncelle(
  personelId: string,
  yeniKampusId: string | null
): Promise<AdminIslemSonuc> {
  try {
    const { supabase, hata } = await adminClientGetir();

    if (!supabase) return { basarili: false, mesaj: hata };

    const { data: hedefProfil, error: hedefHata } = await supabase
      .from("profiller")
      .select("rol")
      .eq("id", personelId)
      .single();

    if (hedefHata || !hedefProfil) return { basarili: false, mesaj: "Personel bulunamadı." };
    if (hedefProfil.rol !== "guvenlik") {
      return { basarili: false, mesaj: "Sadece güvenlik personelinin kampüsü değiştirilebilir." };
    }

    const guncelleme: ProfilKampusGuncellePayload = { kampus_id: yeniKampusId };
    const { data: guncellenenVeri, error: updateError } = await supabase
      .from("profiller")
      .update(guncelleme)
      .eq("id", personelId)
      .select("id");

    if (updateError) {
      console.error("[personelKampusGuncelle] update hatası:", updateError.message);
      return { basarili: false, mesaj: GENEL_HATA_MESAJI };
    }

    if (!guncellenenVeri || guncellenenVeri.length === 0) {
      return {
        basarili: false,
        mesaj: "Veritabanı reddetti: kayıt bulunamadı veya güncelleme izni yok.",
      };
    }

    return { basarili: true, mesaj: "Personel kampüsü başarıyla güncellendi." };
  } catch (error: unknown) {
    console.error("[personelKampusGuncelle] beklenmeyen hata:", hataMesajiAl(error));
    return { basarili: false, mesaj: GENEL_HATA_MESAJI };
  }
}

/**
 * Yeni kampüs ekler. (admin)
 */
export async function kampusEkle(isim: string): Promise<AdminIslemSonuc> {
  try {
    const { supabase, user, hata } = await adminClientGetir();
    if (!supabase) return { basarili: false, mesaj: hata }; 

    if (hizSiniriAsildi(`admin-kampus-ekle:${user.id}`, 10, 60_000)) {
      return { basarili: false, mesaj: HIZ_SINIRI_MESAJI };
    }

    const temizIsim = (isim || "").trim().toUpperCase();
    if (!temizIsim) return { basarili: false, mesaj: "Kampüs adı boş olamaz." };

    const { data, error } = await supabase
      .from("kampusler")
      .insert({ isim: temizIsim })
      .select("id");

    if (error) {
      console.error("[kampusEkle] insert hatası:", error.message);
      if (error.code === "23505") return { basarili: false, mesaj: "Bu isimde bir kampüs zaten mevcut." };
      return { basarili: false, mesaj: GENEL_HATA_MESAJI };
    }

    if (!data || data.length === 0) {
      return { basarili: false, mesaj: "Kampüs eklenemedi: yazma izni reddedildi." };
    }

    return { basarili: true, mesaj: "Kampüs başarıyla eklendi." };
  } catch (error: unknown) {
    console.error("[kampusEkle] beklenmeyen hata:", hataMesajiAl(error));
    return { basarili: false, mesaj: GENEL_HATA_MESAJI };
  }
}

/**
 * Kampüs siler. (admin) — bağlı kayıt varsa FK ihlali güvenli mesaja çevrilir.
 */
export async function kampusSil(kampusId: number): Promise<AdminIslemSonuc> {
  try {
    const { supabase, user, hata } = await adminClientGetir();
    if (!supabase) return { basarili: false, mesaj: hata };

    if (hizSiniriAsildi(`admin-kampus-sil:${user.id}`, 10, 60_000)) {
      return { basarili: false, mesaj: HIZ_SINIRI_MESAJI };
    }

    if (!kampusId) return { basarili: false, mesaj: "Geçersiz kampüs." };

    const { data, error } = await supabase
      .from("kampusler")
      .delete()
      .eq("id", kampusId)
      .select("id");

    if (error) {
      console.error("[kampusSil] delete hatası:", error.message);
      if (error.code === "23503") {
        return { basarili: false, mesaj: "Bu kampüse bağlı kayıtlar olduğu için silinemiyor." };
      }
      return { basarili: false, mesaj: GENEL_HATA_MESAJI };
    }

    if (!data || data.length === 0) {
      return { basarili: false, mesaj: "Kampüs bulunamadı veya silme izniniz yok." };
    }

    return { basarili: true, mesaj: "Kampüs başarıyla silindi." };
  } catch (error: unknown) {
    console.error("[kampusSil] beklenmeyen hata:", hataMesajiAl(error));
    return { basarili: false, mesaj: GENEL_HATA_MESAJI };
  }
}