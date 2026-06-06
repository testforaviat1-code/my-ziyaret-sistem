# Güvenlik Başlıkları ve CSP

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

## Content-Security-Policy (Nonce tabanlı)

CSP, her istekte üretilen bir nonce ile `middleware.ts` içinde kurulur. Statik `next.config.ts` başlığı kullanılmaz; çünkü nonce isteğe özgüdür.

Önemli yönergeler:

script-src 'self' 'nonce-<rastgele>' 'strict-dynamic'
style-src  'self' 'unsafe-inline'
frame-ancestors <NEXT_PUBLIC_PORTAL_ANCESTORS | 'self'>
object-src 'none'
base-uri 'self'
upgrade-insecure-requests

- `script-src`'te `unsafe-inline` ve `unsafe-eval` yoktur; XSS savunması fiilen aktiftir. Next, kendi script'lerine nonce'u CSP başlığından otomatik uygular.
- `style-src 'unsafe-inline'` bilinçli istisnadır (Tailwind/Next inline stil; stil enjeksiyonu kod çalıştırmaz).
- `frame-ancestors` portlet gömme için parametriktir. `X-Frame-Options` kullanılmaz (çoklu origin ifade edemez ve `frame-ancestors` ile çakışır).

## Diğer Güvenlik Başlıkları (`next.config.ts`)

| Başlık | Değer | Amaç |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | HTTPS zorunluluğu |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing engeli |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer sızıntısı azaltma |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Hassas API kapatma |

## Portlet (iframe) Gömme

Uygulamanın kurumsal portala gömülebilmesi için izinli üst origin(ler):

```bash
NEXT_PUBLIC_PORTAL_ANCESTORS="https://info."
```

Birden fazla origin için boşlukla ayrılmış liste verilir. Değer tanımsızsa `frame-ancestors 'self'` ile yalnızca kendi origin'i gömebilir.

## Test ve Doğrulama

- `curl -I https://<host>/` ile başlıkların döndüğünü doğrula.
- Tarayıcı konsolunda CSP ihlali (blocked script) olmamalı.
- Nonce'un her istekte değiştiğini ve inline Next script'lerine uygulandığını kontrol et.
- Portal origin'inden iframe gömmenin çalıştığını, yetkisiz origin'den bloklandığını doğrula.