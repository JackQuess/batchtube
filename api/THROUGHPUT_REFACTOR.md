# BatchTube Throughput Refactor

This document summarizes the high-throughput distributed media processing refactor: diagnosis, file-by-file changes, orchestration flow, concurrency model, caching strategy, and manual test plan.

---

## A) Concise Bottleneck Diagnosis

**Where serial processing still existed:**

- **Batch job:** One `process-batch` job did all work serially (load batch, loop items, download each, upload, create file, build ZIP). For 100+ items the job ran for a long time and blocked other batches. **Fixed:** Batch is now an orchestrator; each item is a separate queue job; workers process items in parallel.
- **Channel/archive:** Full discovery ran in one go (e.g. `listSourceItemsParallel` or multiple pages), then all items created and enqueued at once. API waited for the full expansion before returning, and downloads only started after discovery finished. **Fixed:** Archive returns immediately; discovery runs in the worker with progressive paging; items are created and enqueued per page so downloads can start before discovery completes.

**What blocked channel/archive responsiveness:**

- Archive endpoint created the batch and enqueued one `channel-archive` job (good). The worker then did: set `discovering_items` → fetch all items (one big or parallel call) → set `queueing_items` → create all items → enqueue all item jobs. So the single discovery step blocked until the full list was ready. **Fixed:** Worker uses `listSourceItemsPaginated`; for each page it creates items, enqueues item jobs, and updates `item_count`; after the first page it sets status to `processing` so workers can start downloading while discovery continues.

**Where throughput was lost:**

- No per-item parallelism (one job did everything). **Fixed:** Per-item jobs and global + provider-aware concurrency.
- No download reuse: same URL in different batches re-downloaded. **Fixed:** Download cache (provider + sourceId + format + quality) with `File.cache_key`.
- No preview/source cache for repeated links. **Fixed:** Short-TTL resolve cache in `sourceResolver`; channel metadata already had 5-min cache in `channelMetadata`.

---

## B) File-by-File Changes

| Area | File | Change |
|------|------|--------|
| **Schema** | `api/prisma/schema.prisma` | `partially_completed` in `BatchStatus`; `File.cache_key` (optional, indexed with `expires_at`). |
| **Migrations** | `api/prisma/migrations/0007_partially_completed/migration.sql` | Add `partially_completed` to `batch_status` enum. |
| **Migrations** | `api/prisma/migrations/0008_add_file_cache_key/migration.sql` | Add `cache_key` to `files`, index `(cache_key, expires_at)`. |
| **Ingestion** | `api/src/services/urlIngestion.ts` | `normalizeUrlForIngestion`, `normalizeAndDedupeUrls`. |
| **Source list** | `api/src/services/sourceList.ts` | `listSourceItems` uses `--playlist-start`/`--playlist-end` for true paging; new `listSourceItemsPaginated` async generator for progressive discovery. |
| **Resolver** | `api/src/services/sourceResolver.ts` | Preview cache: `getCachedResolve`, `setCachedResolve` (5 min TTL); `resolveSource` uses cache. |
| **Channel meta** | `api/src/services/channelMetadata.ts` | Existing 5 min cache for channel title/thumbnail (unchanged). |
| **Download cache** | `api/src/services/downloadCache.ts` | New: `extractSourceId`, `computeDownloadCacheKey`, `findCachedFile` (reuse by provider+sourceId+format+quality). |
| **Provider concurrency** | `api/src/services/providerConcurrency.ts` | New: `getConcurrencyForProvider`, `acquire`/`release` in-memory semaphore per provider (extensible to Redis). |
| **Config** | `api/src/config.ts` | `workerConcurrency`; `workerConcurrencyByProvider` from env (e.g. `WORKER_CONCURRENCY_YOUTUBE=5`). |
| **Queues** | `api/src/queues/bull.ts` | `ItemJob`; job names `process-item`, `batch-finalize`. |
| **Queues** | `api/src/queues/enqueue.ts` | `enqueueBatchItems`, `enqueueBatchFinalize`, `enqueueChannelArchive`. |
| **Worker** | `api/src/queues/worker.ts` | `processItem`: provider slot acquire/release, download cache lookup then download, set `cache_key` on new files; `processBatchFinalize`; `processChannelArchive`: progressive discovery via `listSourceItemsPaginated`, create items + enqueue per page, credits deducted after discovery; legacy `processBatch` kept. |
| **Storage** | `api/src/storage/s3.ts` | `getObject(key)` for ZIP build in finalize. |
| **Batches route** | `api/src/routes/batches.ts` | Dedupe, create batch+items, `enqueueBatchItems`; `toBatchResponse`: `queued`/`processing`/`completed`/`failed`, optional `throughput_items_per_min`, `eta_seconds`; GET zip allows `partially_completed`. |
| **Webhooks** | `api/src/services/webhooks.ts` | `status` includes `partially_completed`. |
| **Env** | `api/.env.example` | `WORKER_CONCURRENCY`, optional `WORKER_CONCURRENCY_YOUTUBE` etc. |
| **Frontend** | `frontend/src/services/batchesAPI.ts` | `BatchListItem.status` includes `partially_completed`. |
| **Frontend** | `frontend/src/services/batchAPI.ts` | `BatchDetails.status` includes `partially_completed`; stateMap maps to `completed` for UI. |
| **Frontend** | `frontend/src/components/Modals/HistoryModal.tsx` | `statusToDisplay`: `partially_completed` → completed. |
| **Frontend** | `frontend/src/components/Modals/FilesModal.tsx` | List `completed` and `partially_completed`. |

---

## C) New Orchestration Flow

**Batch creation (POST /v1/batches, `auto_start: true`):**

1. Normalize and dedupe URLs; validate; enforce limits and credits.
2. Create batch (status `processing`), create one `BatchItem` per URL (status `queued`), deduct credits in same transaction.
3. Enqueue one `process-item` job per item (`enqueueBatchItems`).
4. Workers process item jobs in parallel (global and provider-aware concurrency).
5. When an item finishes, worker updates item; if terminal count ≥ batch `item_count`, enqueues one `batch-finalize` job.
6. `batch-finalize`: set batch status (`completed`/`partially_completed`/`failed`), build ZIP from S3, upload ZIP, set `zip_file_path`, send webhook.

**Channel/archive (POST /v1/archive):**

1. API creates batch (status `resolving_channel`, `item_count: 0`), enqueues one `channel-archive` job, returns immediately with batch id and optional channel meta (from cache or quick fetch).
2. Worker: set `discovering_items`; run `listSourceItemsPaginated` (page-by-page). For each page: set `queueing_items`, create `BatchItem` rows, enqueue `process-item` jobs for that page, update batch `item_count` and set status `processing`. So downloads start as soon as the first page is enqueued.
3. When discovery ends, deduct credits for total enqueued; if insufficient, mark batch failed and cancel items.
4. Same as steps 4–6 above (workers process items, finalize when all done).

**ZIP finalization:** Downloads complete independently of ZIP. ZIP is built in a separate `batch-finalize` job after all items are in a terminal state. Batch can expose individual files (via existing file/item APIs) before ZIP is ready.

---

## D) Concurrency Model

- **Global:** `WORKER_CONCURRENCY` (default 20) — max concurrent jobs per worker process.
- **Provider-aware:** Optional env vars `WORKER_CONCURRENCY_<PROVIDER>` (e.g. `WORKER_CONCURRENCY_YOUTUBE=5`, `WORKER_CONCURRENCY_VIMEO=15`). Effective concurrency for a provider is `min(global, provider_cap)`. Implemented via `providerConcurrency.ts`: in-memory semaphore per provider; before processing an item the worker acquires a slot for that provider and releases it in `finally`. For multiple worker processes, replace with a Redis-backed limiter (same interface).
- **Extensibility:** Add new providers or tune caps via env without code changes.

---

## E) Caching Strategy

**Preview/source cache:**

- **Resolver:** `sourceResolver.ts` — in-memory cache for `resolveSource` result, keyed by normalized URL, TTL 5 minutes. Used for repeated links in batches or archive.
- **Channel metadata:** `channelMetadata.ts` — existing 5 min cache for channel/playlist title and thumbnail (used for instant “channel detected” in archive response).

**Download cache:**

- **Key:** `provider + sourceId + format + quality` (hashed into `File.cache_key`). `sourceId` is derived from URL per provider (e.g. YouTube `v=`, Vimeo video id, TikTok/Instagram path).
- **Lookup:** Before downloading, worker computes `cache_key` and calls `findCachedFile(cacheKey)` (finds a non-expired `File` with that key). If found, creates a new `File` row for the current item pointing to the same `storage_path`, marks item completed, skips download and bandwidth increment.
- **Store:** When a new file is written after download, `cache_key` is set on the `File` row for future reuse.
- **Scope:** Global reuse (any user/batch can reuse); expiry follows existing `expires_at` (plan-based TTL).

---

## F) Manual Test Plan

| # | Scenario | Steps | What to check |
|---|----------|--------|----------------|
| 1 | **10 URLs** | POST /v1/batches with 10 URLs, `auto_start: true`. | Batch created; items enqueued; GET /v1/batches/:id shows progress (queued → processing → completed); counts and optional throughput/eta; ZIP available when done. |
| 2 | **100 URLs** | POST /v1/batches with 100 URLs, `auto_start: true`. | High throughput: many items in parallel; batch completes without one long serial run; queued/processing/completed/failed update; ZIP contains successful items. |
| 3 | **Mixed providers** | POST /v1/batches with URLs from 2+ providers (e.g. YouTube, Vimeo, TikTok). | All items created and processed; provider set per item; provider-aware concurrency applies if configured; batch finalizes; ZIP has files from all providers. |
| 4 | **Archive youtube.com/@fireship** | POST /v1/archive with `source_url: https://youtube.com/@fireship`, mode e.g. `latest_25`. | Response returns quickly with batch id and channel title; in background: resolving_channel → discovering_items → queueing_items → processing; items enqueued progressively; downloads can start before full discovery; final status and ZIP when done. |
| 5 | **Large duplicate-heavy input** | POST /v1/batches with 200 URLs where many are duplicates or same URL with different query params. | After normalize+dedupe, item count < 200; no duplicate item jobs; download cache may reuse for repeated same media in same batch. |
| 6 | **Partially completed ZIP access** | Create a batch where some items fail (e.g. invalid URL). | Batch status becomes `partially_completed`; ZIP is built with successful items only; GET /v1/batches/:id/zip returns 200 and signed URL; frontend download works. |
| 7 | **Multi-worker safety** | Run 2+ worker processes (same Redis, same DB). | No assumptions that only one worker exists: item jobs are independent; progress is aggregated from DB (item statuses); batch finalize is enqueued once when terminal count reaches item_count (BullMQ job id prevents duplicate finalize); no in-memory state shared across workers. Provider limiter is in-memory per process — for strict cross-worker caps use Redis-backed limiter. |

---

## Worker Scaling Readiness

- **Stateless workers:** Each job loads batch/item from DB; no in-process state assumed across jobs.
- **Item jobs safe for multiple replicas:** Job id `item-{batchId}-{itemId}` ensures one job per item; workers compete for jobs via Redis; DB updates are per item.
- **Progress aggregation:** Counts (queued/processing/completed/failed) are computed from `BatchItem` status in DB on each GET; works with any number of workers.
- **Finalize once:** When the last item reaches a terminal state, one worker enqueues `batch-finalize` with job id `batch-finalize-{batchId}`; duplicate finalize jobs are avoided by BullMQ job id.

---

**Summary:** BatchTube is refactored into a high-throughput orchestrated system: batch as container, per-item queue jobs, progressive channel discovery, provider-aware concurrency hooks, preview and download caches, throughput/ETA reporting, and multi-worker-safe design, while keeping existing auth, billing, storage, and frontend intact.
