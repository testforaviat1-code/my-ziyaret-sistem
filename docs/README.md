# Dokümantasyon İndeksi

Bu klasör, Ziyaretçi Yönetim Sistemi'nin (VMS) tüm mühendislik dokümantasyonunu barındırır. Açıklama (architecture), karar (adr), koruma (security, data), işletim (runbooks) ve öğrenme (onboarding) eksenlerine ayrılmıştır.

## Klasör Yapısı
docs/
├── README.md                         # İndeks ve okuma sırası
├── architecture/
│   ├── overview.md                   # Katmanlı/Hexagonal mimari, veri akışı, sınırlar
│   └── adr/                          # Architecture Decision Records
│       ├── 0001-adr-process.md       # ADR sürecinin tanımı
│       └── 0002-auth-adapter-and-repository.md
├── security/
│   ├── threat-model.md               # STRIDE özetli tehdit modeli + önlemler
│   └── headers-and-csp.md            # Nonce CSP, frame-ancestors, güvenlik başlıkları
├── data/
│   └── kvkk-data-map.md              # Kişisel veri envanteri, maskeleme, saklama
├── runbooks/
│   └── deployment-onprem.md          # On-prem/SSO geçiş ve dağıtım prosedürü
└── onboarding/
└── local-development.md          # Geliştirici kurulum rehberi

## Rol Bazlı Okuma Sırası

| Rol | Önce oku |
|---|---|
| Yeni geliştirici | `onboarding/local-development.md` → `architecture/overview.md` |
| Mimar / Tech Lead | `architecture/overview.md` → `architecture/adr/` |
| Güvenlik / DevSecOps | `security/threat-model.md` → `security/headers-and-csp.md` |
| KVKK / Uyum | `data/kvkk-data-map.md` |
| DevOps / SRE | `runbooks/deployment-onprem.md` |

## Doküman Yazım Kuralları

- Her doküman bir sahip ve son güncelleme tarihi taşır (üst meta blok).
- Mimari kararlar koda değil ADR'ye yazılır; kod yorumları "ne" anlatır, ADR "neden" anlatır.
- Diyagramlar metin tabanlı (ASCII / Mermaid) tutulur ki sürüm kontrolünde diff alınabilsin.
- Bir karar değiştiğinde eski ADR silinmez, "Superseded by ADR-XXXX" olarak işaretlenir.