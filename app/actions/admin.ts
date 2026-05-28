"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

function hataMesajiAl(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : String(error);
}

/**
 * Güvenlik personelinin görev kampüsünü idari olarak günceller.
 *
 * **İş Kuralı (Business Logic):** THY Güvenlik Direktörlüğü operasyonunda, idari personelin
 * güvenlik görevlisini doğru kampüs kapısına / operasyon alanına atamasını sağlar; yanlış kampüs
 * ataması ziyaretçi giriş-çıkış sürecinde yetki ihlali riski doğurur.
 *
 * **Yetki (Access Control):** Yalnızca oturum açmış ve `profiller.rol = 'admin'` olan THY idari
 * personeli. Hedef kayıt yalnızca `guvenlik` rolündeki personel olabilir.
 *
 * @param personelId - Güncellenecek güvenlik personelinin `profiller.id` (UUID); KVKK kapsamında
 *   kişisel tanımlayıcıdır, istemci tarafında doğrulanmış oturumla eşleştirilir.
 * @param yeniKampusId - Atanacak kampüs tanımlayıcısı (`kampusler` FK); `null` görevden çekme
 *   senaryosu için kullanılabilir. Sunucu RLS ile yazma yetkisini ikinci kez doğrular.
 * @returns İşlem sonucu; `basarili: false` durumunda `mesaj` kullanıcıya gösterilir, ayrıntılı
 *   DB/RLS hataları istemciye sızdırılmadan genelleştirilir.
 */
export async function personelKampusGuncelle(
  personelId: string,
  yeniKampusId: string | null
): Promise<AdminIslemSonuc> {
  try {
    // Senin sistemindeki standart Supabase başlatma kodları
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

    // 1. KİMLİK DOĞRULAMA: İşlemi yapan kim?
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { basarili: false, mesaj: "Oturum bulunamadı, lütfen tekrar giriş yapın." };
    }

    // 2. YETKİ KONTROLÜ: Bu kişi gerçekten Admin mi?
    const { data: profil, error: profilError } = await supabase
      .from("profiller")
      .select("rol")
      .eq("id", user.id)
      .single();

    if (profilError || !profil || profil.rol !== "admin") {
      return { basarili: false, mesaj: "Güvenlik İhlali: Bu işlem için 'Admin' yetkiniz bulunmuyor!" };
    }

// Güncellenecek kişi sadece "guvenlik" rolünde olmalı
const { data: hedefProfil, error: hedefHata } = await supabase
  .from("profiller")
  .select("rol")
  .eq("id", personelId)
  .single();

if (hedefHata || !hedefProfil) {
  return { basarili: false, mesaj: "Personel bulunamadı." };
}

if (hedefProfil.rol !== "guvenlik") {
  return { basarili: false, mesaj: "Sadece güvenlik personelinin kampüsü değiştirilebilir." };
}
    // 3. ASIL İŞLEM VE FATURA KONTROLÜ
    // Güncellemeyi yap ve .select('id') ile dönen satırları geri iste!
    const guncelleme: ProfilKampusGuncellePayload = { kampus_id: yeniKampusId };
    const { data: guncellenenVeri, error: updateError } = await supabase
      .from("profiller")
      .update(guncelleme)
      .eq("id", personelId)
      .select("id"); // İŞTE BÜYÜ BURADA: "Kimi güncelledin, kanıt göster!"

    if (updateError) {
      throw new Error(updateError.message);
    }

    // 4. SESSİZ BAŞARISIZLIK (SILENT FAILURE) KONTROLÜ
    // Eğer Supabase RLS duvarı bizi engellerse, hata vermez ama 0 satır döner.
    if (!guncellenenVeri || guncellenenVeri.length === 0) {
      return { 
        basarili: false, 
        mesaj: "Veritabanı reddetti! Personel bulunamadı veya RLS (Güvenlik) duvarı güncellemeye izin vermedi." 
      };
    }

    // Her şey kusursuzsa onayı ver.
    return { basarili: true, mesaj: "Personel kampüsü başarıyla güncellendi." };

  } catch (error: unknown) {
    console.error("Kampüs Güncelleme Hatası:", error);
    return { basarili: false, mesaj: "Sistemsel bir hata: " + hataMesajiAl(error) };
  }
}