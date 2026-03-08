# Railway – Runtime configuration (BatchTube API & Worker)

## Target architecture

| Component    | Use |
|-------------|-----|
| **Frontend** | Vercel |
| **Auth**     | Supabase (JWT only; no Supabase Postgres for app data) |
| **API DB**   | **Railway Postgres** (Prisma runtime) |
| **Worker DB**| **Railway Postgres** (same as API) |
| **Queue**    | **Railway Redis** (BullMQ) |

**Important:** API and Worker must **not** use Supabase Postgres for Prisma at runtime. Use **Railway Postgres** only. Supabase is for auth (JWT verification) only.

---

## Prisma datasource

- **`DATABASE_URL`** – Used by Prisma at runtime (API and Worker). Must point to **Railway Postgres**.
- **`DIRECT_URL`** – Used by `prisma migrate deploy`. On Railway, set to the **same** Railway Postgres URL.

Do **not** set `DATABASE_URL` or `DIRECT_URL` to a Supabase host for the API/Worker services.

---

## Required env vars

### batchtube (API service)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | Railway Postgres connection string. |
| `DIRECT_URL`   | **Yes** | Same as `DATABASE_URL` (Railway Postgres). |
| `REDIS_URL`    | **Yes** | Railway Redis connection string. |
| `ALLOWED_ORIGIN`  | **Yes** | e.g. `https://batchtube.net` |
| `ALLOWED_ORIGIN_2`| Recommended | e.g. `https://www.batchtube.net` |
| `SUPABASE_URL`    | **Yes** (JWT auth) | Supabase project URL. |
| `SUPABASE_JWKS_URL` or `SUPABASE_JWT_ISSUER` | **Yes** (JWT) | For JWT verification. |

**Supabase değişkenleri (admin + JWT için):** Railway'de sadece **batchtube** servisine ekleyin. Supabase Dashboard → Project Settings → API:
- **SUPABASE_URL**: Project URL (örn. `https://xxxx.supabase.co`)
- **SUPABASE_JWT_ISSUER**: `https://xxxx.supabase.co/auth/v1` (kendi project URL'iniz + `/auth/v1`)
- **SUPABASE_JWKS_URL** (isteğe bağlı): `https://xxxx.supabase.co/auth/v1/.well-known/jwks.json`

Değişkenleri ekledikten sonra batchtube servisini yeniden deploy edin.

### worker service

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | **Same** Railway Postgres URL as API. |
| `DIRECT_URL`   | **Yes** | Same as `DATABASE_URL`. |
| `REDIS_URL`    | **Yes** | **Same** Railway Redis URL as API. |

API and Worker must use the **exact same** `DATABASE_URL`, `DIRECT_URL`, and `REDIS_URL`. Queue name in code: `batchtube-default`.

---

## How to set on Railway

1. Add **Postgres** and **Redis** services.
2. **batchtube** → Variables: reference Postgres `DATABASE_URL` (and set `DIRECT_URL` to same), reference Redis `REDIS_URL`.
3. **worker** → Variables: same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL`.
4. Redeploy both after changes.

---

## Migrations

```bash
cd api
# DATABASE_URL and DIRECT_URL = Railway Postgres, then:
npx prisma migrate deploy
```

---

## Startup diagnostics (no secrets)

API logs: `db_host_category` (railway_postgres | supabase_host_detected | local | other), `redis_status`, `queue_name`. If `DATABASE_URL` or `REDIS_URL` is missing, API exits with a clear error.

---

## Checklist

- [ ] **batchtube**: `DATABASE_URL` = Railway Postgres
- [ ] **batchtube**: `DIRECT_URL` = Railway Postgres
- [ ] **batchtube**: `REDIS_URL` = Railway Redis
- [ ] **batchtube**: Supabase auth vars set
- [ ] **worker**: same `DATABASE_URL`, `DIRECT_URL`, `REDIS_URL` as API
- [ ] `prisma migrate deploy` run against Railway Postgres
- [ ] Redeploy API and Worker
