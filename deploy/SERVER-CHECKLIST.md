# Okul sunucusu kontrol listesi

- DNS ve geçerli TLS sertifikası hazır.
- `npm ci && npm test` başarılı.
- `.env` içindeki demo modu `false`.
- Supabase Realtime `Allow public access` kapalı.
- Microsoft Entra uygulaması single-tenant ve production alan adı Redirect URL listesinde.
- Azure Client Secret yalnızca Supabase panelinde; kaynak kodda değil.
- Akademisyen e-postaları `dou_staff_allowlist` içinde.
- Günlük veritabanı yedeği ve geri dönüş testi tanımlı.
- Nginx güvenlik başlıkları etkin.
- En az 1 akademisyen + 10 öğrenciyle mobil/masaüstü pilot testi tamamlandı.
- KVKK saklama süresi ve öğrenci silme sorumlusu kurum tarafından belirlendi.
