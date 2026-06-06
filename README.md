# Ziyaretçi Yönetim Sistemi (VMS)

Kurumsal saha güvenliği için ziyaretçi kaydı, onay ve giriş/çıkış denetimi modülü. Next.js (App Router) üzerinde Hexagonal (Port/Adapter) yaklaşımıyla inşa edilmiştir; kimlik doğrulama ve veri erişimi soyutlanmış, kişisel veri (PII) sunucu sınırında izole edilmiş ve KVKK uyumlu bir mimari hedeflenmiştir.

> Bu uygulama, kurumsal portal içinde bir mikro-frontend (portlet) olarak çalışacak şekilde tasarlanmıştır. Kimlik (SSO) ve veritabanı (on-prem) sağlayıcıları, çağrı noktalarına dokunmadan değiştirilebilecek iki adaptör arkasında soyutlanmıştır.

## İçindekiler

- [Mimari Bakış](#mimari-bakış)
- [Teknoloji Yığını](#teknoloji-yığını)
- [Proje Yapısı](#proje-yapısı)
- [Güvenlik ve KVKK İlkeleri](#güvenlik-ve-kvkk-i̇lkeleri)
- [Başlangıç (Local Development)](#başlangıç-local-development)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Mimari Yol Haritası](#mimari-yol-haritası)
- [Geliştirme Standartları](#geliştirme-standartları)
- [Dokümantasyon](#dokümantasyon)

## Mimari Bakış

Sistem dört katmana ayrılmıştır. Üst katmanlar yalnızca bir alt katmanın arayüzünü tanır; somut sağlayıcı en altta izole edilir.

┌───────────────────────────────────────────────────────────┐
│  İSTEMCİ (App Router – Client Components)                   │
│  Sayfalar, paneller, formlar — yalnızca DTO görür           │
└───────────────────────────┬───────────────────────────────┘
│ Server Actions (mutasyon)
│ Repository (okuma, maskeli DTO)
┌───────────────────────────▼───────────────────────────────┐
│  SUNUCU SINIRI                                              │
│  • actions/.ts      → yazma; whitelist, rol kontrolü       │
│  • repositories/.ts → okuma; maskeleme (PII izolasyonu)    │
│  • auth/Provider.ts  → getCurrentUser(): AuthUser           │
└───────────────────────────┬───────────────────────────────┘
│ Adaptör arayüzleri
┌───────────────────────────▼───────────────────────────────┐
│  SAĞLAYICI                                                  │
│  Mevcut Durum (Faz 1): Supabase (Auth + Postgres + Realtime)│
│  Hedef Kurumsal Mimari (Faz 2): Keycloak/Azure AD + On-Prem │
└───────────────────────────────────────────────────────────┘

Temel ilkeler:

- Tek kimlik sözleşmesi: Uygulama `supabase.auth` değil, `AuthUser` (`id, sicilNo, rol, kampusId, tamAd`) tanır. Kaynak: `lib/auth/Provider.ts`.
- PII sunucu sınırını terk etmez: Ham TC/GSM yalnızca sunucuda işlenir; istemciye yalnızca maskelenmiş `TalepDTO` iner.
- Yazma = sunucu otoritesi: Tüm mutasyonlar Server Action'dan geçer; kolon whitelist'i, `durum` zorlaması ve rol kontrolü sunucudadır.
- Realtime = tetikleyici: Delta güncellemeleri payload'dan yalnızca `id` alır, maskeli DTO'yu sunucudan çeker.
- Güvenlik dağıtım katmanında gömülü: Nonce tabanlı CSP, `frame-ancestors`, güvenlik başlıkları ve rate-limiting middleware/action seviyesinde.

Ayrıntı: [`docs/architecture/overview.md`](docs/architecture/overview.md)

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS v4, lucide-react |
| Kimlik | Supabase Auth (Adapter arkasında — SSO'ya hazır) |
| Veri | Supabase Postgres + Realtime (Repository arkasında — on-prem'e hazır) |
| SSR/İstemci köprüsü | `@supabase/ssr` |
| Dil | TypeScript (strict) |

## Proje Yapısı
.
├── app/
│   ├── actions/              # Server Actions (yazma/mutasyon)
│   │   ├── admin.ts          #   kampusEkle/Sil, personelKampusGuncelle (rol: admin)
│   │   ├── guvenlik.ts       #   giriş/çıkış, toplu işlem (rol: guvenlik/admin)
│   │   └── ziyaretci.ts      #   yeniZiyaretciKaydet (whitelist + durum otoritesi)
│   ├── guvenlik-panel/       # Güvenlik personeli ekranı (DTO + delta realtime)
│   ├── idari-panel/          # Admin ekranı (DTO + delta realtime + istatistik)
│   ├── taleplerim/           # Personelin kendi talepleri
│   ├── ziyaretci-formu/      # Ziyaretçi kaydı formu
│   ├── login/                # Supabase Auth — Faz 2'de SSO ile değiştirilir
│   ├── layout.tsx
│   └── page.tsx              # Ana portal
├── lib/
│   ├── auth/Provider.ts      # AuthAdapter: getCurrentUser(), AuthUser, Rol
│   ├── repositories/TalepRepository.ts  # Okuma + DTO maskeleme + kampüs zırhı
│   ├── supabase/             # client/server/hooks (sağlayıcı adaptörü)
│   ├── guvenlik/rateLimit.ts # Hız koruması (gateway'in ikinci hattı)
│   ├── formatlayici.ts       # maskeleTC / maskeleTelefon / formatTarih
│   ├── zaman.ts              # TR saat dilimi yardımcıları
│   └── audit.ts              # Denetim günlüğü yazımı (sunucu)
├── middleware.ts             # Yetki kapısı + Nonce CSP + güvenlik başlıkları
├── next.config.ts            # Statik güvenlik başlıkları
└── docs/                     # Mimari, güvenlik, KVKK, runbook, onboarding

## Güvenlik ve KVKK İlkeleri

- Veri minimizasyonu: Repository `select('*')` kullanmaz; yalnızca gerekli kolonları çeker, PII'yi maskeleyip DTO döner.
- Maskeleme sunucuda kesinleşir: TC `12*******34`, GSM `5XX **** XX` formatında; ham değer istemciye hiç gönderilmez (realtime dahil).
- Yetki çok katmanlı: Middleware (rota), Server Action / Repository (işlem), Supabase RLS (satır) — savunma derinliği.
- Mutasyon güvenliği: Kolon whitelist'i, `durum` sunucu zorlaması, ham DB hatalarının maskelenmesi, batch ve serbest-metin sınırları.
- Tarayıcı güvenliği: Per-request nonce CSP (`unsafe-inline/eval` yok), `frame-ancestors` ile kontrollü gömme, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.

Ayrıntı: [`docs/security/threat-model.md`](docs/security/threat-model.md), [`docs/security/headers-and-csp.md`](docs/security/headers-and-csp.md), [`docs/data/kvkk-data-map.md`](docs/data/kvkk-data-map.md)

## Başlangıç (Local Development)

```bash
npm install
cp .env.example .env.local
npm run dev
```

Detaylı kurulum, test verisi ve rol atama: [`docs/onboarding/local-development.md`](docs/onboarding/local-development.md)

## Ortam Değişkenleri

| Değişken | Açıklama |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje URL'i |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon (public) anahtarı |
| `NEXT_PUBLIC_PORTAL_ANCESTORS` | Portlet gömme için izinli üst origin(ler), CSP `frame-ancestors` |

## Mimari Yol Haritası

| Faz | Kapsam | Durum |
|---|---|---|
| Faz 0 | Güvenlik ve build kırılganlıkları: `getUser`, whitelist + `durum` otoritesi, ham hata maskeleme, ayrıcalıklı yazmaların Server Action'a taşınması | Tamamlandı |
| Faz 1 | Hexagonal: Auth Adapter, Repository + DTO (PII izolasyonu), delta realtime | Tamamlandı |
| Faz 1.5 | DevSecOps: Nonce CSP, `frame-ancestors`, rate-limiting, batch sınırları | Tamamlandı |
| Faz 2 | Kurumsal entegrasyon: SSO (`Provider.ts` swap), on-prem DB (Repository impl. swap), portlet kabuğu | Planlandı |
| Faz 3 | Gözlemlenebilirlik ve ölçek: merkezi log/trace, Redis tabanlı rate-limit, sunucu-taraflı arama/pagination | Planlandı |

## Geliştirme Standartları

- TypeScript strict; iş mantığında `any` kullanılmaz — domain tipleri ve rol/durum union'ları esastır.
- Tüm okuma `repositories/` üzerinden, tüm yazma `actions/` üzerinden yapılır. İstemci bileşeni doğrudan `supabase.from(...)` çağırmaz.
- Ham PII hiçbir DTO'ya, log'a veya URL parametresine girmez.
- Her mimari karar bir ADR ile kayıt altına alınır: [`docs/architecture/adr/`](docs/architecture/adr/).

##Teknik Dokümantasyon docs altındadır.