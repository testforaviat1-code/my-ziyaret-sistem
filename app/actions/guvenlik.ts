"use server";
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  kaydetZiyaretciGuvenlikLoglari,
  kaydetZiyaretKutusuLoglari,
  ziyaretKutusuIslemTipi,
} from "@/lib/audit";

function hataMesajiAl(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return typeof error === "string" ? error : String(error);
}

/**
 * Güvenlik kapısı işlemini yürüten personelin profil özeti.
 *
 * **İş Kuralı (Business Logic):** Ziyaretçi talebinin giriş, çıkış veya red adımlarında işlemi
 * yapan güvenlik personelinin adı ve kampüs kapsamı audit kayıtlarına ve `talepler` güncellemesine
 * bağlanır.
 *
 * **Yetki (Access Control):** `guvenlik` veya `admin` rolüyle oturum açmış kullanıcılar için
 * sunucu içi okuma modeli; kampüs zırhı `guvenlik` rolünde `kampus_id` ile sınırlanır.
 */
export interface ProfilGuvenlikOzeti {
  tam_ad: string | null;
  rol: string;
  kampus_id: number | null;
}

/**
 * Güvenlik panelinden `talepler` tablosuna yazılan durum güncelleme gövdesi.
 *
 * **İş Kuralı (Business Logic):** Onaylı ziyaretçinin fiziksel tesise girişi (`iceride`), çıkışı
 * (`cikis_yapti`) veya güvenlik reddi (`reddedildi`) operasyonel durumunu kayıt altına alır;
 * `islem_yapan_guvenlik` denetim izi için zorunludur.
 *
 * **Yetki (Access Control):** Yalnızca yetkili güvenlik veya admin Server Action içinde üretilir;
 * istemciden gelen durum değeri RLS ve kampüs filtresiyle birlikte değerlendirilir.
 */
export interface TalepGuvenlikGuncellePayload {
  durum: string;
  islem_yapan_guvenlik: string | null;
  red_nedeni?: string;
}

/**
 * Tekil güvenlik işlemi sonrası audit için seçilen ziyaretçi kimlik alanları.
 *
 * **İş Kuralı (Business Logic):** Kara kutu (`ziyaretci_loglari`) ve ziyaret kutusu loglarında
 * hangi ziyaretçi üzerinde işlem yapıldığının KVKK uyumlu şekilde izlenmesi için minimum alan
 * kümesi.
 *
 * **Yetki (Access Control):** Güncelleme başarılı olduktan sonra sunucu tarafında okunur;
 * tam TC/ad-soyad log tablosuna yazılır — görüntüleme katmanında maskeleme ayrı uygulanır.
 */
export interface TalepZiyaretciKimlikSatiri {
  ziyaretci_tc: string | null;
  ziyaretci_ad_soyad: string | null;
}

/**
 * Toplu çıkış işleminde güncellenen talep satırlarının seçim sonucu.
 *
 * **İş Kuralı (Business Logic):** Kapı önü veya operasyon merkezinde aynı anda birden fazla
 * ziyaretçinin çıkışının toplu işlenmesi; her satır için ayrı audit kaydı üretilir.
 *
 * **Yetki (Access Control):** `guvenlik` rolü yalnızca kendi `kampus_id` kapsamındaki satırları
 * alır; `admin` kurum politikasına göre genişletilmiş erişime sahip olabilir.
 */
export interface TalepTopluSecimSatiri extends TalepZiyaretciKimlikSatiri {
  id: number;
}

/**
 * Tek bir ziyaretçi talebinde güvenlik durum geçişi (giriş / çıkış / red).
 *
 * **İş Kuralı (Business Logic):** THY tesis güvenlik sürecinde, onaylı ziyaretçinin fiziksel
 * girişinin (`iceride`), çıkışının (`cikis_yapti`) veya güvenlik gerekçesiyle reddinin
 * (`reddedildi`) kayıt altına alınması; her adım `ziyaretci_loglari` ve `ziyaret_loglari` ile
 * denetlenebilir tutulur.
 *
 * **Yetki (Access Control):** `guvenlik` (yalnızca atanmış `kampus_id`) ve `admin` rolleri.
 * Oturumsuz veya `personel` rolü reddedilir.
 *
 * @param talepId - Güncellenecek `talepler.id`; yetkisiz ID ile kampüs zırhı 0 satır döndürür.
 * @param yeniDurum - Hedef operasyonel durum kodu; ret senaryosunda `reddedildi` beklenir.
 * @param redNedeni - `reddedildi` durumunda gerekçe metni; KVKK kapsamında işlem detayına yazılır.
 * @returns `{ success: true }` başarıda; hata durumunda `Error` fırlatılır (istemci genel mesaj gösterir).
 */
export async function guvenlikIslemi(talepId: number, yeniDurum: string, redNedeni: string = "") {
  try {
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

    const profilOzet = profil as ProfilGuvenlikOzeti;

    const payload: TalepGuvenlikGuncellePayload = { durum: yeniDurum, islem_yapan_guvenlik: profilOzet.tam_ad };
    if (yeniDurum === 'reddedildi') payload.red_nedeni = redNedeni;

    // GÜNCELLEME 2: Kampüs Zırhı
    let sorgu = supabase.from('talepler').update(payload).eq('id', talepId);

    // Eğer admin değil, düz güvenlik görevlisiyse sadece kendi kampüsüne işlem yapabilir
    if (profilOzet.rol === 'guvenlik') {
      sorgu = sorgu.eq('kampus_id', profilOzet.kampus_id);
    }

    // update işlemi sonrası güncellenen kaydı görmek için select() ekledik
    const { data, error } = await sorgu.select();

    if (error) throw new Error("Güncelleme başarısız: " + error.message);

    // Eğer kayıt güncellenmemişse, ya ID yanlıştır ya da başka kampüse aittir!
    if (!data || data.length === 0) {
      throw new Error("Güvenlik İhlali: Bu işlem sizin kampüsünüze ait değil!");
    }

    const satir = data[0] as TalepZiyaretciKimlikSatiri;
    await kaydetZiyaretciGuvenlikLoglari(supabase, [
      {
        talepId: talepId,
        ziyaretciTc: satir.ziyaretci_tc ?? null,
        ziyaretciAdSoyad: satir.ziyaretci_ad_soyad ?? null,
        islemTipi: yeniDurum,
        islemDetayiEk: yeniDurum === "reddedildi" ? redNedeni : "",
        islemYapanPersonel: profilOzet.tam_ad as string,
      },
    ]);

    await kaydetZiyaretKutusuLoglari(supabase, [
      {
        talepId,
        islemTipi: ziyaretKutusuIslemTipi(yeniDurum),
        islemYapanPersonel: profilOzet.tam_ad as string,
      },
    ]);

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) throw error;
    throw new Error(hataMesajiAl(error));
  }
}

/**
 * Seçili ziyaretçi taleplerinde toplu çıkış (`cikis_yapti`) işlemi.
 *
 * **İş Kuralı (Business Logic):** Yoğun çıkış saatlerinde güvenlik personelinin tek işlemle
 * birden fazla ziyaretçiyi tesisten çıkış olarak işaretlemesi; operasyonel süreyi kısaltır ve
 * tutarlı audit üretir.
 *
 * **Yetki (Access Control):** `guvenlik` (kampüs kısıtlı) ve `admin`. Liste başına en fazla 50
 * kayıt (kötüye kullanım ve kaynak tüketimi sınırı).
 *
 * @param talepIdListesi - Toplu güncellenecek `talepler.id` dizisi; boş veya yetkisiz ID'ler
 *   güvenlik ihlali mesajıyla reddedilir.
 * @returns `{ success: true }` tüm yetkili satırlar güncellendiğinde; aksi halde `Error`.
 */
export async function topluGuvenlikIslemi(talepIdListesi: number[]) {
  try {
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

    const profilOzet = profil as ProfilGuvenlikOzeti;

    const payload: TalepGuvenlikGuncellePayload = { durum: 'cikis_yapti', islem_yapan_guvenlik: profilOzet.tam_ad };

    // GÜNCELLEME 4: Kampüs Zırhı (Toplu)
    let sorgu = supabase.from('talepler').update(payload).in('id', talepIdListesi);

    if (profilOzet.rol === 'guvenlik') {
      sorgu = sorgu.eq('kampus_id', profilOzet.kampus_id);
    }

    // Sessiz başarısızlığı önlemek için güncellenen kayıtları doğrula
    const { data, error } = await sorgu.select("id, ziyaretci_tc, ziyaretci_ad_soyad");
    if (error) throw new Error("Toplu güncelleme başarısız: " + error.message);
    if (!data || data.length === 0) {
      throw new Error("Güvenlik İhlali: Seçili kayıtlar için yetkiniz yok veya kayıtlar bulunamadı!");
    }

    const satirlar = data as TalepTopluSecimSatiri[];

    await kaydetZiyaretciGuvenlikLoglari(
      supabase,
      satirlar.map((satir) => ({
        talepId: satir.id,
        ziyaretciTc: satir.ziyaretci_tc ?? null,
        ziyaretciAdSoyad: satir.ziyaretci_ad_soyad ?? null,
        islemTipi: "cikis_yapti",
        islemDetayiEk: "",
        islemYapanPersonel: profilOzet.tam_ad as string,
      }))
    );

    await kaydetZiyaretKutusuLoglari(
      supabase,
      satirlar.map((satir) => ({
        talepId: satir.id,
        islemTipi: ziyaretKutusuIslemTipi("cikis_yapti"),
        islemYapanPersonel: profilOzet.tam_ad as string,
      }))
    );

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof Error) throw error;
    throw new Error(hataMesajiAl(error));
  }
}
