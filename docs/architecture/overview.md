# Mimari Bakış

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

Bu doküman VMS'in katmanlı/Hexagonal yapısını, veri akışını ve sınır kurallarını tanımlar.

## 1. Neden Hexagonal (Port/Adapter)?

Uygulama, kimlik (Supabase Auth → kurumsal SSO) ve veritabanı (Supabase → on-prem Postgres) olmak üzere iki sağlayıcı değişimi yaşayacaktır. Bu değişimlerin iş mantığına ve UI'a sıçramaması için dış sağlayıcılar birer adaptör arkasında izole edilmiştir. Çekirdek (sayfalar, action'lar, repository sözleşmeleri) yalnızca arayüzleri tanır.

## 2. Katmanlar ve Bağımlılık Yönü
İstemci Bileşenleri  ──►  Server Actions (yazma)   ──►  Sağlayıcı (Supabase)
│              └─►  Repository (okuma/DTO)  ──►        │
└──────────────────►  Auth Adapter ◄────────────────────┘

Bağımlılık her zaman dışarıdan içeriye akar; çekirdek katman somut sağlayıcıyı içe aktarmaz, sağlayıcı adaptörü çekirdeğin arayüzünü uygular.

| Katman | Sorumluluk | Kaynak |
|---|---|---|
| İstemci | Sunum, yalnızca DTO tüketir | `app/**/page.tsx` |
| Yazma sınırı | Mutasyon, whitelist, rol kontrolü, hata maskeleme | `app/actions/*.ts` |
| Okuma sınırı | Sorgu, kampüs zırhı, PII maskeleme → DTO | `lib/repositories/*.ts` |
| Kimlik adaptörü | `getCurrentUser(): AuthUser` | `lib/auth/Provider.ts` |
| Sağlayıcı | Supabase Auth/DB/Realtime | `lib/supabase/*` |

## 3. Okuma Yolu (Read Path)

1. İstemci bir repository fonksiyonunu (Server Action) çağırır: `getAktifTalepler(kampusId)`.
2. Repository `getCurrentUser()` ile kimliği doğrular, rol ve kampüs zırhını uygular (güvenlik rolü yalnızca kendi kampüsü).
3. Sorgu yalnızca gerekli kolonları çeker; ham TC/GSM sunucuda maskelenir.
4. İstemciye yalnızca `TalepDTO` (maskelenmiş) döner.

Sonuç: Ham PII tarayıcıya hiçbir koşulda inmez.

> KVKK ve Uyum Notu: Sistem, teknik olarak veriyi uçtan uca maskeleme ve anonimleştirme yeteneğine sahiptir. Ancak yasal saklama süreleri, maskeleme karakter limitleri ve veri imha politikalarının nihai hali, şirketin Hukuk ve Uyum birimlerinin kararına/onayına tabidir.

## 4. Yazma Yolu (Write Path)

1. İstemci bir Server Action çağırır: `yeniZiyaretciKaydet(...)`.
2. Action kimliği/rolü doğrular, hız ve batch sınırlarını kontrol eder.
3. Yalnızca whitelist kolonları yazılır; `durum` sunucuda `"onaylandi"` olarak zorlanır (self-approve engellenir).
4. Hata olursa ham DB mesajı loglanır, istemciye jenerik mesaj döner.

## 5. Realtime (Delta) Akışı

`postgres_changes` payload'ı ham satırı taşır ve kullanılmaz. Akış:

1. Olay gelir; yalnızca `payload.new.id` / `payload.old.id` alınır (id PII değildir).
2. `getAktifTalepById(id)` ile maskeli tek DTO sunucudan çekilir.
3. DTO `null` ise (kapsam/filtre dışı) kayıt listeden düşürülür; değilse upsert edilir.

Bu desen full-refetch maliyetini ortadan kaldırırken PII'yi websocket'ten uzak tutar.

## 6. Sınır Kuralları (Invariants)

- İstemci bileşeni doğrudan `supabase.from(...)` çağırmaz.
- DTO içinde ham PII bulunmaz.
- Her mutasyon ve her okuma kendi yetki kontrolünü içeride yapar (Server Action'lar herkese açık uçlardır).
- Zaman hesapları TR saat diliminde, sunucuda yapılır (`lib/zaman.ts`).

## 7. Faz 2 Geçiş Noktaları

| Değişim | Dokunulacak tek yer |
|---|---|
| SSO (Keycloak/Azure AD) | `lib/auth/Provider.ts` gövdesi |
| On-prem Postgres | `lib/repositories/*` Supabase implementasyonu |
| Portlet kabuğu | `app/layout.tsx` (kök `<html>` devri), `next.config.ts` `basePath` |

Karar gerekçeleri: [`adr/0002-auth-adapter-and-repository.md`](adr/0002-auth-adapter-and-repository.md)