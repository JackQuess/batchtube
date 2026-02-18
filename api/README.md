# BatchTube API v1

Fastify + TypeScript + Prisma + Redis/BullMQ + MinIO implementation aligned to:
- `api/docs/API_SPEC.md`
- `api/docs/OPENAPI.yaml`
- `api/docs/DB_SCHEMA.sql`
- `api/docs/SECURITY_NOTES.md`

## Run with Docker

```bash
docker compose up --build
```

API base URL:
- `http://localhost:8080/v1`
- Admin API base URL: `http://localhost:8080/admin-api`

Required admin envs (in `api/.env` or compose env):
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (bcrypt hash)
- `ADMIN_JWT_SECRET`

## Seed local API key

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

Seed prints one `bt_live_...` API key once.

## Run API + worker without Docker

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

In another terminal:

```bash
cd api
npm run worker
```

## Tests

```bash
cd api
npm test
```

## Implemented endpoints
- `POST /v1/batches`
- `GET /v1/batches`
- `GET /v1/batches/:id`
- `POST /v1/batches/:id/cancel`
- `GET /v1/batches/:id/items`
- `GET /v1/batches/:id/zip`
- `GET /v1/files/:id/download`
- `GET /v1/account/usage`

### Admin endpoints
- `POST /admin-api/login`
- `POST /admin-api/logout`
- `GET /admin-api/health`
- `GET /admin-api/kpis`
- `GET /admin-api/users`
- `GET /admin-api/users/:id`
- `PATCH /admin-api/users/:id`
- `POST /admin-api/users/:id/api-keys`
- `DELETE /admin-api/api-keys/:id`
- `GET /admin-api/audit-logs`
