export const gecmisZamaniEngelle = (secilenTarih: string, secilenSaat: string) => {
  // Boş/eksik tarih-saat: kayıt açılamaz (zaman kilidi atlatılamaz).
  if (!secilenTarih?.trim() || !secilenSaat?.trim()) {
    return { izinVer: false, mesaj: "Tarih ve saat zorunludur." };
  }

  // 1. Sunucu nerede olursa olsun, saati zorla Türkiye (İstanbul) saatine çevir
  const suAn = new Date();
  const trSaatMetni = suAn.toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
  const trTarihi = new Date(trSaatMetni);

  // 2. Formdan gelen tarihi oluştur
  const secilenZaman = new Date(`${secilenTarih}T${secilenSaat}:00`);

  // 3. Geçersiz tarih/saat formatı (Invalid Date) → reddet
  if (Number.isNaN(secilenZaman.getTime())) {
    return { izinVer: false, mesaj: "Geçersiz tarih veya saat formatı." };
  }

  // 4. Karşılaştır (Türkiye saatine göre geçmiş mi?)
  if (secilenZaman < trTarihi) {
    return { izinVer: false, mesaj: "Geçmiş tarih veya saate kayıt açılamaz!" };
  }

  return { izinVer: true, mesaj: "" };
};