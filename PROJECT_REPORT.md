# BatchTube – Proje Raporu (Ayrıntılı)

**Tarih:** 2026  
**Proje yolu:** `batchtube (2)/`

---

## 1. Proje Özeti

**BatchTube**, birden fazla platformdan (YouTube, TikTok, Instagram, X, Vimeo, SoundCloud vb.) toplu medya indirme yapan **SaaS** tabanlı bir uygulamadır. Kullanıcılar linkleri gönderir; sistem kuyruğa alır, yt-dlp ile indirir, dosyaları S3/R2’ye yükler ve tek tek veya ZIP olarak sunar. Plan/credit, abonelik (Paddle) ve API key ile geliştirici erişimi destekler.

---

## 2. Mimari Genel Bakış

| Katman | Teknoloji | Açıklama |
|--------|-----------|----------|
| **Frontend** | React, TypeScript, Vite, TailwindCSS | Kullanıcı arayüzü (batchtube.net), SmartBar odaklı UI |
| **Auth** | Supabase | JWT ile kimlik doğrulama; kullanıcı verisi Supabase’de değil, kendi DB’de |
| **API** | Fastify, Node.js, TypeScript | `/v1/*` REST API; batch, dosya, hesap, fatura, API key |
| **Worker** | Node.js, BullMQ | Kuyruktan batch alır, yt-dlp ile indirir, S3’e yükler |
| **Veritabanı** | PostgreSQL (Railway) | Prisma ORM; kullanıcı, batch, item, file, kredi, kullanım |
| **Kuyruk** | Redis (Railway), BullMQ | Job kuyruğu; API job ekler, worker işler |
| **Depolama** | S3 uyumlu (MinIO / R2 / AWS S3) | İndirilen dosyalar ve ZIP arşivleri |
| **Admin** | React, Vite (ayrı `admin/` projesi) | İç panel; `/admin-api/*` ile konuşur |
| **Deploy** | Railway (API + Worker), Vercel (frontend), Docker | API ve worker aynı repo’dan, root directory `api` |

---

## 3. Repo Yapısı

```
batchtube (2)/
├── api/                    # Ana backend (Fastify + Prisma + Worker)
│   ├── src/
│   │   ├── app.ts, server.ts, config.ts, runtime-config.ts
│   │   ├── plugins/        # auth, api-key, rate-limit, idempotency, admin-auth
│   │   ├── routes/         # batches, files, account, api-keys, billing, admin
│   │   ├── services/       # download, redis, db, plans, paddle, webhooks, providers, cookieExpiry, audit
│   │   ├── queues/         # bull (BullMQ), worker (job işleyici)
│   │   ├── storage/        # S3/R2 client
│   │   └── utils/
│   ├── prisma/             # schema, migrations, seed, RLS
│   ├── docs/               # API_SPEC.md, OPENAPI.yaml
│   ├── Dockerfile          # Node 20, ffmpeg, yt-dlp
│   ├── railway.json
│   └── .env.example
├── frontend/               # Ana kullanıcı SPA (batchtube.net)
│   ├── src/
│   │   ├── App.tsx, main.tsx
│   │   ├── screens/, pages/
│   │   ├── components/     # SmartBar, modals, FloatingProcessingPanel
│   │   ├── hooks/, lib/, services/
│   │   └── config/
│   └── vercel.json
├── admin/                  # İç admin paneli (React, port 5174)
├── backend/                # Eski/alternatif Express backend (opsiyonel)
├── supabase/               # Supabase migration’ları (auth/onboarding vb.)
├── docker-compose.yml      # Postgres, Redis, MinIO, api, admin
└── README.md, RAILWAY_*.md, DEPLOYMENT_*.md
```

---

## 4. API (api/) Detayı

### 4.1 Giriş Noktaları

- **Sunucu:** `SERVICE_ENTRY=server` → `node dist/server.js` (Fastify).
- **Worker:** `SERVICE_ENTRY=worker` → `tsx src/queues/worker.ts` (BullMQ consumer).

### 4.2 Kayıtlı Route’lar (app.ts)

- `GET /health` – Sağlık kontrolü.
- **Auth:** JWT (Supabase) veya API Key (`Authorization: Bearer bt_live_...`).
- **Route’lar:** batches, files, account, api-keys, billing.  
- **Not:** `admin` route’u (admin.ts) ve `adminAuthPlugin` şu an **app.ts içinde register edilmemiş**; admin panelinin çalışması için bu route’ların eklenmesi gerekir.

### 4.3 Ana Endpoint’ler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /v1/batches | URL listesi ile batch oluştur; plan/credit kontrolü, Redis kuyruğuna ekleme |
| GET | /v1/batches | Batch listesi (sayfalı) |
| GET | /v1/batches/:id | Batch detayı |
| POST | /v1/batches/:id/cancel | Batch iptal |
| GET | /v1/batches/:id/items | Batch item listesi |
| GET | /v1/batches/:id/zip | ZIP için imzalı URL |
| GET | /v1/files/:id/download | Dosya indirme için imzalı URL |
| GET | /v1/account/usage | Kullanım ve limitler |
| POST/GET/DELETE | /v1/api-keys | API key CRUD |
| Billing | /v1/billing/* | Paddle abonelik / webhook |

### 4.4 Veritabanı (Prisma)

- **users** – email, password_hash, plan (starter/power_user/archivist/enterprise), disabled, stripe_customer_id, webhook_secret.
- **profiles** – plan (free/pro/archivist/enterprise), Paddle müşteri/abonelik ID.
- **batches** – user_id, name, status, options (format, quality, archive_as_zip), callback_url, zip_file_path, item_count.
- **batch_items** – batch_id, original_url, provider, status, progress, error_message.
- **files** – item_id, batch_id, user_id, storage_path, filename, file_size_bytes, mime_type, expires_at.
- **usage_counters** – user_id, period_start, bandwidth_bytes, batches_processed, credits_used.
- **credit_ledger** – user_id, amount, reason, batch_id (kredi düşüm kaydı).
- **api_keys** – user_id, key_prefix, key_hash, name.
- **audit_logs** – user_id, action, resource_id, ip_address.

### 4.5 Plan ve Kredi

- **Planlar:** free, pro, archivist, enterprise (plans.ts içinde PLAN_LIMITS).
- **Limitler:** maxBatchLinks, monthlyCredits, concurrency, rateLimitPerMinute, fileTtlHours, apiAccess, costPerUrl.
- Batch oluşturulurken kredi kontrolü ve düşüm; admin rolü limit/credit bypass.

### 4.6 Provider ve İndirme

- **providers.ts:** URL’den provider tespiti (youtube, tiktok, instagram, twitter, vimeo, soundcloud, mixcloud, bandcamp, reddit, vb.); ses odaklı siteler için varsayılan format mp3, diğerleri mp4.
- **download.ts:** yt-dlp çağrısı; format (mp4/mp3/mkv), kalite (best/4k/1080p/720p); isteğe bağlı cookie (YT_DLP_COOKIES_FILE); ilk hata durumunda video için tekrar deneme (daha uyumlu format).
- **cookieExpiry.ts:** Cookie dosyası süre kontrolü; worker başlangıç ve periyodik uyarı.

### 4.7 Worker Akışı

1. BullMQ’dan batch job alır (batchId, userId).
2. Plan ve retention süresini okur; batch’i “processing” yapar.
3. Her item için: provider tespit, format/kalite (batch options + provider varsayılanı), yt-dlp ile indirme, S3’e yükleme, File kaydı, BatchItem güncelleme.
4. Tamamlanan dosyalardan ZIP oluşturup S3’e yükler (archive_as_zip ise).
5. Batch’i completed/failed yapar; webhook (callback_url) tetikler.

---

## 5. Frontend (frontend/) Detayı

- **Framework:** React, Vite, TypeScript, TailwindCSS.
- **Auth:** Supabase client; giriş/kayıt/JWT.
- **Ana akış:** SmartBar’a link/channel/komut yapıştırma → kaynak tespiti (tek link, çoklu link, kanal/playlist, komut) → önizleme → batch oluşturma veya tek indirme.
- **Sayfalar/ekranlar:** Landing, Login, SignUp, Dashboard, NewBatch, Settings, Files, History, Pricing, Billing, Supported Sites, FAQ, How It Works, API Docs, Legal (Terms, Privacy), vb.
- **Bileşenler:** SmartBar, SingleVideoPreview, MultiLinkPreview, ChannelPlaylistProfilePreview, FloatingProcessingPanel, SourceSelectionModal, BatchTubeLogo, AuthScreen, modals (Files, History, Profile, BatchDetails, Api, Settings).
- **Servisler:** batchAPI / batchesAPI, filesAPI, accountAPI, apiKeysAPI, subscriptionAPI; API base URL env’den (Vercel’de api.batchtube.net).

---

## 6. Admin Paneli (admin/)

- **Amaç:** Kullanıcılar, API key’ler, KPI’lar, audit log yönetimi.
- **Stack:** React 19, Vite 6, React Router 7, Tailwind.
- **Sayfalar:** Login, Dashboard, Users, UserDetail, AuditLogs.
- **API:** `/admin-api/*` (health, kpis, users CRUD, api-keys, audit-logs). Bu route’lar şu an ana API `app.ts` içinde **kayıtlı değil**; admin panelinin tam çalışması için `adminRoute` ve `adminAuthPlugin` eklenmeli.

---

## 7. Altyapı ve Deploy

### 7.1 Ortam Değişkenleri (Özet)

**API / Worker (Railway):**

- DATABASE_URL, DIRECT_URL → Railway Postgres (aynı).
- REDIS_URL → Railway Redis (API ve worker aynı).
- ALLOWED_ORIGIN, ALLOWED_ORIGIN_2 (veya CORS_ALLOWED_ORIGINS).
- SUPABASE_URL, SUPABASE_JWKS_URL veya SUPABASE_JWT_ISSUER (JWT doğrulama).
- S3: S3_ENDPOINT, S3_REGION, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET (veya AWS_* alias’ları); R2 için S3_SKIP_BUCKET_ENSURE.
- İsteğe bağlı: YT_DLP_COOKIES_FILE (yaş kısıtlı içerik için).
- Worker için: SERVICE_ENTRY=worker; aynı DB, Redis ve S3 değişkenleri.

**Frontend (Vercel):**

- VITE_API_BASE_URL (örn. https://api.batchtube.net).
- VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.

### 7.2 Docker

- **docker-compose.yml:** Postgres, Redis, MinIO, api servisi, admin (geliştirme).
- **api/Dockerfile:** Node 20, ffmpeg, yt-dlp, prisma generate + build; root directory Railway’de `api`.

### 7.3 Railway

- Proje: API + Worker aynı repodan; root directory `api`.
- Servisler: Postgres, Redis, batchtube (API), worker. API ve worker aynı DATABASE_URL, DIRECT_URL, REDIS_URL ve S3 ayarlarını kullanır.
- Detay: RAILWAY_VARIABLES.md, RAILWAY_SETUP.md.

---

## 8. Güvenlik ve Limitler

- **Auth:** Supabase JWT veya API Key; admin rolü JWT `app_metadata.role` ile (admin/owner/service_role).
- **Rate limit:** Redis tabanlı; plana göre dakikada istek limiti.
- **Idempotency:** POST /v1/batches için Idempotency-Key header.
- **CORS:** ALLOWED_ORIGIN / CORS_ALLOWED_ORIGINS ile sınırlı origin.
- **URL:** Sadece http(s); localhost ve iç IP’ler engelli (providers.ts).

---

## 9. Önemli Notlar ve Eksikler

1. **Admin API:** `admin` route’u ve admin auth plugin’i `app.ts` içinde register edilmediği için `/admin-api/*` şu an dışarıya kapalı; admin paneli tam çalışmaz. Açmak için `app.ts`’e admin route ve admin auth eklenmeli.
2. **Çift backend:** Hem `api/` (Fastify, ana sistem) hem `backend/` (Express, eski) var; production’da genelde sadece `api/` kullanılır.
3. **Cookie:** yt-dlp için cookie zorunlu değil; sadece yaş kısıtlı/giriş gerektiren içerik için YT_DLP_COOKIES_FILE isteğe bağlı. Süre takibi ve uyarı (cookieExpiry, worker log, admin health) mevcut.
4. **Format/Kalite:** mp4, mp3, mkv; kalite best / 4k / 1080p / 720p; provider’a göre varsayılan format (ses siteleri mp3, diğerleri mp4).

---

## 10. Kısa Özet

BatchTube, çoklu platform toplu indirme odaklı bir SaaS’tır. Fastify API batch oluşturur, Redis/BullMQ ile kuyruğa alır; Node worker yt-dlp ile indirir, S3’e yükler ve gerekirse ZIP sunar. Auth Supabase JWT veya API key; plan/credit ve Paddle entegrasyonu var. Frontend SmartBar merkezli; admin paneli ve admin API kodu var ancak admin route’ları ana uygulamada henüz açılmamıştır. Deploy: Railway (API + Worker + Postgres + Redis), Vercel (frontend), S3 uyumlu depolama (R2/MinIO/AWS).
