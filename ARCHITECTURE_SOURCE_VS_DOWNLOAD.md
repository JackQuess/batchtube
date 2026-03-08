# BatchTube: Source Resolver vs Download Engine

## A) Concise diagnosis

### Where preview and download were too coupled

- **Backend**
  - **GET /v1/sources/items** (playlist/channel listing) runs `yt-dlp --flat-playlist`. On failure, the route was forwarding raw yt-dlp stderr to the client. That stderr can contain "Sign in to confirm..." or other auth-like text, so the **preview path** could surface messages that look like download/age-restriction errors.
  - **download.ts** is used only in the worker for actual downloads, but its error classifier (`classifyYoutubeError`) was also effectively the only place that defined "age restricted". Any stderr containing "sign in to confirm" (even generic) was mapped to `youtube_age_restricted`, so **both** the listing preview and the download path could produce the same user-facing code when they shouldn’t.

- **Frontend**
  - SmartBar already separates: client-side source detection → preview / item list (from API) → user confirms → batch create → worker runs download. So preview is not literally calling the download engine. The coupling was: (1) **API listing errors** could look like download/age errors, and (2) **download error classification** was too broad, so many failures were labeled age-restricted.

### Why false age-restricted behavior happened

- **Over-broad pattern:** `classifyYoutubeError` treated **any** "sign in to confirm" as `youtube_age_restricted`. YouTube often returns a short message like "Sign in to confirm" without the words "your age". That can be login, policy, or region — not necessarily age. Mapping all of that to age_restricted caused false positives.
- **Extractor vs auth:** When yt-dlp returns something like `ExtractorError: ... Sign in to confirm ...`, the code checked "sign in to confirm" **before** "extractor", so it classified as age_restricted instead of extractor_error.
- **Preview path reusing download semantics:** Listing (GET /v1/sources/items) can fail with the same yt-dlp stderr. Returning that raw to the client made preview look like a "download failed / age restricted" flow. Preview should have its own, neutral error semantics.

---

## B) File-by-file changes

| File | Change |
|------|--------|
| **api/src/services/download.ts** | (1) Module comment: this file is the **Download Engine** only. (2) `classifyYoutubeError`: **youtube_age_restricted** only when the message explicitly mentions age ("confirm your age", "Sign in to confirm your age", "age-restricted", or "inappropriate" in an age/confirm context). Generic "Sign in to confirm" → **youtube_login_required** (still `authError: true` for cookie retry). Extractor and other codes unchanged. |
| **api/src/services/sourceResolver.ts** | **New.** Source Resolver (backend): `normalizeUrlForResolver`, `detectSourceTypeFromUrl`, `resolveSource`. Uses existing `providers.ts`; no yt-dlp, no download. |
| **api/src/services/sourceList.ts** | (1) Module comment: part of **Source Resolver** (listing/preview only); errors are preview errors. (2) On yt-dlp non-zero exit, throw generic `Error('LISTING_UNAVAILABLE')` instead of forwarding stderr, so download/age codes never leak from preview. |
| **api/src/routes/sources.ts** | On `LISTING_UNAVAILABLE`, return 422 with a safe message: "This source could not be listed. Try Download latest or Download all." No download error codes in response. |

No changes to auth, billing, queue, storage, or frontend layout. Frontend already uses SmartBar → preview → confirm → batch → worker; no flow change, only clearer backend semantics.

---

## C) Architecture summary

### Source Resolver Layer

- **Responsibility:** Understand input URL, detect provider and source type, support preview and listing. **Does not** perform the actual media download.
- **Frontend**
  - **sourceDetection.ts** – normalizes input, detects source type (single_video, playlist, channel, profile, multiple_links, command, unsupported).
  - **providerRegistry.ts** – provider list and capabilities (data-driven, aligned with backend).
  - **sourceItemsAdapter.ts** – calls GET /v1/sources/items for playlist/channel/profile item list (preview).
- **Backend**
  - **providers.ts** – provider registry (domain rules, default format, URL allowed).
  - **sourceResolver.ts** – URL normalization, provider detection, source-type-from-URL (video | playlist | channel | profile | direct_media | unsupported).
  - **sourceList.ts** – listing only: yt-dlp --flat-playlist for GET /v1/sources/items. Errors are preview-only (`LISTING_UNAVAILABLE`), never download/age codes.
- **API**
  - GET /v1/sources/items – listing for SmartBar selection; failures return a generic listing-unavailable message, not download errors.

### Download Engine Layer

- **Responsibility:** Execute the actual media download after user confirmation; retries, format/cookie fallback, ffmpeg, then storage.
- **Backend**
  - **download.ts** – single-entry download: yt-dlp run, format fallback, cookie retry, YouTube-specific strategy, `classifyYoutubeError` **only for download stderr**.
  - **worker** – batch job: for each item, calls `downloadWithYtDlp`, then upload and DB update. Download errors (including YouTube codes) stay in worker/batch item state and are not used in preview.
- **Flow:** User confirms in SmartBar → POST /v1/batches → worker runs download.ts → progress/files/history. Preview state is independent; a later download failure does not change the fact that preview succeeded.

### YouTube error codes (Download Engine only)

- **youtube_age_restricted** – only when the **download** error explicitly indicates age (e.g. "confirm your age", "Sign in to confirm your age", "age-restricted").
- **youtube_login_required** – login/cookie needed; includes generic "Sign in to confirm" and 403.
- **youtube_private_video**, **youtube_unavailable**, **youtube_extractor_error**, **youtube_download_error** – unchanged; used only in the download path.

---

## D) Manual test checklist

1. **Public YouTube video preview** – Paste a public watch URL in SmartBar. Expect: single-video preview (thumbnail, title, format/quality). No age/login error.
2. **Public YouTube video download** – From that preview, "Download" or "Add to batch". Expect: batch runs, file appears in queue/files. No false age_restricted.
3. **Age-restricted YouTube video** – Use a known age-restricted URL. Expect: preview may still show (if metadata is public); on **download**, expect `youtube_age_restricted` or success if cookies are set. No age_restricted from **listing** endpoint.
4. **YouTube playlist preview** – Paste a playlist URL. Expect: channel/playlist preview; "Select items" opens modal. If listing succeeds, items load. If listing fails (e.g. private list), expect generic "This source could not be listed..." message, **not** youtube_age_restricted.
5. **YouTube channel preview** – Paste a channel URL. Expect: channel preview; "Select items" or "Download latest" works. Listing errors are listing_unavailable only.
6. **Multiple mixed URLs** – Paste several URLs (e.g. YouTube + TikTok). Expect: multiple_links preview; batch create uses all; each provider handled by download engine without preview errors leaking.
7. **Unsupported URL** – Paste an invalid or unsupported URL. Expect: unsupported or validation error in preview; no download error codes in the UI.

---

## Final rule

- yt-dlp remains the actual download engine; it is not used for "understanding" the URL in the resolver (only for listing when needed).
- Preview is separate from download; preview/list errors never use download or age-restriction codes.
- False youtube_age_restricted is reduced by restricting that code to explicit age-related messages in **download** stderr only.
