# Railway – API servisi için ortam değişkenleri

## Zorunlu (500 hatası almamak için)

| Variable | Açıklama | Örnek |
|----------|----------|--------|
| `DATABASE_URL` | PostgreSQL bağlantı URL’si (Supabase / Neon / Railway Postgres) | `postgresql://user:pass@host:5432/db?sslmode=require` |
| `REDIS_URL` | Redis bağlantı URL’si (Redis iş kuyruğu için) | `redis://default:xxx@host:6379` |
| `ALLOWED_ORIGIN` | Frontend origin (CORS) | `https://batchtube.net` |
| `ALLOWED_ORIGIN_2` | İkinci frontend origin (CORS) | `https://www.batchtube.net` |

## CORS 500 / “Origin not allowed” önlemek için

- `ALLOWED_ORIGIN` ve `ALLOWED_ORIGIN_2` **boş bırakılmamalı**.
- İstersen tek değişken: `CORS_ALLOWED_ORIGINS=https://batchtube.net,https://www.batchtube.net`

## 500 – “Invalid prisma.batch.count()” önlemek için

Bu hata, **veritabanında tabloların olmamasından** (migration’ların çalışmamış olmasından) kaynaklanır.

**Yapman gereken:**

1. **Production’da migration’ları çalıştır**  
   API’nin kullandığı `DATABASE_URL` ile aynı veritabanına bağlanıp:

   ```bash
   cd api
   npx prisma migrate deploy
   ```

   Bunu yerelde, `DATABASE_URL` production DB’yi gösterirken bir kez çalıştırabilirsin; veya Railway’de bir “migrate” job / build step ile yapabilirsin.

2. **Railway’de DATABASE_URL**  
   API servisinin Variables’ında `DATABASE_URL` mutlaka production Postgres URL’si olmalı (Supabase transaction pooler, Neon, Railway Postgres vb.).

3. **Migration’dan sonra**  
   API’yi yeniden başlat (Redeploy). Bundan sonra `POST /v1/batches` 500 yerine normal 201/4xx dönmeli.

## Opsiyonel (Supabase auth, S3, Paddle)

| Variable | Açıklama |
|----------|----------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_JWKS_URL` | Supabase JWKS (JWT doğrulama) |
| `SUPABASE_JWT_ISSUER` | JWT issuer |
| `SUPABASE_JWT_AUDIENCE` | JWT audience |
| `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` | Dosya depolama (MinIO / R2 / S3) |
| `PADDLE_*` | Paddle billing (abonelik) |

## Özet checklist

- [ ] `DATABASE_URL` production Postgres’e ayarlı
- [ ] `REDIS_URL` production Redis’e ayarlı
- [ ] `ALLOWED_ORIGIN` = `https://batchtube.net` (ve gerekiyorsa `ALLOWED_ORIGIN_2`)
- [ ] Aynı `DATABASE_URL` ile `npx prisma migrate deploy` çalıştırıldı
- [ ] API redeploy edildi
