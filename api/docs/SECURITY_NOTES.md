# Security & Production Architecture Notes

## 1. Authentication & API Keys
- **Format:** Keys are opaque strings with a prefix, e.g., `bt_live_ab12...`.
- **Storage:** We store `key_prefix` (plaintext) and `key_hash` (SHA-256). We never store the full key.
- **Verification:** On request, extract prefix to find potential rows, then hash the incoming token to match `key_hash`.

## 2. Rate Limiting (Token Bucket)
- **Starter:** 60 req/min.
- **Power User:** 300 req/min.
- **Archivist:** 1000 req/min.
- **Implementation:** Redis `INCR` with TTL matching the window (1 minute).
- **Abuse:** Block IPs generating >50% 4xx errors over a 5-minute window.

## 3. Webhook Security
- **Signatures:** All webhooks include `X-BatchTube-Signature`.
- **Computation:** `HMAC-SHA256(payload, webhook_secret)`.
- **Replay Attacks:** Timestamps are included in the payload; clients should verify the event is recent (<5 mins).

## 4. Concurrency & Quotas
- **Database Limits:** `batch_items` logic enforces `MAX_ITEMS_PER_BATCH` based on plan.
- **Worker Isolation:** `Archivist` jobs are pushed to a high-priority Redis queue (`batchtube-priority`). Others go to `batchtube-standard`.
- **Zip Bombs:** Max batch size limits prevent resource exhaustion during zipping.

## 5. Data Retention
- **Policy:** Files are deleted 24h (Starter) or 7d (Archivist) after creation.
- **Enforcement:** Background worker/cron should run object + DB cleanup for `files.expires_at < NOW()`.

## 6. Idempotency
- Clients should send `Idempotency-Key` (UUID) header for `POST /batches`.
- Keys are cached in Redis for 24 hours.
