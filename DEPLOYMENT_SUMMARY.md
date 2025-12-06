# BatchTube - Railway Deployment Summary

## ✅ Completed Changes

### Backend (Railway-Ready)

1. **CORS Configuration** ✅
   - Configured to allow:
     - `https://batchtube.net`
     - `https://www.batchtube.net`
     - `http://localhost:5173` (dev)
     - `http://localhost:3000` (dev)
   - Handles preflight OPTIONS requests
   - Allows requests with no origin (for non-browser tools)

2. **Temp Directory** ✅
   - Changed from `path.resolve('temp_downloads')` to `os.tmpdir()`
   - Now uses: `path.join(os.tmpdir(), 'batchtube-downloads')`
   - Railway-compatible (uses system temp directory)

3. **Package.json Scripts** ✅
   - `"start": "node dist/server.js"` - Production start (Railway)
   - `"build": "tsc"` - Compile TypeScript
   - `"dev": "nodemon --watch src --exec ts-node src/server.ts"` - Local dev

4. **Logging** ✅
   - Added consistent prefixes: `[Search]`, `[Single]`, `[Batch]`, `[Download]`, `[ZIP]`, `[Parser]`, `[Server]`
   - Better error tracking

5. **File Download** ✅
   - Proper headers for Safari/Chrome compatibility
   - Automatic cleanup after download (60s delay)
   - Error handling improved

6. **Parser Robustness** ✅
   - Multiple regex patterns for `ytInitialData` extraction
   - Better error handling

### Frontend (Real API Integration)

1. **API Configuration** ✅
   - Created `config/api.ts`:
     - Dev: Uses Vite proxy (`/api`)
     - Prod: Uses `VITE_API_URL` env var or `https://api.batchtube.net/api`
   - Updated `constants.ts` to import from config

2. **Removed Mocks** ✅
   - Deleted `services/mockYoutubeService.ts`
   - Deleted `services/geminiService.ts`
   - All API calls now use real backend

3. **API Service** ✅
   - `services/apiService.ts` already uses `API_BASE_URL` from constants
   - All endpoints properly wired:
     - `POST /api/search`
     - `POST /api/single-download`
     - `POST /api/batch-download`
     - `GET /api/job-progress/:jobId`
     - `GET /api/download-file/:jobId`

## 📋 Backend Endpoints

All endpoints are under `/api` prefix:

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search` | Search YouTube (keywords or URL) |
| POST | `/api/single-download` | Start single video download |
| POST | `/api/batch-download` | Start batch download |
| GET | `/api/job-progress/:jobId` | Get download progress |
| GET | `/api/download-file/:jobId` | Download completed file |

### Request/Response Examples

**Search:**
```json
POST /api/search
Body: { "query": "test video" }
Response: [{ id, title, thumbnail, duration, channel, views, description }]
```

**Single Download:**
```json
POST /api/single-download
Body: { "videoId": "abc123", "format": "mp3", "title": "Video Title" }
Response: { "jobId": "uuid" }
```

**Batch Download:**
```json
POST /api/batch-download
Body: { "items": [{ videoId, format, title }, ...] }
Response: { "jobId": "uuid" }
```

**Progress:**
```json
GET /api/job-progress/:jobId
Response: {
  id, status, progress, resultReady,
  items: [{ videoId, format, status, progress, title }]
}
```

## 🔧 Environment Variables

### Backend (Railway)

- `PORT` - Automatically set by Railway (default: 3001)
- `NODE_ENV` - Set to `production` in Railway

### Frontend (Netlify/Vercel/etc.)

- `VITE_API_URL` - Set to `https://api.batchtube.net/api` for production

## 🚀 Deployment Steps

### Backend (Railway)

1. Connect GitHub repo to Railway
2. Set root directory to `backend/`
3. Railway will auto-detect:
   - Build: `npm install && npm run build`
   - Start: `npm start`
4. **Important**: Install `yt-dlp` in Railway container (see `RAILWAY_DEPLOYMENT.md`)
5. Add custom domain: `api.batchtube.net`

### Frontend

1. Deploy to Netlify/Vercel/etc.
2. Set environment variable: `VITE_API_URL=https://api.batchtube.net/api`
3. Build command: `npm run build`
4. Publish directory: `dist`

## ✅ Testing Checklist

- [ ] Backend starts on Railway
- [ ] `yt-dlp` is installed and accessible
- [ ] Search endpoint returns results
- [ ] Single download works
- [ ] Batch download works
- [ ] Progress polling works
- [ ] File download works (Safari + Chrome)
- [ ] CORS allows frontend domain
- [ ] Frontend connects to production API
- [ ] No console errors in browser

## 🔍 Key Architecture Decisions

1. **No YouTube Data API**: Uses keyless HTML scraping (`ytInitialData`)
2. **Parallel Downloads**: Batch downloads use concurrency limit (3 items)
3. **Temp Files**: Uses OS temp directory (Railway-compatible)
4. **Job Management**: In-memory job store with 1-hour cleanup
5. **File Cleanup**: Automatic cleanup after download (60s delay)

## 📝 Notes

- Backend uses TypeScript compiled to JavaScript for production
- Frontend uses Vite for building
- All mocks removed - 100% real backend integration
- CORS configured for production domains
- Logging improved for debugging

## 🐛 Known Issues / Future Improvements

1. **yt-dlp Installation**: Needs to be installed in Railway container (see deployment guide)
2. **Job Persistence**: Currently in-memory (lost on restart) - could add Redis/DB
3. **Rate Limiting**: Not implemented - consider adding for production
4. **Error Recovery**: Basic error handling - could be more robust

