# KVKK Kişisel Veri Haritası

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

Sistemde işlenen kişisel verilerin envanteri, maskeleme ve erişim kuralları.

## Veri Envanteri

| Veri | Hassasiyet | Nerede saklanır | İstemciye nasıl iner |
|---|---|---|---|
| Ziyaretçi TC | Yüksek | `talepler.ziyaretci_tc` | Maskeli (`12*******34`); ham değer hiç inmez |
| Ziyaretçi GSM | Yüksek | `talepler.ziyaretci_gsm` | Maskeli (`5XX **** XX`) |
| Ziyaretçi ad-soyad | Orta | `talepler.ziyaretci_ad_soyad` | Açık (operasyon için gerekli) |
| Plaka / firma | Orta | `talepler` | Açık |
| Personel ad / sicil / rol | Orta | `profiller` | Yalnızca yetkili sunucu yanıtlarında |

## İlkeler

1. Veri minimizasyonu: Repository `select('*')` kullanmaz; yalnızca ekranın ihtiyaç duyduğu kolonları çeker.
2. Maskeleme sunucuda: `lib/formatlayici.ts` (`maskeleTC`, `maskeleTelefon`) ham değeri sunucuda maskeler; DTO'ya yalnızca maskeli alan girer.
3. Realtime'da PII yok: Delta akışı payload'dan yalnızca `id` alır; maskeli DTO sunucudan ayrıca çekilir.
4. Loglarda dikkat: Hata logları sunucuda kalır; ham PII URL parametresine veya istemci log'una yazılmaz.

## Erişim Matrisi

| Rol | Görebildiği kapsam |
|---|---|
| personel | Yalnızca kendi açtığı talepler (`ziyaret_edilecek_kisi = sicil`) |
| guvenlik | Yalnızca kendi kampüsünün aktif talepleri (kampüs zırhı) |
| admin | Tüm kampüsler (zaman filtreli) |

## Uyum Onayına Tabi Maddeler

Aşağıdaki kalemlerin nihai değerleri ve politikaları, şirketin Hukuk ve Uyum birimlerinin kararına tabidir.

- Hassas kolonlar (TC, GSM) için at-rest şifreleme yöntemi ve anahtar yönetimi.
- Denetim günlüğünde (`ziyaretci_loglari`) saklanan ham TC için maskeleme/şifreleme politikası.
- Kişisel verilerin yasal saklama süresi (retention) ve süre sonunda anonimleştirme/imha prosedürü.
- Maskeleme karakter formatının (gösterilecek/gizlenecek hane sayısı) yasal yeterliliği.

İlgili: [`../security/threat-model.md`](../security/threat-model.md)