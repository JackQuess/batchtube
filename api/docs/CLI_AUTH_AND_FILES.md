# Backend CLI compatibility: API key auth + GET /v1/files

## 1. Files changed

| File | Change |
|------|--------|
| `api/src/plugins/auth.ts` | Support both API key (`bt_live_...`) and JWT on all `/v1` routes; structured log `authType: 'jwt' \| 'api_key'`. |
| `api/src/routes/files.ts` | Add `GET /v1/files` (list files with pagination). |
| `cli/src/api.ts` | `FileListItem` extended for API shape (`filename`, `expires_at`). |
| `cli/src/commands/files.ts` | Use `filename` / `expires_at` from list response. |

No schema/migration changes. No changes to frontend or api-key-auth plugin.

---

## 2. Auth flow (main /v1 routes)

All `/v1` requests (except OPTIONS and `/health`) go through **one** auth preHandler in `auth.ts`:

1. **No `Authorization: Bearer ...`**  
   → **401** “Missing or invalid Authorization header”.

2. **Bearer token starts with `bt_live_`** (API key path):
   - Look up `api_keys` by `sha256(token)`.
   - If not found or user disabled → **401** “Invalid API key”.
   - Load profile plan; if not in `['archivist', 'enterprise']` → **403** “API access requires Archivist or Enterprise.”.
   - Update `api_keys.last_used_at`.
   - Set `request.auth = { user, apiKey, tokenType: 'api_key', plan }`.
   - Log: `auth_resolved` with `authType: 'api_key'`.
   - **Return** (no JWT).

3. **URL is `/v1/api/*`**  
   → **Return** (no auth set here; api-key-auth plugin can handle it if needed).

4. **Otherwise** (JWT path):
   - Verify token with Supabase JWKS.
   - Resolve/create user and profile as before.
   - Set `request.auth = { user, tokenType: 'supabase_jwt', plan, isAdmin }`.
   - Log: `auth_resolved` with `authType: 'jwt'`.

Existing plan/credit/ownership checks are unchanged; they still use `request.auth.user.id` and `request.auth.plan`.

---

## 3. Schema / route changes

- **Schema:** None. No new tables or columns.
- **New route:** `GET /v1/files`
  - Query: `page` (default 1), `limit` (default 50, max 100).
  - Response: `{ data: File[], meta: { page, limit, total } }`.
  - Each file: `id`, `filename`, `size` (number), `mime`, `expires_at`, `created_at` (ISO strings).
  - Scoped to `request.auth.user.id`.
- **Existing routes** (unchanged behavior, now accept API key as well):
  - `POST /v1/batches`
  - `GET /v1/batches/:id`
  - `GET /v1/account/usage`
  - `GET /v1/files/:id/download`

---

## 4. Manual test steps

### a) Web app JWT

1. Log in on the web app (Supabase JWT in `Authorization`).
2. Create a batch, open a batch, check account/usage, download a file.
3. Confirm all work as before and logs show `authType: 'jwt'` for those requests.

### b) CLI with API key

1. Create an API key in the dashboard (user must have Archivist or Enterprise).
2. `batchtube login` and enter base URL + API key.
3. Run:
   - `batchtube whoami` → plan and credits.
   - `batchtube download <url>` → batch created.
   - `batchtube status <batchId>` → status.
   - `batchtube files` → list (if any).
   - `batchtube download-file <fileId>` → signed URL.
4. Confirm server logs show `authType: 'api_key'` for these requests.
5. Optional: use an API key for a Free/Pro user → expect **403** “API access requires Archivist or Enterprise.”.

### c) Files listing

1. Authenticate (JWT or API key).
2. `GET /v1/files` (e.g. `curl -H "Authorization: Bearer <token>" "http://localhost:PORT/v1/files"`).
3. Expect `200` and `{ data: [...], meta: { page, limit, total } }` with `id`, `filename`, `size`, `mime`, `expires_at`, `created_at`.
4. `GET /v1/files?page=2&limit=10` → second page, 10 per page.
