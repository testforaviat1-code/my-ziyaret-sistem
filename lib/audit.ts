import type { SupabaseClient } from "@supabase/supabase-js";

export type ZiyaretciGuvenlikLogSatir = {
  talepId: number;
  ziyaretciTc: string | null;
  ziyaretciAdSoyad: string | null;
  islemTipi: string;
  /** Örn. red nedeni; boş olabilir */
  islemDetayiEk: string;
  islemYapanPersonel: string;
};

/**
 * Güvenlik işlemleri için ziyaretci_loglari tablosuna yazar.
 * Tabloda yalnızca frontend'in kullandığı sütunlar varsayılır; "kim yaptı" bilgisi islem_detayi içine eklenir.
 */
export async function kaydetZiyaretciGuvenlikLoglari(
  supabase: SupabaseClient,
  kayitlar: ZiyaretciGuvenlikLogSatir[]
): Promise<void> {
  if (kayitlar.length === 0) return;

  const rows = kayitlar.map((k) => {
    const detayParcalari = [k.islemDetayiEk.trim(), `İşlem yapan: ${k.islemYapanPersonel}`].filter(
      Boolean
    );
    return {
      talep_id: k.talepId,
      ziyaretci_tc: k.ziyaretciTc,
      ziyaretci_ad_soyad: k.ziyaretciAdSoyad,
      islem_tipi: k.islemTipi,
      islem_detayi: detayParcalari.join(" | "),
    };
  });

  const { error } = await supabase.from("ziyaretci_loglari").insert(rows);
  if (error) {
    console.error("[audit] ziyaretci_loglari yazılamadı:", error.message);
  }
}

/** Eski client mantığı: kara kutu satırındaki okunabilir işlem etiketi */
export function ziyaretKutusuIslemTipi(durum: string): string {
  if (durum === "iceride") return "GİRİŞ";
  if (durum === "cikis_yapti") return "ÇIKIŞ";
  return durum.toUpperCase();
}

export type ZiyaretKutusuLogSatir = {
  talepId: number;
  islemTipi: string;
  islemYapanPersonel: string;
};

/** ziyaret_loglari (kara kutu) — yalnızca sunucudan çağrılmalı */
export async function kaydetZiyaretKutusuLoglari(
  supabase: SupabaseClient,
  kayitlar: ZiyaretKutusuLogSatir[]
): Promise<void> {
  if (kayitlar.length === 0) return;

  const rows = kayitlar.map((k) => ({
    talep_id: k.talepId,
    islem_tipi: k.islemTipi,
    islem_yapan_personel: k.islemYapanPersonel,
  }));

  const { error } = await supabase.from("ziyaret_loglari").insert(rows);
  if (error) {
    console.error("[audit] ziyaret_loglari yazılamadı:", error.message);
  }
}
