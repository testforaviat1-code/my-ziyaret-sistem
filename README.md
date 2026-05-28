# Ziyaretçi Yönetim Sistemi (VMS)

Kurumsal ziyaretçi onay, giriş–çıkış ve operasyon süreçlerini dijitalleştiren web uygulaması. Bu depo, **Faz 1 (MVP)** kapsamındaki bulut tabanlı sürümü içerir; **Faz 2**’de altyapı kurum içi **THY On-Premise** ortamına taşınacaktır.

---

## Proje Özeti (Executive Summary)

Geleneksel, e-posta ve manuel onay zincirine dayalı ziyaretçi süreçleri; gecikme, izlenebilirlik eksikliği ve operasyonel yük üretmektedir. Bu proje, süreci tek bir dijital platformda toplayarak:

- **Operasyonel verimlilik:** Personel talep oluşturma, güvenlik giriş–çıkış ve idari yönetim ekranlarının rol tabanlı ayrımı.
- **Güvenlik ve uyumluluk:** Sunucu tarafı doğrulama, denetim (audit) kayıtları, kişisel veri maskeleme (TC, telefon) ve veritabanı düzeyinde erişim kısıtları (RLS).
- **Modern mimari:** Dışarıya açık REST yüzeyi olmadan, kapalı devre **Next.js Server Actions** ile iş mantığının sunucuda tutulması.

Hedef, kurumsal güvenlik politikalarına uygun, ölçeklenebilir ve APEX ortamına devredilebilir bir **Minimum Viable Product (MVP)** sunmaktır.

---

## Teknoloji Yığını (Tech Stack)

| Katman | Teknoloji | Notlar |
|--------|-----------|--------|
| **Framework** | Next.js 16 (App Router) | SSR, middleware, güvenlik başlıkları |
| **UI** | React 19, Tailwind CSS 4 | Bileşen tabanlı arayüz |
| **Dil** | TypeScript 5 | `strict: true` derleyici modu |
| **Veritabanı & Auth** | Supabase (PostgreSQL, Auth, Realtime) | Faz 1; Faz 2’de kurumsal DB/LDAP ile değişecek |
| **İstemci–sunucu** | `@supabase/ssr` | Cookie tabanlı oturum |
| **İkonlar** | Lucide React | Arayüz sembolleri |

**Önemli:** Projede `app/api/` altında **hiçbir API Route tanımlı değildir**. Tüm mutasyonlar ve yetkili işlemler `app/actions/` altındaki Server Actions üzerinden yürütülür.

---

## Mimari ve Güvenlik Stratejisi (Architecture & Security)

### Kapalı devre sunucu modeli

- Dış istemcilere açık **REST API Route yok** (`app/api/` kullanılmıyor).
- İş kuralları: `guvenlik.ts`, `ziyaretci.ts`, `admin.ts` — `"use server"` ile işaretli Server Actions.
- Rol bazlı rota koruması: `middleware.ts` içinde `/guvenlik-panel`, `/idari-panel`, `/taleplerim`, `/ziyaretci-formu` eşlemeleri.

### OWASP odaklı önlemler

| Alan | Uygulama |
|------|----------|
| **Kimlik doğrulama** | Supabase Auth + oturum cookie’leri; korumalı rotalarda `getUser()` kontrolü |
| **Yetkilendirme** | `profiller.rol` (personel, guvenlik, admin); kampüs kısıtı güvenlik işlemlerinde |
| **Veri erişimi** | Supabase **Row Level Security (RLS)**; sunucu tarafı ek filtreler |
| **Girdi doğrulama** | Sunucuda zaman kontrolü (`gecmisZamaniEngelle`), TC/GSM format kısıtları, `ziyaret_edilecek_kisi` sunucuda profilden türetilir |
| **HTTP güvenliği** | `next.config.ts`: CSP, `X-Frame-Options`, `X-Content-Type-Options`, HSTS, `Referrer-Policy`, `Permissions-Policy` |
| **Hassas veri gösterimi** | `lib/formatlayici.ts`: TC ve telefon maskeleme |

### Strict Type Safety

`tsconfig.json` içinde `"strict": true` etkin. Server Actions ve paylaşılan tipler (`ZiyaretciVerisi`, `ProfilGuvenlikOzeti` vb.) derleme zamanında sözleşmeyi zorlar; `any` kullanımı minimumda tutulmalıdır.

### Anti-XSS ve HTML Entity

- **React JSX:** Kullanıcı girdisi varsayılan olarak escape edilir; `dangerouslySetInnerHTML` kullanılmaz.
- **HTML Entity:** Statik ve dinamik metinlerde özel karakterler entity ile kodlanır (ör. arayüzde `&gt;` kullanımı).
- **CSP:** Script ve bağlantı kaynakları `default-src 'self'` ve Supabase hostları ile sınırlandırılır; `object-src 'none'`, `frame-ancestors 'self'`.

Üretimde CSP’nin nonce tabanlı sıkılaştırılması planlanabilir (yorum: `next.config.ts`).

---

## APEX Devir Teslim Matrisi (Migration Handover)

Bu sürüm **MVP**’dir. Faz 2 geçişinde aşağıdaki bileşenler kurumsal APEX yığınına taşınacaktır.

| Bileşen | Faz 1 (Mevcut) | Faz 2 (Hedef — APEX On-Premise) |
|---------|----------------|----------------------------------|
| **Uygulama barındırma** | Next.js (geliştirme / bulut) | Kurum içi APEX sunucuları |
| **Kimlik doğrulama** | Supabase Auth | **APEX Active Directory (LDAP)** entegrasyonu |
| **Veritabanı** | Supabase PostgreSQL + RLS politikaları | Kurumsal PostgreSQL / eşdeğer; RLS kurallarının yeniden eşlenmesi |
| **Şifreleme / anahtar yönetimi** | Supabase yönetimli anahtarlar | **HSM / KMS** kurumsal şifreleme katmanı |
| **API yüzeyi** | Yok (yalnızca Server Actions) | Aynı prensip korunmalı; gereksiz public REST açılmamalı |
| **Denetim** | `lib/audit.ts` log akışları | Kurumsal SIEM / log arşivine yönlendirme |

**Devir teslim notları:**

1. `.env.local` ve Supabase proje kimlik bilgileri **üretim sırları olarak repoya yazılmaz**.
2. RLS politikaları ve `profiller` / `talepler` şema dokümantasyonu APEX DBA ekibiyle paylaşılmalıdır.
3. Middleware rol haritası (`ROUTE_ROLES`) LDAP grup eşlemesiyle hizalanmalıdır.

---

## Kurulum Kılavuzu (Getting Started)

### Ön koşullar

- **Node.js** 20.x veya üzeri (LTS önerilir)
- **npm** 10+
- Erişilebilir bir **Supabase** projesi (URL + anon key)

### Kurulum adımları

Depo kökünde (`my-ziyaret-sistem`):

```bash
npm install
npm run dev
```

Tarayıcıda: [http://localhost:3000](http://localhost:3000)

Diğer komutlar:

```bash
npm run build   # üretim derlemesi
npm run start   # üretim sunucusu
npm run lint    # ESLint (app, components, lib)
```

### Ortam değişkenleri

Proje kökünde `.env.local` oluşturun. **Gerçek anahtarları bu dosyaya commit etmeyin.** `.gitignore` içinde `.env*` tanımlı olmalıdır.

```env
# Supabase — Faz 1
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

| Değişken | Açıklama |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase proje API URL’si |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) API anahtarı; RLS ile sınırlandırılmış istemci erişimi |

> **Güvenlik:** `service_role` veya üretim gizli anahtarları istemci tarafına (`NEXT_PUBLIC_*`) eklenmemelidir. Faz 2’de LDAP ve KMS yapılandırması ayrı kurumsal secret store üzerinden yönetilecektir.

---

## Proje yapısı (özet)

```
my-ziyaret-sistem/
├── app/
│   ├── actions/          # Server Actions (guvenlik, ziyaretci, admin)
│   ├── guvenlik-panel/
│   ├── idari-panel/
│   ├── taleplerim/
│   ├── ziyaretci-formu/
│   └── login/
├── components/
├── lib/                  # Supabase istemcileri, audit, formatlayıcı
├── middleware.ts         # Rol tabanlı rota koruması
└── next.config.ts        # Güvenlik başlıkları (CSP vb.)
```

---

## Lisans ve sahiplik

Kurumsal iç kullanım. Dağıtım ve üçüncü taraf paylaşımı kurum bilgi güvenliği politikalarına tabidir.

---

*Son güncelleme: Kurumsal devir-teslim dokümantasyonu — Faz 1 MVP / Faz 2 THY geçiş planı.*
