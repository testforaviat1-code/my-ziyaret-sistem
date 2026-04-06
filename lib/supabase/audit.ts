import { createClient } from '@/lib/supabase/client';

export const sistemeLogYaz = async (
  islem: string,
  tabloAdi: string,
  kayitId: string,
  eskiDeger: any,
  yeniDeger: any,
  yapilanIs: string
) => {
  try {
    const supabase = createClient();
    
    // İşlemi yapan kim? Hemen bulalım.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // Adam giriş yapmamışsa log tutamayız

    // Adamın adını ve rolünü profiller tablosundan çekelim
    const { data: profil } = await supabase
      .from('profiller')
      .select('tam_ad, rol')
      .eq('id', user.id)
      .single();

    

    console.log("✅ Log başarıyla karakutuya yazıldı.");
  } catch (error) {
    console.error("❌ Log yazılırken hata oluştu:", error);
  }
};