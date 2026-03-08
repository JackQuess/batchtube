# BatchTube Provider Engine Architecture

## A) Diagnosis: current provider coupling issues

- **Normalization spread across clients:** SmartBar (frontend) and batch create (frontend) each split/normalize input; there was no single contract or backend entry point for “normalize this paste”. That made it harder for API/CLI to reuse the same rules and to guarantee consistent dedup/invalid handling.
- **Resolver vs detection duplication:** Backend had `sourceResolver.resolveSource` (url → provider + sourceType); frontend had `sourceDetection.detectSource` (raw → type + items) with its own URL parsing and provider logic. Provider capabilities (supports playlist/channel/profile) lived only on the frontend (`providerRegistry`), so the backend could not return a consistent “supportsPreview / supportsSelection / supportsDownload” contract.
- **Preview vs download semantics mixed:** Listing (GET /v1/sources/items) and any future single-URL preview can fail with yt-dlp errors. If those errors are passed through verbatim, clients can see “Sign in to confirm” or other download-oriented messages and wrongly treat them as age-restriction or download failures. Preview must use only global codes (e.g. `preview_unavailable`) and never YouTube-specific download codes.
- **No shared types for API/CLI/desktop:** Success and error shapes differed by route; there was no single set of types (NormalizedInput, ProviderResolverResult, ProviderPreviewResult, ProviderDownloadResult, error codes) for all consumers.
- **Cache and extension points missing:** No TTL cache for preview or hooks for a future download cache, so every preview hit yt-dlp and there was no clear place to plug in caching later.

---

## B) Architecture summary: Provider Engine layers

1. **Input Normalization Layer**  
   - **Responsibility:** Raw SmartBar-style input → normalized URLs, invalid entries, duplicate count. Provider-agnostic.  
   - **Backend:** `inputNormalizer.normalizeInput(raw)` → `NormalizedInput`.  
   - **API:** `POST /v1/sources/normalize` (body: `{ raw }`).

2. **Resolver Layer**  
   - **Responsibility:** Map normalized URL to provider, source type, and capabilities (supportsPreview, supportsSelection, supportsDownload). Uses existing provider registry + new capability map.  
   - **Backend:** `sourceResolver.resolveToProviderResult(input)` → `ProviderResolverResult`.  
   - **API:** `GET /v1/sources/resolve?url=`.

3. **Preview Layer**  
   - **Responsibility:** Lightweight metadata only (title, thumbnail, duration; or item count + list for playlist/channel/profile). No download. Errors use global codes only (e.g. `preview_unavailable`).  
   - **Backend:** `previewMetadata.getPreviewMetadata(url)` for single URL (optional cache); `sourceList.listSourceItems` for lists.  
   - **API:** `GET /v1/sources/preview?url=`, `GET /v1/sources/items?url=&type=&page=&limit=`.  
   - **Cache:** In-memory preview cache (key = provider + normalizedUrl, TTL 5 min). Interface `IPreviewCache` for future Redis etc.

4. **Download Engine Layer**  
   - **Responsibility:** Actual file download after user confirmation; yt-dlp, retries, format/cookie fallback, ffmpeg, storage. Errors use standardized codes (global + YouTube-specific).  
   - **Backend:** `download.ts` (existing). Success: `{ filePath, mimeType, ext }`. Failure: throw with message that may start with `ProviderErrorCode`.  
   - **Contract:** `ProviderDownloadResult` (success, filePath, mimeType, sizeBytes, errorCode, errorMessage) for APIs that return a result instead of throwing.

5. **Error code standardization**  
   - **Global:** `unsupported_source`, `invalid_url`, `preview_unavailable`, `download_failed`, `temporary_provider_error`.  
   - **YouTube (download only):** `youtube_age_restricted`, `youtube_login_required`, `youtube_private_video`, `youtube_unavailable`, `youtube_extractor_error`, `youtube_format_unavailable`, `youtube_download_error`.  
   - Preview paths must not return YouTube codes; download engine classifies stderr and sets error message/code.

6. **Cache (minimal)**  
   - **Preview cache:** In-memory, key = `provider:normalizedUrl`, TTL configurable (default 300s). Implements `IPreviewCache`.  
   - **Download cache:** Interface `IDownloadCache` only (extension point for future).

---

## C) Files added/modified

| File | Change |
|------|--------|
| **api/src/types/providerEngine.ts** | **New.** Shared types: `NormalizedInput`, `ProviderResolverResult`, `ProviderPreviewResult`, `ProviderPreviewItem`, `ProviderDownloadResult`, `GlobalErrorCode`, `YoutubeErrorCode`, `IPreviewCache`, `IDownloadCache`. |
| **api/src/services/inputNormalizer.ts** | **New.** `normalizeInput(raw)` → `NormalizedInput`. |
| **api/src/services/providers.ts** | **Modified.** Added `PROVIDER_CAPABILITIES` and `getProviderCapabilities(provider)` (supportsPreview, supportsSelection, supportsDownload). |
| **api/src/services/sourceResolver.ts** | **Modified.** `resolveToProviderResult(input)` → `ProviderResolverResult` using capabilities; kept `resolveSource` and `SourceType`. |
| **api/src/services/previewCache.ts** | **New.** In-memory `IPreviewCache` + `buildPreviewCacheKey`. |
| **api/src/services/previewMetadata.ts** | **New.** `getPreviewMetadata(url)` for single URL (yt-dlp --dump-single-json), returns `ProviderPreviewResult`, uses preview cache. |
| **api/src/routes/sources.ts** | **Modified.** Added `POST /v1/sources/normalize`, `GET /v1/sources/resolve`, `GET /v1/sources/preview`; kept `GET /v1/sources/items`. |
| **api/src/services/download.ts** | **Modified.** Comment updated to reference `ProviderDownloadResult` and error code semantics. |

No changes to auth, billing, queue, or storage. Frontend continues to use SmartBar + existing detection; it can later call the new normalize/resolve/preview endpoints if desired.

---

## D) Standardized types/contracts

- **NormalizedInput:** `{ normalizedUrls: string[]; invalidEntries: string[]; duplicatesRemovedCount: number }`.
- **ProviderResolverResult:** `{ provider; sourceType: ProviderSourceType; normalizedUrl; supportsPreview; supportsSelection; supportsDownload; allowed; reason? }`.
- **ProviderPreviewResult:** `{ provider; sourceType; title?; thumbnail?; duration?; itemCount?; items?; warnings?; errorCode?; errorMessage? }`.
- **ProviderPreviewItem:** `{ id; url; title; thumbnail?; duration?; publishedAt? }`.
- **ProviderDownloadResult:** `{ success; filePath?; mimeType?; ext?; sizeBytes?; errorCode?; errorMessage? }`.
- **GlobalErrorCode** / **YoutubeErrorCode** / **ProviderErrorCode:** as listed in §B.5 and in `api/src/types/providerEngine.ts`.

---

## E) Current providers: preview, selection, download

| Provider | Preview | Selection (list) | Download |
|----------|--------|-------------------|----------|
| youtube | ✓ | ✓ (playlist, channel) | ✓ |
| vimeo | ✓ | ✓ (playlist) | ✓ |
| tiktok | ✓ | ✓ (profile) | ✓ |
| instagram | ✓ | ✓ (profile) | ✓ |
| twitter | ✓ | ✓ (profile) | ✓ |
| facebook | ✓ | ✓ (profile) | ✓ |
| reddit | ✓ | ✓ (profile) | ✓ |
| soundcloud | ✓ | ✓ (playlist, profile) | ✓ |
| dailymotion, twitch, bilibili, mixcloud, bandcamp, streamable, coub, archive, loom | ✓ | — | ✓ |
| generic | ✓ | — | ✓ |

“Selection” means the backend can list items (GET /v1/sources/items) for that source type. Download is via existing yt-dlp worker for all.

---

## F) Manual test checklist

1. **Single video** – Paste one video URL in SmartBar. Expect: normalization → resolver → single_preview (or preview from API if integrated). Then Download/Add to batch → download engine runs. No preview error coded as age_restricted.
2. **Multiple mixed links** – Paste several URLs (e.g. YouTube + TikTok). Expect: normalization (dedup, invalid separated) → resolver per URL → multi_preview → batch create → download for each.
3. **Playlist** – Paste playlist URL. Expect: resolver → source_preview; “Select items” → GET /v1/sources/items → list; choose “Download selected” or “Download latest” → download engine. List errors show preview_unavailable / listing message, not youtube_age_restricted.
4. **Channel** – Paste channel URL. Same as playlist: source_preview, list if supported, then download. Preview/list failures use only global codes.
5. **Profile** – Paste profile URL (e.g. TikTok @user). Same flow as playlist/channel.
6. **Unsupported source** – Paste invalid or unsupported URL. Expect: resolver returns allowed: false or invalid_url; preview may return errorCode invalid_url or preview_unavailable. No download attempted.
7. **YouTube false age restriction** – Use a public YouTube URL that was previously misclassified. Expect: preview and listing never return youtube_age_restricted; only the download step (after confirm) can set youtube_age_restricted, and only when the download stderr explicitly signals age (e.g. “confirm your age”, “Sign in to confirm your age”). Generic “Sign in to confirm” remains login_required in the download engine.

---

## Final rules

- yt-dlp remains the download engine; it is not replaced.
- Provider handling is data-driven from the registry and capability map; new providers require config only, not scattered conditionals.
- Preview and download are strictly separated; preview errors never use YouTube-specific or download-only codes.
- Architecture is extensible for web app, API, future CLI, and desktop app via the same types and endpoints.
