export const gecmisZamaniEngelle = (secilenTarih: string, secilenSaat: string) => {
    if (!secilenTarih || !secilenSaat) return { izinVer: true, mesaj: "" };
  
    // 1. Sunucu nerede olursa olsun, saati zorla Türkiye (İstanbul) saatine çevir
    const suAn = new Date();
    const trSaatMetni = suAn.toLocaleString("en-US", { timeZone: "Europe/Istanbul" });
    const trTarihi = new Date(trSaatMetni);
  
    // 2. Formdan gelen tarihi oluştur
    const secilenZaman = new Date(`${secilenTarih}T${secilenSaat}:00`);
  
    // 3. Karşılaştır (Türkiye saatine göre geçmiş mi?)
    if (secilenZaman < trTarihi) {
      return { izinVer: false, mesaj: "Geçmiş tarih veya saate kayıt açılamaz!" };
    }
    
    return { izinVer: true, mesaj: "" };
  };