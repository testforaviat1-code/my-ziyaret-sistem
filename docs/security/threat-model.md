# Tehdit Modeli

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

STRIDE eksenli özet; her tehdit için sistemde alınan somut önlem belirtilmiştir.

## Varlıklar

- Ziyaretçi kişisel verileri (TC, GSM, ad-soyad) — yüksek hassasiyet (KVKK)
- Personel kimlik/rol bilgileri
- Giriş/çıkış denetim kayıtları (audit)

## Güven Sınırı

İstemci (tarayıcı) güvenilmez kabul edilir. Güven sınırı, Server Action / Repository / Middleware'in çalıştığı sunucudadır. İstemciden gelen her değer (rol iddiaları, `durum`, `kampus_id`, sicil) sunucuda yeniden doğrulanır.

## STRIDE Özeti

| Tehdit | Senaryo | Önlem |
|---|---|---|
| Spoofing | Sahte oturum / token | `getUser()` (token sunucuda doğrulanır), middleware rota kapısı |
| Tampering | İstemci `durum: "onaylandi"` veya başka kampüs gönderir | Whitelist + sunucu `durum` zorlaması + kampüs zırhı |
| Repudiation | İşlemin inkârı | `audit.ts` denetim günlüğü (işlem + yapan personel) |
| Information Disclosure | Ham TC/GSM sızıntısı | Repository DTO maskeleme; PII istemciye/realtime'a inmez; ham DB hataları maskelenir |
| Denial of Service | Bot ile action flood / dev batch | Rate-limit (`lib/guvenlik/rateLimit.ts`) + batch ve metin uzunluk sınırı; birincil hat gateway/WAF |
| Elevation of Privilege | Personelin admin işlemi çağırması | Her ayrıcalıklı action'da `rol === 'admin'` kontrolü + RLS |

## Çok Katmanlı Yetki (Defense in Depth)

1. Middleware — rota seviyesinde rol kapısı (`ROUTE_ROLES`).
2. Server Action / Repository — işlem seviyesinde kimlik + rol + kampüs zırhı.
3. Supabase RLS — satır seviyesinde son hat.

Bir katman atlansa bile diğerleri korur.

## Bilinen Sınırlar ve Kabul Edilen Riskler

- Uygulama içi rate-limit instance-local'dir; çok-instance üretimde gateway/WAF veya Redis tabanlı paylaşımlı sayaç gerekir (Faz 3).
- `style-src 'unsafe-inline'` bilinçli istisnadır (stil enjeksiyonu script çalıştırmaz); script tarafı nonce ile kapalıdır.
- Denetim günlüğünde saklanan veri için at-rest şifreleme ve saklama süresi politikası, Hukuk ve Uyum birimlerinin onayına tabidir (bkz. `docs/data/kvkk-data-map.md`).

İlgili: [`headers-and-csp.md`](headers-and-csp.md), [`../data/kvkk-data-map.md`](../data/kvkk-data-map.md)