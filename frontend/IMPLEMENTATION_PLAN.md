# BatchTube Frontend Refactor — Implementation Plan

## Design principles (unchanged)
- SmartBar-centered UI; no heavy dashboard.
- Logo top-left, user top-right, SmartBar center, settings bottom-left.
- Flows via modals, floating panels, inline previews.
- Reuse existing backend; no backend rewrites.

---

## Existing endpoints reused

| Endpoint | Service | Use |
|----------|---------|-----|
| `POST /v1/batches` | batchAPI.createJob | Create batch (urls, format, quality) |
| `GET /v1/batches` | **NEW batchesAPI.list** | History list (page, limit, status) |
| `GET /v1/batches/:id` | batchAPI.getStatus (partial) | Batch detail + progress |
| `GET /v1/batches/:id/items` | batchAPI.getStatus (partial) | Item list + file_id |
| `POST /v1/batches/:id/cancel` | **NEW batchAPI.cancel** | Cancel batch |
| `GET /v1/batches/:id/zip` | batchAPI.getSignedDownloadUrl | ZIP download |
| `GET /v1/account/usage` | accountAPI.getUsage | Credits, plan, limits |
| `GET /v1/files/:id/download` | **NEW filesAPI.getDownloadUrl** | Single file download (file id) |
| `POST /v1/api-keys` | **NEW apiKeysAPI.create** | Studio: create key |
| `GET /v1/api-keys` | **NEW apiKeysAPI.list** | Studio: list keys |
| `DELETE /v1/api-keys/:id` | **NEW apiKeysAPI.revoke** | Studio: revoke key |

---

## Backend gaps

1. **List user files** — No `GET /v1/files`. Workaround: derive from completed batches + items with `file_id`, then `GET /v1/files/:id/download` for URL. Frontend: `filesAPI.listFromBatches()`.
2. **Webhooks** — No webhook URL CRUD in API. Frontend: Developer panel shows placeholder + TODO until backend adds it.
3. **Plan naming** — Backend uses `archivist` | `enterprise` for API keys; UI “Studio” maps to `archivist` or `enterprise` (per plans.ts).

---

## File-by-file changes

### New files
- `src/hooks/useSmartBar.ts` — SmartBar state machine + parsed input.
- `src/lib/smartBarParser.ts` — URL parsing, provider detection, dedupe, command tokens.
- `src/services/batchesAPI.ts` — list batches, cancel batch (thin wrapper over apiClient).
- `src/services/filesAPI.ts` — get download URL; list from batch items (TODO if no list endpoint).
- `src/services/apiKeysAPI.ts` — create/list/revoke API keys (Studio).
- `src/components/ItemPickerModal.tsx` — Channel/playlist item picker (checkboxes, thumbnail, title, duration).
- `src/components/ChannelSelectionModal.tsx` — Channel/profile/playlist actions + “Select manually” → ItemPickerModal.

### Modified files
- `src/components/SmartBar.tsx` — Use useSmartBar; single/multi/channel/command previews; actions call onStartBatch/onOpenModal.
- `src/App.tsx` — Pass usage, onStartBatch (create job + track + open panel), active batch IDs for FloatingProcessingPanel.
- `src/components/FloatingProcessingPanel.tsx` — Real batch list, poll batchAPI.getStatus, progress bars, cancel, ZIP download.
- `src/components/Modals/HistoryModal.tsx` — Fetch GET /v1/batches, show list; click → batch details modal.
- `src/components/Modals/FilesModal.tsx` — Fetch files from completed batches + items (file_id), download via /v1/files/:id/download.
- `src/components/Modals/SettingsModal.tsx` — Already has menu; ensure “Developer” links to Developer panel and is hidden when plan !== archivist/enterprise.
- `src/components/Modals/ApiModal.tsx` — Replace mock with apiKeysAPI; webhook placeholder + TODO.
- `src/components/Modals/ProfileModal.tsx` — Optional: load user email/name from auth (no backend change).
- `src/components/Modals/PricingModal.tsx` — Keep current; optional link to billing.
- `src/components/Modals/SupportedSitesModal.tsx` — Use providerCatalog; search + category filters.
- `src/lib/auth.ts` / `App.tsx` — On 401 from apiClient, clear session and show auth recovery (lightweight).
- `src/index.css` / SmartBar — Subtle glow on focus, smooth height transition for preview (already partial).

### Unchanged (do not replace)
- Backend: server, worker, queue, providers, storage, billing.
- Auth: Supabase + getStoredUser, loginWithEmail, registerWithEmail, clearUser, getAuthHeadersFresh.
- Credit flow: accountAPI.getUsage, plan limits from backend.
- batchAPI.createJob, batchAPI.getStatus, batchAPI.getSignedDownloadUrl.
- trackedJobs (saveTrackedJob, listTrackedJobs).
- providerCatalog.ts, types.ts (extend only).

---

## State / context

- **SmartBar**: useSmartBar hook (local state + parser). Parent passes: onCommand(modal), onStartBatch({ urls, format, quality }), onOpenChannelPicker?.
- **Processing**: App holds `activeBatchIds: string[]`; when creating a batch, append jobId, saveTrackedJob; FloatingProcessingPanel receives `batchIds`, polls each, removes when completed/failed/cancelled. Optional: small context for “active batches” to avoid prop drilling.
- **Modals**: Existing activeModal state in App; Settings → Profile/Files/History/SupportedSites/Pricing/Developer; History → Batch details modal (batchId state).

---

## Manual test checklist

- [ ] Single link paste → preview (provider, title placeholder) → Download / Add to batch → batch created, panel opens, progress updates.
- [ ] Multiple links paste → grouped preview, dedupe, invalid count → Create batch → same flow.
- [ ] Channel/playlist URL → selection modal → Download latest / Select manually (item picker) → batch created.
- [ ] Command-like input → suggestion cards → action runs correct flow.
- [ ] Processing panel: progress bars, multiple batches, cancel, ZIP when completed.
- [ ] Settings → Files: list from completed batches, download file.
- [ ] Settings → History: list batches, click → batch details (items, status, ZIP).
- [ ] Developer panel: visible only for archivist/enterprise; create/list/revoke API keys; webhook TODO visible.
- [ ] Clipboard suggestion: “Link detected” → Paste into SmartBar (no auto-paste).
- [ ] Drag & drop text/URL list into SmartBar.
- [ ] Auth: 401 on request → session cleared, auth recovery shown; no raw backend errors to user.

---

## Implementation order

1. **Phase 1** — SmartBar engine (useSmartBar, smartBarParser, SmartBar UI states).
2. **Phase 2** — Batch creation from SmartBar (credits check, createJob, trackedJobs, open panel).
3. **Phase 3** — FloatingProcessingPanel real data (poll, multi-batch, cancel, ZIP).
4. **Phase 4** — Settings/Files/History/Batch details (batchesAPI, filesAPI, modals).
5. **Phase 5** — Supported Sites (providerCatalog, search, filters).
6. **Phase 6** — Developer panel (apiKeysAPI, plan check, webhook TODO).
7. **Phase 7** — Clipboard, drag/drop, dedupe, invalid URL handling.
8. **Phase 8** — Animations, 401 handling, error toasts.
