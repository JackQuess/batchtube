# Cloudflare R2 – CORS (UpScale uploads)

UpScale sayfasında kullanıcı tarayıcıdan dosyayı **presigned PUT URL** ile doğrudan R2’ye yükler. Tarayıcı aynı origin’den (örn. `https://batchtube.net`) R2 domain’ine istek attığı için R2 bucket’ında **CORS** tanımlı olmalı; yoksa “blocked by CORS policy” hatası alırsın.

## Ne yapmalısın?

Cloudflare Dashboard → **R2** → bucket’ını seç → **Settings** → **CORS policy** bölümüne aşağıdaki JSON’u ekle (veya mevcut kuralla birleştir).

### Önerilen CORS (JSON)

Production + local geliştirme için:

```json
[
  {
    "AllowedOrigins": [
      "https://batchtube.net",
      "https://www.batchtube.net",
      "http://localhost:5173",
      "http://127.0.0.1:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "HEAD"],
    "AllowedHeaders": ["Content-Type", "Content-Length"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

- **AllowedOrigins:** Frontend’in çalıştığı adresler (batchtube.net + localhost).
- **AllowedMethods:** `PUT` presigned upload için zorunlu; `GET`/`HEAD` indirme/önizleme için.
- **AllowedHeaders:** Tarayıcı PUT ile `Content-Type` (ve gerekirse `Content-Length`) gönderir; bunları izin ver.

Kaydettikten sonra birkaç dakika içinde geçerli olur. UpScale’da tekrar “Start Processing” ile yükleme deneyebilirsin.

## Hata örneği

Console’da:

```
Access to fetch at 'https://...r2.cloudflarestorage.com/...' from origin 'https://batchtube.net'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

Bu, bucket’ta CORS’un tanımlı olmadığını veya `https://batchtube.net` origin’inin izinli olmadığını gösterir; yukarıdaki JSON’u ekleyince düzelir.
