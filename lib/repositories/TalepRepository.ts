"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/Provider";
import { maskeleTC, maskeleTelefon } from "@/lib/formatlayici";
import { getTRMidnightISO } from "@/lib/zaman";

const GENEL_HATA_MESAJI = "Veriler getirilirken sistemsel bir hata oluştu.";

/**
 * Ortak kolon seti. PII (tc/gsm) DB'den çekilir ama yalnızca maskelenip DTO'ya girer.
 * select('*') YOK — veri minimizasyonu.
 */
const TALEP_SECIM_KOLONLARI =
  "id, ziyaretci_ad_soyad, ziyaretci_tc, ziyaretci_gsm, durum, ziyaret_tarihi, ziyaret_saati, plaka, firma_bilgisi, ziyaret_nedeni, red_nedeni, bitis_tarihi, kampus_id, kampusler(isim)";

/**
 * Tarayıcıya inen güvenli görünüm. HAM TC / GSM ASLA bu nesnede yer almaz.
 * UI yalnızca bu alanları görür; maskeleme sunucuda kesinleşir.
 */
export interface TalepDTO {
  id: number;
  ziyaretci_ad_soyad: string;
  ziyaretci_tc_maskeli: string;
  ziyaretci_gsm_maskeli: string;
  durum: string;
  kampus_isim: string;
  ziyaret_tarihi: string;
  ziyaret_saati: string;
  plaka: string | null;
  firma_bilgisi: string | null;
  ziyaret_nedeni: string | null;
  red_nedeni: string | null;
  bitis_tarihi: string | null;
}

/** Supabase'ten dönen ham satır (sunucu-içi; dışarı sızmaz). */
interface TalepHamSatir {
  id: number;
  ziyaretci_ad_soyad: string | null;
  ziyaretci_tc: string | null;
  ziyaretci_gsm: string | null;
  durum: string;
  ziyaret_tarihi: string;
  ziyaret_saati: string;
  plaka: string | null;
  firma_bilgisi: string | null;
  ziyaret_nedeni: string | null;
  red_nedeni: string | null;
  bitis_tarihi: string | null;
  kampus_id: number | null;
  kampusler: { isim: string } | { isim: string }[] | null;
}

function kampusIsmiCoz(kampusler: TalepHamSatir["kampusler"]): string {
  if (!kampusler) return "-";
  return Array.isArray(kampusler) ? (kampusler[0]?.isim ?? "-") : kampusler.isim;
}

/** Ham satırı maskelenmiş DTO'ya çevirir (PII izolasyonu). */
function haritalaDTO(satir: TalepHamSatir): TalepDTO {
  return {
    id: satir.id,
    ziyaretci_ad_soyad: satir.ziyaretci_ad_soyad ?? "-",
    ziyaretci_tc_maskeli: maskeleTC(satir.ziyaretci_tc ?? ""),
    ziyaretci_gsm_maskeli: maskeleTelefon(satir.ziyaretci_gsm ?? ""),
    durum: satir.durum,
    kampus_isim: kampusIsmiCoz(satir.kampusler),
    ziyaret_tarihi: satir.ziyaret_tarihi,
    ziyaret_saati: satir.ziyaret_saati,
    plaka: satir.plaka,
    firma_bilgisi: satir.firma_bilgisi,
    ziyaret_nedeni: satir.ziyaret_nedeni,
    red_nedeni: satir.red_nedeni,
    bitis_tarihi: satir.bitis_tarihi,
  };
}

/**
 * Bir kampüsteki AKTİF ziyaretçi taleplerini maskelenmiş DTO olarak döndürür.
 *
 * Yetki & kampüs zırhı (sunucu-otoritesi):
 * - `guvenlik`: `istenenKampusId` yok sayılır, yalnızca kendi `kampusId`'si okunur.
 * - `admin`: `istenenKampusId` kullanılır (panelde seçtiği kampüs).
 * - diğer roller / oturumsuz: hata.
 *
 * @param istenenKampusId - admin için hedef kampüs; guvenlik için yok sayılır.
 */
export async function getAktifTalepler(
  istenenKampusId: number | null
): Promise<TalepDTO[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
  if (user.rol !== "guvenlik" && user.rol !== "admin") {
    throw new Error("Bu veriyi görüntüleme yetkiniz yok.");
  }

  const hedefKampusId = user.rol === "guvenlik" ? user.kampusId : istenenKampusId;
  if (!hedefKampusId) return [];

  const bugunISO = getTRMidnightISO();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talepler")
    .select(TALEP_SECIM_KOLONLARI)
    .eq("kampus_id", hedefKampusId)
    .or(
      `durum.eq.iceride,and(durum.in.(cikis_yapti,reddedildi),son_islem_tarihi.gte.${bugunISO}),and(durum.eq.onaylandi,ziyaret_tarihi.gte.${bugunISO}),and(durum.eq.onaylandi,bitis_tarihi.gte.${bugunISO})`
    )
    .order("ziyaret_tarihi", { ascending: true });

  if (error) {
    console.error("[getAktifTalepler] sorgu hatası:", error.message);
    throw new Error(GENEL_HATA_MESAJI);
  }

  const satirlar = (data ?? []) as TalepHamSatir[];
  return satirlar.map(haritalaDTO);
}

/**
 * Oturum sahibi personelin KENDİ açtığı ziyaret taleplerini döndürür (taleplerim ekranı).
 *
 * GÜVENLİK: sicil istemciden ALINMAZ. `ziyaret_edilecek_kisi` filtresi, kimliği doğrulanmış
 * kullanıcının `sicilNo`'su ile kurulur.
 */
export async function getTaleplerimForPersonel(): Promise<TalepDTO[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
  if (!user.sicilNo) throw new Error("Profil kimlik bilgisi (sicil) eksik.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("talepler")
    .select(TALEP_SECIM_KOLONLARI)
    .eq("ziyaret_edilecek_kisi", user.sicilNo)
    .order("id", { ascending: false });

  if (error) {
    console.error("[getTaleplerimForPersonel] sorgu hatası:", error.message);
    throw new Error(GENEL_HATA_MESAJI);
  }

  return ((data ?? []) as TalepHamSatir[]).map(haritalaDTO);
}

export type ZamanFiltresi = "bugun" | "gelecek" | "gecmis" | "tumu";

/**
 * İdari panel için talepleri zaman + (opsiyonel) kampüs filtresiyle döndürür.
 *
 * Yetki: yalnızca `admin`. `kampusId === null` → tüm kampüsler ("hepsi").
 */
export async function getIdariTalepler(
  kampusId: number | null,
  zamanFiltresi: ZamanFiltresi
): Promise<TalepDTO[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı, lütfen tekrar giriş yapın.");
  if (user.rol !== "admin") throw new Error("Bu veriyi görüntüleme yetkiniz yok.");

  const supabase = await createClient();
  const bugunTarihi = getTRMidnightISO().slice(0, 10);

  let query = supabase.from("talepler").select(TALEP_SECIM_KOLONLARI);

  if (kampusId !== null) query = query.eq("kampus_id", kampusId);

  if (zamanFiltresi === "bugun") {
    query = query.eq("ziyaret_tarihi", bugunTarihi);
  } else if (zamanFiltresi === "gelecek") {
    query = query.gt("ziyaret_tarihi", bugunTarihi);
  } else if (zamanFiltresi === "gecmis") {
    query = query.lt("ziyaret_tarihi", bugunTarihi).limit(500);
  } else {
    query = query.limit(1000);
  }

  query = query.order("ziyaret_tarihi", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("[getIdariTalepler] sorgu hatası:", error.message);
    throw new Error(GENEL_HATA_MESAJI);
  }

  return ((data ?? []) as TalepHamSatir[]).map(haritalaDTO);
}

/**
 * Güvenlik paneli realtime delta'sı için: TEK kaydın maskelenmiş DTO'su.
 * Aynı yetki + kampüs zırhı + "aktif" filtresini uygular.
 * Kayıt kapsam dışındaysa (başka kampüs / artık aktif değil) → null (istemci listeden düşürür).
 */
export async function getAktifTalepById(
  id: number,
  istenenKampusId: number | null
): Promise<TalepDTO | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı.");
  if (user.rol !== "guvenlik" && user.rol !== "admin") throw new Error("Yetkiniz yok.");

  const hedefKampusId = user.rol === "guvenlik" ? user.kampusId : istenenKampusId;
  if (!hedefKampusId) return null;

  const supabase = await createClient();
  const bugunISO = getTRMidnightISO();

  const { data, error } = await supabase
    .from("talepler")
    .select(TALEP_SECIM_KOLONLARI)
    .eq("id", id)
    .eq("kampus_id", hedefKampusId)
    .or(
      `durum.eq.iceride,and(durum.in.(cikis_yapti,reddedildi),son_islem_tarihi.gte.${bugunISO}),and(durum.eq.onaylandi,ziyaret_tarihi.gte.${bugunISO}),and(durum.eq.onaylandi,bitis_tarihi.gte.${bugunISO})`
    )
    .maybeSingle();

  if (error) {
    console.error("[getAktifTalepById] sorgu hatası:", error.message);
    throw new Error(GENEL_HATA_MESAJI);
  }
  return data ? haritalaDTO(data as TalepHamSatir) : null;
}

/**
 * İdari panel realtime delta'sı için: TEK kaydın maskelenmiş DTO'su.
 * Aynı admin yetkisi + (opsiyonel) kampüs + zaman filtresini uygular; kapsam dışıysa null.
 */
export async function getIdariTalepById(
  id: number,
  kampusId: number | null,
  zamanFiltresi: ZamanFiltresi
): Promise<TalepDTO | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Oturum bulunamadı.");
  if (user.rol !== "admin") throw new Error("Yetkiniz yok.");

  const supabase = await createClient();
  const bugunTarihi = getTRMidnightISO().slice(0, 10);

  let query = supabase.from("talepler").select(TALEP_SECIM_KOLONLARI).eq("id", id);
  if (kampusId !== null) query = query.eq("kampus_id", kampusId);

  if (zamanFiltresi === "bugun") query = query.eq("ziyaret_tarihi", bugunTarihi);
  else if (zamanFiltresi === "gelecek") query = query.gt("ziyaret_tarihi", bugunTarihi);
  else if (zamanFiltresi === "gecmis") query = query.lt("ziyaret_tarihi", bugunTarihi);

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("[getIdariTalepById] sorgu hatası:", error.message);
    throw new Error(GENEL_HATA_MESAJI);
  }
  return data ? haritalaDTO(data as TalepHamSatir) : null;
}
