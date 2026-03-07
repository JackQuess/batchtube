# Backend Gaps: Source Intelligence Layer

The SmartBar source detection (single video, multiple links, channel, playlist, profile, command) is implemented on the frontend. The following backend endpoints are **not** required for basic flows but are needed for full UX.

## Current behavior without these endpoints

- **Single video / multiple links**: Work today. Frontend sends `POST /v1/batches` with `urls: string[]`. Backend creates one item per URL.
- **Channel / playlist / profile**:
  - **"Download all"**: Frontend can send the single source URL as one batch item. Whether the worker expands it to multiple videos depends on backend/worker (e.g. yt-dlp with/without `--no-playlist`). Currently the API accepts one URL per item.
  - **"Download latest 10/25/50"**: Requires a list of video URLs. Without an endpoint that returns item URLs for a source, the frontend cannot create a batch with exactly N items.
  - **"Select items manually"**: Requires a list of items (title, thumbnail, url) to show in the selection modal. Without an endpoint, the modal shows an empty state and documents the gap.

## Recommended endpoints (optional, for full experience)

### 1. Source preview (metadata only)

- **Method/Path**: `GET /v1/sources/preview`
- **Query**: `url` (string, required)
- **Auth**: Required (Bearer)
- **Response**:  
  `{ "title": string, "thumbnail": string | null, "itemCount": number | null, "type": "channel" | "playlist" | "profile" }`
- **Purpose**: Show source title/thumbnail/count in SmartBar preview without loading all items.

### 2. Source items (paginated list)

- **Method/Path**: `GET /v1/sources/items`
- **Query**: `url` (string), `type` (`channel` | `playlist` | `profile`), `page` (default 1), `limit` (default 50, max 100)
- **Auth**: Required
- **Response**:  
  `{ "data": [{ "id": string, "url": string, "title": string, "thumbnail": string | null, "duration": string | null, "publishedAt": string | null }], "meta": { "total": number } }`
- **Purpose**: Power "Select items manually" and "Download latest N" (frontend requests limit=N and creates batch with returned URLs).

## Frontend adapter

- **`frontend/src/lib/sourceItemsAdapter.ts`**: Exposes `fetchSourcePreview`, `fetchSourceItems`, `fetchLatestItemUrls`. When backend adds the above, set `BACKEND_HAS_SOURCE_ENDPOINTS = true` and implement the HTTP calls. No change required in SmartBar or modals beyond the adapter.

## Agent mode (future)

If "Add as agent" or recurring channel/playlist sync is added, the same source endpoints can be reused; additional endpoints for agent CRUD and scheduling would be needed separately.
