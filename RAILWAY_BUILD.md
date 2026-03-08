# Railway build: Worker & API

## Repository structure

- **API (and worker) source:** `api/`
- **Root Dockerfile** (`./Dockerfile`): expects build context = **repo root** and runs `COPY api/ ./`.

## If you see "COPY api/ not found" or "failed to compute checksum"

Railway is building with **Root Directory = `api`**, so the build context is only the contents of `api/`. There is no `api` folder inside that context, so the root Dockerfile fails.

**Fix:** In Railway, for both **worker** and **batchtube (API)** services:

1. Open the service → **Settings** → **Source**.
2. Set **Root Directory** to **`api`**.
3. Redeploy.

Then Railway will use **`api/Dockerfile`** (and `api/railway.json`). That Dockerfile uses `COPY . ./` (no `api/` prefix) and works when the context is the `api` folder.

## Summary

| Root Directory | Dockerfile used   | COPY in Dockerfile |
|----------------|-------------------|---------------------|
| *(empty)*      | `./Dockerfile`    | `COPY api/ ./`      |
| `api`          | `api/Dockerfile`  | `COPY . ./`         |

Use **Root Directory = `api`** for worker and API so `api/Dockerfile` (Alpine + yt-dlp) is used.
