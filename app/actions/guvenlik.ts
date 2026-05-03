"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  kaydetZiyaretciGuvenlikLoglari,
  kaydetZiyaretKutusuLoglari,
  ziyaretKutusuIslemTipi,
} from "@/lib/audit";

// 1. TEKİL İŞLEM (Giriş Ver / Çıkış Yap / Reddet)
export async function guvenlikIslemi(talepId: number, yeniDurum: string, redNedeni: string = "") {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Giriş yetkiniz yok!");

  // GÜNCELLEME 1: kampus_id çekiliyor
  const { data: profil } = await supabase.from('profiller').select('tam_ad, rol, kampus_id').eq('id', user.id).single();
  if (!profil || (profil.rol !== 'guvenlik' && profil.rol !== 'admin')) {
    throw new Error("Bu işlemi yapmaya yetkiniz yok!");
  }

  const payload: any = { durum: yeniDurum, islem_yapan_guvenlik: profil.tam_ad };
  if (yeniDurum === 'reddedildi') payload.red_nedeni = redNedeni;

  // GÜNCELLEME 2: Kampüs Zırhı
  let sorgu = supabase.from('talepler').update(payload).eq('id', talepId);
  
  // Eğer admin değil, düz güvenlik görevlisiyse sadece kendi kampüsüne işlem yapabilir
  if (profil.rol === 'guvenlik') {
    sorgu = sorgu.eq('kampus_id', profil.kampus_id);
  }

  // update işlemi sonrası güncellenen kaydı görmek için select() ekledik
  const { data, error } = await sorgu.select(); 

  if (error) throw new Error("Güncelleme başarısız: " + error.message);
  
  // Eğer kayıt güncellenmemişse, ya ID yanlıştır ya da başka kampüse aittir!
  if (!data || data.length === 0) {
    throw new Error("Güvenlik İhlali: Bu işlem sizin kampüsünüze ait değil!");
  }

  const satir = data[0];
  await kaydetZiyaretciGuvenlikLoglari(supabase, [
    {
      talepId: talepId,
      ziyaretciTc: satir.ziyaretci_tc ?? null,
      ziyaretciAdSoyad: satir.ziyaretci_ad_soyad ?? null,
      islemTipi: yeniDurum,
      islemDetayiEk: yeniDurum === "reddedildi" ? redNedeni : "",
      islemYapanPersonel: profil.tam_ad,
    },
  ]);

  await kaydetZiyaretKutusuLoglari(supabase, [
    {
      talepId,
      islemTipi: ziyaretKutusuIslemTipi(yeniDurum),
      islemYapanPersonel: profil.tam_ad,
    },
  ]);

  return { success: true };
}

// 2. TOPLU İŞLEM
export async function topluGuvenlikIslemi(talepIdListesi: number[]) {
  const cookieStore = await cookies(); 
  if (talepIdListesi.length > 50) throw new Error("Güvenlik Sınırı: Tek seferde en fazla 50 işlem yapabilirsiniz!");
  
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

  // GÜNCELLEME 3: kampus_id çekiliyor
  const { data: profil } = await supabase.from('profiller').select('tam_ad, rol, kampus_id').eq('id', user.id).single();
  if (!profil || (profil.rol !== 'guvenlik' && profil.rol !== 'admin')) throw new Error("Yetkisiz işlem!");

  const payload = { durum: 'cikis_yapti', islem_yapan_guvenlik: profil.tam_ad };
  
  // GÜNCELLEME 4: Kampüs Zırhı (Toplu)
  let sorgu = supabase.from('talepler').update(payload).in('id', talepIdListesi);

  if (profil.rol === 'guvenlik') {
    sorgu = sorgu.eq('kampus_id', profil.kampus_id);
  }

  // Sessiz başarısızlığı önlemek için güncellenen kayıtları doğrula
  const { data, error } = await sorgu.select("id, ziyaretci_tc, ziyaretci_ad_soyad");
  if (error) throw new Error("Toplu güncelleme başarısız: " + error.message);
  if (!data || data.length === 0) {
    throw new Error("Güvenlik İhlali: Seçili kayıtlar için yetkiniz yok veya kayıtlar bulunamadı!");
  }

  await kaydetZiyaretciGuvenlikLoglari(
    supabase,
    data.map((satir) => ({
      talepId: satir.id,
      ziyaretciTc: satir.ziyaretci_tc ?? null,
      ziyaretciAdSoyad: satir.ziyaretci_ad_soyad ?? null,
      islemTipi: "cikis_yapti",
      islemDetayiEk: "",
      islemYapanPersonel: profil.tam_ad,
    }))
  );

  await kaydetZiyaretKutusuLoglari(
    supabase,
    data.map((satir) => ({
      talepId: satir.id,
      islemTipi: ziyaretKutusuIslemTipi("cikis_yapti"),
      islemYapanPersonel: profil.tam_ad,
    }))
  );

  return { success: true };
}