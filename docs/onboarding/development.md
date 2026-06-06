# Local Development — Kurulum Rehberi

> Sahip: Sistem Mimarı · Son güncelleme: Haziran 2026 · Durum: Yürürlükte

## Önkoşullar

- Node.js (Next.js 16 ile uyumlu LTS sürümü)
- Bir Supabase projesi (geliştirme) veya ekibin paylaşımlı geliştirme örneği

## Kurulum

```bash
npm install
cp .env.example .env.local
```

`.env.local` içeriği:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<proje>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_PORTAL_ANCESTORS='self'
```

```bash
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışır.

## Veritabanı Beklentileri

Uygulamanın çalışması için gerekli tablolar (özet):

- `profiller(id, rol, sicil_no, kampus_id, tam_ad)` — `rol ∈ {personel, guvenlik, admin}`
- `kampusler(id, isim)`
- `talepler(id, ziyaretci_ad_soyad, ziyaretci_tc, ziyaretci_gsm, durum, ziyaret_tarihi, ziyaret_saati, plaka, firma_bilgisi, ziyaret_nedeni, red_nedeni, bitis_tarihi, kampus_id, ziyaret_edilecek_kisi, son_islem_tarihi)`
- `ziyaretci_loglari`, `ziyaret_loglari` — denetim günlükleri

RLS politikaları üretimdekiyle aynı tutulmalıdır; aksi halde uygulama içi yetki katmanı doğru test edilemez.

## Rol Atama (Test)

Bir kullanıcının `profiller` kaydındaki `rol` ve `kampus_id` alanları ayarlanarak farklı ekranlar test edilir:

- `personel` → ziyaretçi formu + taleplerim
- `guvenlik` → ek olarak güvenlik paneli (kendi kampüsü)
- `admin` → ek olarak idari panel (tüm kampüsler)

## Realtime Testi

`talepler` tablosunun Supabase Realtime publication'ında açık olduğundan emin olunmalıdır. İki sekme açılır; birinde işlem yapılır, diğerinde delta güncellemesinin tam tablo yenilemeden geldiği gözlemlenir.

## Sık Karşılaşılanlar

| Belirti | Olası neden |
|---|---|
| Panelde veri boş | `kampus_id` atanmamış veya RLS SELECT izni yok |
| CSP konsol hatası | Yerel ortamda eklenen üçüncü parti script; nonce kapsamı dışında |
| Realtime sessiz | Tablo publication'da değil veya RLS realtime'ı engelliyor |