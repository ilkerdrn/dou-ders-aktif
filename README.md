# DOU DersAktif

Doğuş Üniversitesi için canlı quiz, anket, kelime bulutu ve takım etkinliği platformu.

## Gereksinimler

- Node.js 22+
- Supabase projesi
- Microsoft Entra tek-kurum uygulaması

## Yerel çalışma

```bash
npm ci
npm run dev
```

Üretim kontrolü:

```bash
npm run lint
npm run typecheck
npm test
npm audit --omit=dev
```

## Ortam değişkenleri

`NEXT_PUBLIC_ENABLE_DEMO=true` yalnızca tanıtım ortamında kullanılmalıdır. Okul sunucusunda tanımlanmaz veya `false` verilir. Secret/service-role anahtarı hiçbir zaman istemciye eklenmez.

## Veritabanı kurulumu

`supabase/migrations` klasöründeki migration dosyalarını sırasıyla uygulayın. Güncel migration; kurumsal kullanıcıları, ders ve etkinlikleri, canlı oturumları, tek cevap kuralını, sunucu taraflı puanlamayı ve özel Realtime kanal politikalarını kurar.

Supabase Realtime ayarlarında **Allow public access** kapatılmalıdır.

## Microsoft 365

Supabase Auth > Azure sağlayıcısına kurumun Client ID, Client Secret ve Tenant bilgilerini girin. Callback:

```text
https://xsyaicybachxyfiauygy.supabase.co/auth/v1/callback
```

Akademisyen e-postaları `dou_staff_allowlist` tablosuna yönetici tarafından eklenir. Diğer `@dogus.edu.tr` hesapları öğrenci rolü alır.

## Dağıtım

```bash
npm ci
npm test
```

`out/` klasörünü Nginx, Apache veya kurumun statik web sunucusunda yayınlayın. HTTPS zorunlu tutulmalı; güvenlik başlıkları web sunucusu seviyesinde tanımlanmalıdır.

GitHub Pages tanıtım sürümü otomatik dağıtılır ve demo modu yalnızca o workflow'da açılır.
