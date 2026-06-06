# ADR-0001: Mimari Kararların ADR ile Kaydedilmesi

> Sahip: Sistem Mimarı · Durum: Kabul edildi · Tarih: Haziran 2026

## Bağlam

Mimari kararların gerekçesi yalnızca kod ve kişilerin hafızasında yaşamamalıdır. Faz 0–1 boyunca verilen kararlar (Adapter, Repository, DTO, delta realtime, CSP) ileride sorgulanacaktır; "neden böyle yapıldı?" sorusunun tek ve kalıcı bir cevabı olmalıdır.

## Karar

Her önemli ve geri-dönüşü maliyetli mimari karar, bir Architecture Decision Record (ADR) olarak `docs/architecture/adr/` altında numaralı bir dosyada tutulur.

## ADR Şablonu
ADR-XXXX: <Başlık>

Sahip: Sistem Mimarı
Durum: Önerildi | Kabul edildi | Reddedildi | Superseded by ADR-YYYY
Tarih: <Ay Yıl>

Bağlam
Hangi sorun/kısıt bu kararı gerektirdi?
Karar
Ne yapmaya karar verdik? 
Sonuçlar
Olumlu/olumsuz etkiler, kabul edilen ödünler (trade-off), riskler.
Alternatifler
Değerlendirilip elenen seçenekler ve eleme gerekçeleri.

## Kurallar

- ADR'ler değiştirilmez; karar değişirse yeni ADR yazılır ve eskisi `Superseded by` ile işaretlenir.
- Numara monoton artar (0001, 0002, ...).
- Kod yorumu "ne yapıldığını", ADR "neden yapıldığını" anlatır.

## Sonuçlar

Yeni ekip üyeleri ve BT Mimari Komitesi, kararların tarihçesini tek yerden izleyebilir; tartışmalar sıfırdan başlamaz.
