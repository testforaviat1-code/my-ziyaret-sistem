"use server";

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function personelKampusGuncelle(personelId: string, yeniKampusId: string | null) {
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

    // 3. ASIL İŞLEM VE FATURA KONTROLÜ
    // Güncellemeyi yap ve .select('id') ile dönen satırları geri iste!
    const { data: guncellenenVeri, error: updateError } = await supabase
      .from("profiller")
      .update({ kampus_id: yeniKampusId })
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

  } catch (error: any) {
    console.error("Kampüs Güncelleme Hatası:", error);
    return { basarili: false, mesaj: "Sistemsel bir hata: " + error.message };
  }
}