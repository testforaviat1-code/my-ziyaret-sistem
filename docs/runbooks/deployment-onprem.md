# On-Prem Dağıtım ve SSO Geçiş Runbook'u

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

Faz 2 kapsamındaki kurumsal geçişin adım adım prosedürü. Mimari sayesinde uygulama kodunun büyük kısmı dokunulmadan kalır.

## Geçişin Üç Dokunma Noktası

| Değişim | Dokunulacak yer | Dokunulmayacak |
|---|---|---|
| Kimlik → SSO | `lib/auth/Provider.ts` gövdesi | Sayfalar, action'lar, repository'ler |
| Veri → On-Prem Postgres | `lib/repositories/*` implementasyonu | DTO sözleşmesi, UI |
| Kabuk → Portlet | `app/layout.tsx`, `next.config.ts` (`basePath`) | İş mantığı |

## 1. SSO Entegrasyonu

1. Kimlik sağlayıcısından (Keycloak/Azure AD) issuer, client id/secret ve redirect URI bilgileri temin edilir.
2. `getCurrentUser()`, kimlik sağlayıcısının token doğrulamasını yapacak şekilde yeniden yazılır; dönüş tipi `AuthUser` aynı kalır.
3. Kimlik sağlayıcısının rol/claim değerleri `Rol` union'ına (`personel | guvenlik | admin`) eşlenir.
4. `app/login` ve `/login` yönlendirmeleri SSO akışına bağlanır; mevcut Supabase login devreden çıkar.
5. Middleware'deki oturum kontrolü adaptör üzerinden çalışacak şekilde güncellenir.

Kabul kriteri: UI ve action kodunda hiçbir değişiklik gerekmeden roller doğru çözülmelidir.

## 2. On-Prem Veritabanı

1. Şema göçü: `talepler`, `profiller`, `kampusler` ve log tabloları ile indeksleri taşınır.
2. Repository'nin Supabase implementasyonu on-prem sürücüsüyle değiştirilir; DTO ve fonksiyon imzaları korunur.
3. RLS eşdeğeri yetki kuralları veritabanı/sunucu seviyesinde yeniden kurulur; uygulama içi kampüs zırhı zaten mevcuttur ve savunma derinliği sürer.
4. Realtime karşılığı: on-prem'de değişiklik bildirimi için seçilen mekanizmaya (LISTEN/NOTIFY veya mesaj kuyruğu) delta deseni uyarlanır; payload yine yalnızca `id` taşımalıdır.

## 3. Portlet Kabuğu

1. `next.config.ts` içinde `basePath` / `assetPrefix` portal yoluna göre ayarlanır.
2. `app/layout.tsx` içindeki kök `<html>/<body>` portal kabuğuna devredilir.
3. `NEXT_PUBLIC_PORTAL_ANCESTORS`, portal origin(leri) ile doldurulur (CSP `frame-ancestors`).

## Dağıtım Öncesi Kontrol Listesi

- [ ] Tüm ortam değişkenleri on-prem secret store'da
- [ ] CSP başlıkları üretimde doğrulandı (nonce + frame-ancestors)
- [ ] Rate-limit: gateway/WAF kuralı aktif (uygulama içi koruma ikinci hat)
- [ ] RLS / yetki kuralları üretim verisiyle test edildi
- [ ] Audit log yazımı doğrulandı
- [ ] PII maskeleme: ham TC/GSM'in hiçbir yanıt/log/payload'da olmadığı doğrulandı
- [ ] Rollback planı hazır

## Geri Alma (Rollback)

Adaptör yaklaşımı sayesinde kimlik veya veri katmanı önceki implementasyona geri alınabilir; sözleşmeler (AuthUser, DTO) sabit olduğu için UI etkilenmez.