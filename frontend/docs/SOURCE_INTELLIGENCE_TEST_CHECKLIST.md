# Source Intelligence — Manual Test Checklist

Use this list to verify the SmartBar source detection and flows.

## 1. Single video link
- [ ] Paste a YouTube video URL (e.g. `https://www.youtube.com/watch?v=...`) → **single_video** preview with provider icon, hostname, 1 credit, Download / Add to batch.
- [ ] Paste a youtu.be short link → **single_video**.
- [ ] Paste a TikTok video URL → **single_video**.
- [ ] Click **Download** → batch is created and processing panel appears.
- [ ] Click **Add to batch** → same as Download (one-item batch).

## 2. Multiple links
- [ ] Paste 5–10 mixed URLs (YouTube, TikTok, etc.) separated by newlines or commas → **multiple_links** preview.
- [ ] Check: total count, valid/invalid, duplicate removed, provider chips, estimated credits.
- [ ] **Download all** / **Create batch** → batch created with unique URLs only.

## 3. Duplicate and invalid
- [ ] Paste the same URL 3 times → preview shows 1 link, 2 duplicates removed.
- [ ] Paste 2 valid URLs + 1 invalid line (e.g. `not a url`) → 2 valid, 1 invalid; invalid listed in panel.
- [ ] **Create batch** → only valid unique URLs are used.

## 4. Channel URL
- [ ] Paste `https://youtube.com/@channelname` or `https://youtube.com/channel/UC...` → **channel** preview.
- [ ] Check: Source card, “Latest 10 / 25 / 50” quick choices, **Download all**, **Select manually**.
- [ ] Click **Latest 25** → batch created (with source URL only until backend supports item listing).
- [ ] Click **Select manually** → Source selection modal opens (empty state if no backend).

## 5. Playlist URL
- [ ] Paste `https://youtube.com/playlist?list=...` → **playlist** preview.
- [ ] Same actions as channel: Latest N, Download all, Select manually.

## 6. Profile URL
- [ ] Paste `https://tiktok.com/@username` (no /video/) → **profile** preview.
- [ ] Paste Instagram profile URL → **profile** preview.

## 7. Command mode
- [ ] Type `archive youtube.com/@x` → **command** preview with suggestion(s).
- [ ] Type `download https://youtube.com/watch?v=...` → command with “Download” suggestion; confirm → batch with that URL.
- [ ] Type `history` or `files` → suggestions open History / Files modal.
- [ ] Type `latest 20 from youtube.com/@channel` → command preview “Download latest 20”; confirm → batch (URLs if backend supports, else single source URL).

## 8. Unsupported / invalid
- [ ] Paste random text (no URL) → **unsupported** with error message.
- [ ] Paste unsupported domain → unsupported or generic single_video depending on rules.

## 9. UX
- [ ] Preview expands/collapses smoothly.
- [ ] Provider chips and source type badges (Channel / Playlist / Profile) visible.
- [ ] Clear inline messages for unsupported source, invalid links, insufficient credits (when applicable).
- [ ] Source selection modal: loading skeletons or empty state, select all / clear all, search when many items (when backend returns data).

## 10. Backend integration
- [ ] Single and multi batches create via existing `POST /v1/batches`.
- [ ] When backend adds source preview/items endpoints, set `BACKEND_HAS_SOURCE_ENDPOINTS = true` in `sourceItemsAdapter.ts` and verify “Select manually” and “Latest N” use real data.

## Future (agent mode)
- [ ] “Add as agent” button is present as placeholder; no implementation required until backend supports it.
