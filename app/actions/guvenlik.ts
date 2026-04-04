"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. TEKİL İŞLEM (Giriş Ver / Çıkış Yap / Reddet)
export async function guvenlikIslemi(talepId: number, yeniDurum: string, redNedeni: string = "") {
  const cookieStore = await cookies(); // BURAYA 'await' EKLEDİK (Hata buradaydı)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        get(name: string) { return cookieStore.get(name)?.value; } 
      } 
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Giriş yetkiniz yok!");

  const { data: profil } = await supabase.from('profiller').select('tam_ad, rol').eq('id', user.id).single();
  if (!profil || (profil.rol !== 'guvenlik' && profil.rol !== 'admin')) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok!");
  }

  const payload: any = { durum: yeniDurum, islem_yapan_guvenlik: profil.tam_ad };
  if (yeniDurum === 'reddedildi') payload.red_nedeni = redNedeni;

  const { error } = await supabase.from('talepler').update(payload).eq('id', talepId);
  if (error) throw new Error("Güncelleme başarısız: " + error.message);

  // KARAKUTU LOG
  await supabase.from('audit_log').insert({
    kullanici_id: user.id,
    kullanici_email: user.email,
    kullanici_rol: profil.rol,
    islem: yeniDurum,
    tablo_adi: 'talepler',
    kayit_id: String(talepId),
    eski_deger: { bilgi: "Güvenli Sunucu İşlemi" },
    yeni_deger: payload,
    aciklama: `[ZIRHLI ONAY] ${profil.tam_ad} personeli, ${talepId} ID'li talebi '${yeniDurum}' yaptı.`
  });

  return { success: true };
}

// 2. TOPLU İŞLEM
export async function topluGuvenlikIslemi(talepIdListesi: number[]) {
  const cookieStore = await cookies(); // BURAYA DA 'await' EKLEDİK (Hata buradaydı)
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { 
      cookies: { 
        get(name: string) { return cookieStore.get(name)?.value; } 
      } 
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Yetkisiz işlem!");

  const { data: profil } = await supabase.from('profiller').select('tam_ad, rol').eq('id', user.id).single();
  if (!profil || (profil.rol !== 'guvenlik' && profil.rol !== 'admin')) throw new Error("Yetkisiz işlem!");

  const payload = { durum: 'cikis_yapti', islem_yapan_guvenlik: profil.tam_ad };
  const { error } = await supabase.from('talepler').update(payload).in('id', talepIdListesi);
  if (error) throw new Error(error.message);

  return { success: true };
}