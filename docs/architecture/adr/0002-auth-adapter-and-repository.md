# ADR-0002: Auth Adapter ve Repository + DTO Deseni

> Sahip: Sistem Mimarı · Durum: Kabul edildi · Tarih: Haziran 2026

## Bağlam

İlk sürümde `supabase.auth.*` ve `supabase.from(...)` çağrıları istemci bileşenlerine, middleware'e ve Server Action'lara dağılmıştı. İki sonuç doğurdu:

1. Göç riski: SSO ve on-prem DB geçişi onlarca çağrı noktasına dokunmayı gerektirecekti.
2. KVKK sızıntısı: Paneller `select('*')` ile ham TC/GSM'i tarayıcıya indiriyor, maskeleme yalnızca ekranda yapılıyordu; ham veri network payload'ında açıktı.

## Karar

İki soyutlama katmanı eklendi:

1. Auth Adapter (`lib/auth/Provider.ts`): Uygulama, kimlik için yalnızca `getCurrentUser(): Promise<AuthUser | null>` sözleşmesini tanır. `AuthUser = { id, sicilNo, rol, kampusId, tamAd }`. Somut sağlayıcı bu fonksiyonun içindedir.
2. Repository + DTO (`lib/repositories/TalepRepository.ts`): Tüm okuma sunucuda yapılır. Ham veri yalnızca gerekli kolonlar olarak çekilir, sunucuda maskelenir ve istemciye yalnızca `TalepDTO` (maskelenmiş TC/GSM) döner. Yetki ve kampüs zırhı bu sınırda zorlanır.

## Sonuçlar

Olumlu:

- SSO/on-prem geçişi iki dosyanın değişimine indi (Provider gövdesi + Repository implementasyonu).
- Ham PII tarayıcıya (realtime dahil) hiç inmiyor; KVKK veri-minimizasyonu sağlandı.
- Okuma yolu, RLS'in üstünde ikinci yetki katmanı kazandı.

Ödünler / Riskler:

- "use server" repository'leri, klasik servis katmanına göre biraz daha kaba bir sınırdır; ileride bir Service katmanı eklenebilir.
- DTO eşlemesi ek bir dönüşüm maliyeti getirir; PII güvenliği için kabul edilmiş bir bedeldir.

## Alternatifler

- Sadece RLS'e güvenmek: Reddedildi. RLS tek başına maskeleme yapmaz, ham PII yine istemciye iner; ayrıca on-prem'de tarayıcı–DB köprüsü yoktur.
- İstemci-taraflı maskeleme: Reddedildi. Ham veri yine ağda dolaşır; savunma derinliği yoktur.