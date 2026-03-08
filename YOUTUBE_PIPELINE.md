# YouTube download pipeline (BatchTube)

This document describes the YouTube-specific download strategy, commands, retry/cookie logic, and manual test cases.

## Files changed

| File | Changes |
|------|--------|
| `api/src/services/download.ts` | YouTube error classification, `YtDlpError`, format fallback chain, cookie-first/no-cookie strategy, transient retries, structured `youtube_*` logs, `downloadWithYtDlp(..., provider?)` |
| `api/src/queues/worker.ts` | Pass `provider` into `downloadWithYtDlp`; `youtube_upload_start` / `youtube_upload_success` for YouTube items; store clean `youtube_*` error codes in `batch_item.error_message` |
| `api/Dockerfile` | Explicit `ffmpeg -version` check at build time; comment that worker needs yt-dlp + ffmpeg |

No changes to API contracts, auth, billing, or frontend. Other providers (Instagram, TikTok, SoundCloud, etc.) are unchanged.

---

## Exact yt-dlp commands

Commands are built in `runYtDlp()` in `api/src/services/download.ts`. Base args:

- `--no-playlist`
- `--no-warnings`
- `-o <tempDir>/<outputFileName>.%(ext)s`
- `--no-check-certificate`
- **Optional:** `--cookies <file>` when `useCookies === true` and `YT_DLP_COOKIES_FILE` is set and the file exists.

**Video (mp4/mkv):**

- Format arg: `-f <selector>` with `--merge-output-format mp4` or `mkv`.
- Selectors used for YouTube (in order on failure): `bestvideo+bestaudio/best` → `best` → `bestaudio`.

**Audio (mp3):**

- `--extract-audio --audio-format mp3 --audio-quality 0` (no `-f`).

**Example – first attempt (no cookies):**

```bash
yt-dlp --no-playlist --no-warnings -o /tmp/batchtube-.../itemId.%(ext)s --no-check-certificate -f bestvideo+bestaudio/best --merge-output-format mp4 "https://www.youtube.com/watch?v=..."
```

**Example – cookie retry (when auth/age error detected and `YT_DLP_COOKIES_FILE` exists):**

```bash
yt-dlp --no-playlist --no-warnings -o /tmp/batchtube-.../itemId.%(ext)s --no-check-certificate --cookies /app/cookies/youtube.txt -f bestvideo+bestaudio/best --merge-output-format mp4 "https://www.youtube.com/watch?v=..."
```

Cookies path comes from env: `YT_DLP_COOKIES_FILE=/app/cookies/youtube.txt` (or any path you set). Cookie retry is only used when the file exists.

---

## Retry logic

- **Transient retries:** Up to **2** attempts with **exponential backoff** (1s, 2s).
- **Retried:** Network failures, extractor errors, temporary HTTP (5xx), and similar (see `YOUTUBE_RETRIABLE_PATTERNS` / `classifyYoutubeError()`).
- **Not retried:** Private video, unavailable video, and other non-retriable classifications (we fail immediately and report the mapped code).

Retries are applied per format attempt (see format fallback below). After cookie retry (if applicable), we then run the transient retries for that same format before moving to the next format.

---

## Cookie fallback logic

1. **Step 1:** Run yt-dlp **without** `--cookies`.
2. **Step 2:** If the run fails, check stderr for auth/age/login patterns:
   - "Sign in to confirm your age" / "confirm your age"
   - "This video may be inappropriate"
   - "HTTP Error 403"
   - "Login required" / "login to view"
   - "Video unavailable" / "video is unavailable"
3. **Step 3:** If such an error is detected **and** `YT_DLP_COOKIES_FILE` is set **and** that file exists, **retry once** with `--cookies <file>`.
4. If the cookie file is missing or not set, we do not add `--cookies` and may fail with the same error (e.g. age-restricted).

---

## Format fallback (YouTube only)

Used only when `provider === 'youtube'` and only for **video** (mp4/mkv). For **mp3** we use a single attempt (with optional cookie retry and transient retries).

**Order:**

1. **Attempt 1:** `bestvideo+bestaudio/best`
2. **Attempt 2:** `best`
3. **Attempt 3:** `bestaudio`

Each attempt can trigger cookie retry and then up to 2 transient retries. If all three formats fail, the last classified error code is returned (e.g. `youtube_download_error`).

---

## Structured logging (YouTube)

All events are JSON logs with a `msg` field:

- `youtube_metadata_start` – pipeline start (itemId, url, format, quality).
- `youtube_metadata_success` – pipeline succeeded for this item.
- `youtube_metadata_failed` – pipeline failed (with `code`).
- `youtube_download_start` – download attempt started.
- `youtube_download_retry` – transient retry (attempt, maxAttempts, delayMs).
- `youtube_download_cookie_retry` – retry with cookies (cookiesPath).
- `youtube_download_format_fallback` – next format in chain (attemptFormat, previousError snippet).
- `youtube_download_success` – download succeeded (optional: formatSelector, usedCookies, afterRetry).
- `youtube_download_failed` – download failed (code, stderrSnippet).
- `youtube_upload_start` – worker started S3 upload for this YouTube item.
- `youtube_upload_success` – worker finished S3 upload for this YouTube item.

---

## Error mapping (batch item + logs)

Failures are classified and stored as clean codes in `batch_item.error_message` and in logs:

| Code | Meaning |
|------|--------|
| `youtube_private_video` | Video is private |
| `youtube_age_restricted` | Age restriction (sign-in/cookies may help) |
| `youtube_login_required` | Login/cookies required |
| `youtube_unavailable` | Video unavailable |
| `youtube_extractor_error` | Extractor/parsing error (often transient) |
| `youtube_download_error` | Other download/network error |

Worker logs also include `youtubeErrorCode` in `worker_item_failed` when the error message starts with one of these codes.

---

## Runtime dependencies (worker container)

- **yt-dlp:** Installed at `/usr/local/bin/yt-dlp` (standalone `yt-dlp_musllinux`; no Python required).
- **ffmpeg:** Installed via `apk add ffmpeg`; checked at build with `ffmpeg -version`.
- **node:** Used to run the worker; yt-dlp is invoked via `child_process.spawn`.

The Dockerfile does not install `python3`; the standalone yt-dlp binary is sufficient.

---

## Manual test instructions

1. **Public YouTube video**  
   - Add a single public URL (e.g. `https://www.youtube.com/watch?v=dQw4w9WgXcQ`).  
   - Expect: download succeeds without cookies; logs show `youtube_download_start` → `youtube_download_success` → `youtube_upload_start` → `youtube_upload_success`.

2. **Age-restricted video**  
   - Add an age-restricted YouTube URL.  
   - Without `YT_DLP_COOKIES_FILE` (or with missing file): expect failure with `youtube_age_restricted` (or similar) and `youtube_download_cookie_retry` not used.  
   - With a valid cookies file at `YT_DLP_COOKIES_FILE`: expect cookie retry and possibly success; logs show `youtube_download_cookie_retry` then success or a clear failure code.

3. **YouTube playlist**  
   - Add a playlist URL.  
   - Current behavior: `--no-playlist` is always used, so only the first (or single) video is processed. Expect same pipeline as a single video (no playlist expansion).

4. **YouTube channel video**  
   - Add a normal watch URL from a channel.  
   - Expect: same as public video; no special handling.

5. **MP3 extraction**  
   - Create a batch with format `mp3` and a YouTube video URL.  
   - Expect: download with `--extract-audio --audio-format mp3 --audio-quality 0`; no video format fallback chain; cookie retry and transient retries still apply. Logs show `youtube_download_start` and success/failure as above.

**How to run:**

- Start API + worker + Redis + (optional) S3/MinIO.  
- Create a batch (via UI or API) with the test URL(s) and desired format.  
- Inspect worker logs for the `youtube_*` messages and batch item status/`error_message` in the DB or UI.

**Cookie file for age-restricted tests:**

- Export cookies for `youtube.com` (e.g. browser extension or cookie editor) in Netscape format.  
- Set `YT_DLP_COOKIES_FILE=/app/cookies/youtube.txt` (or your path) and ensure the file is present in the worker container at that path.
