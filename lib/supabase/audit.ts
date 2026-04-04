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

    // Ve bilgileri Karakutuya (audit_log) fırlatalım
    await supabase.from('audit_log').insert({
      kullanici_id: user.id,
      kullanici_email: user.email,
      kullanici_rol: profil?.rol || 'Bilinmiyor',
      islem: islem,
      tablo_adi: tabloAdi,
      kayit_id: String(kayitId),
      eski_deger: eskiDeger,
      yeni_deger: yeniDeger,
      aciklama: `${profil?.tam_ad || user.email} adlı personel: ${yapilanIs}`
    });

    console.log("✅ Log başarıyla karakutuya yazıldı.");
  } catch (error) {
    console.error("❌ Log yazılırken hata oluştu:", error);
  }
};