# Railway Refactor Summary - BatchTube

## ✅ Completed Refactoring

### 1. Backend Structure (Railway Ready)

**Location:** `/backend`

**Entry Point:**
- Source: `backend/src/server.ts`
- Compiled: `backend/dist/server.js` (after `npm run build`)
- Start Command: `node dist/server.js`

**Package.json:**
- ✅ `main`: `dist/server.js`
- ✅ `scripts.build`: `tsc`
- ✅ `scripts.start`: `node dist/server.js`
- ✅ `scripts.postinstall`: `tsc` (auto-compile on Railway)
- ✅ TypeScript in `dependencies` (needed for production build)

**Server Configuration:**
- ✅ Listens on `0.0.0.0:${PORT}` (Railway compatible)
- ✅ PORT from `process.env.PORT || 3000`
- ✅ CORS allows: batchtube.net, www.batchtube.net, localhost:5173, localhost:3000

**File Paths:**
- ✅ All use `process.cwd()` for cookies
- ✅ All use `os.tmpdir()` for temp files
- ✅ No hardcoded localhost paths

### 2. Frontend Structure (Vercel Ready)

**Location:** `/frontend`

**API Configuration:**
- ✅ `frontend/src/config/api.ts` centralizes API base URL
- ✅ Production: `https://api.batchtube.net`
- ✅ Development: `http://localhost:3000`
- ✅ Uses `import.meta.env.VITE_API_BASE_URL` for override

**All API Calls:**
- ✅ Use `${API_BASE_URL}/api/search`
- ✅ Use `${API_BASE_URL}/api/batch-download`
- ✅ Use `${API_BASE_URL}/api/batch-progress/:jobId`
- ✅ Use `${API_BASE_URL}/api/download-file/:jobId`
- ✅ No hardcoded URLs

### 3. API Endpoints (Backend)

**Search:**
- `GET /api/search?q=<query>`
- `POST /api/search` (body: `{ query }`)

**Batch Download:**
- `POST /api/batch-download` (body: `{ items: [...] }`)
- Returns: `{ jobId }`

**Progress:**
- `GET /api/batch-progress/:jobId`
- Returns: `{ jobId, status, totalItems, completedItems, overallPercent, items, downloadUrl }`

**Download:**
- `GET /api/download-file/:jobId`
- Streams ZIP file

**Health:**
- `GET /health`
- Returns: `{ status: "ok" }`

**Internal (Cookie Management):**
- `GET /internal/refresh-cookies`
- `GET /internal/cookies-status`

### 4. Import Paths (All Fixed)

**Backend Imports:**
- ✅ All use relative paths from `backend/src/`
- ✅ Example: `import { jobStore } from '../core/jobStore.js'`
- ✅ No broken paths

**Frontend Imports:**
- ✅ All use relative paths from `frontend/src/`
- ✅ API config imported: `import { API_BASE_URL } from '../config/api'`

### 5. Railway Configuration

**Files Created:**
- ✅ `backend/nixpacks.toml` - Nixpacks build config
- ✅ `backend/Procfile` - Process file (`web: npm start`)
- ✅ `backend/railway.json` - Railway config
- ✅ `railway.toml` - Root Railway config (forces Nixpacks)
- ✅ `.railwayignore` - Ignores Docker files

**Railway Settings Required:**
- Root Directory: `backend`
- Builder: `Nixpacks` (not Docker)
- Environment Variables:
  - `PORT=3000` (auto-set by Railway)
  - `NODE_ENV=production`
  - `CLIENT_ORIGIN=https://www.batchtube.net`

### 6. Features Preserved

✅ All existing features work:
- Instant search (HTML scraping)
- Single MP3/MP4 download
- Batch parallel download
- Progress tracking
- ZIP creation
- Multi-language UI (TR, EN, ES, FR, DE, PT, AR)
- Cookie consent system
- Auto-cookie refresh
- Legal pages
- "Listeyi Gör" modal
- Safari/iPhone download support

### 7. Cleanup

**No Legacy Files:**
- ✅ No `server.js` in root
- ✅ No `index.js` in root
- ✅ All backend code in `/backend`
- ✅ All frontend code in `/frontend`

## 🚀 Deployment Instructions

### Backend (Railway)

1. **Set Root Directory:**
   - Railway Dashboard → Settings → Root Directory = `backend`

2. **Set Builder:**
   - Railway Dashboard → Settings → Builder = `Nixpacks`

3. **Environment Variables:**
   ```
   NODE_ENV=production
   CLIENT_ORIGIN=https://www.batchtube.net
   ```

4. **Deploy:**
   - Railway will run: `npm install` → `npm run build` → `npm start`

### Frontend (Vercel)

1. **Environment Variable:**
   ```
   VITE_API_BASE_URL=https://api.batchtube.net
   ```

2. **Deploy:**
   - Vercel will run: `npm install` → `npm run build`
   - Output: `dist/` directory

## ✅ Verification Checklist

### Backend Local Test:
```bash
cd backend
npm install
npm run build
npm start
# Should see: [Server] Backend running on port 3000
```

### Frontend Local Test:
```bash
cd frontend
npm install
npm run dev
# Should connect to http://localhost:3000
```

### Production Test:
```bash
# Backend health
curl https://api.batchtube.net/health
# Should return: {"status":"ok"}

# Frontend loads
curl https://www.batchtube.net
# Should return HTML
```

## 📁 Final Structure

```
batchtube/
├── backend/              # Railway service root
│   ├── src/
│   │   ├── server.ts     # Entry point
│   │   ├── core/         # Core logic
│   │   ├── routes/       # API routes
│   │   ├── jobs/         # Background jobs
│   │   └── utils/        # Utilities
│   ├── package.json      # Backend dependencies
│   ├── tsconfig.json     # TypeScript config
│   ├── nixpacks.toml     # Nixpacks config
│   └── Procfile          # Process file
│
├── frontend/             # Vercel service root
│   ├── src/
│   │   ├── config/
│   │   │   └── api.ts    # API base URL
│   │   ├── components/   # React components
│   │   ├── services/     # API service
│   │   └── ...
│   ├── package.json      # Frontend dependencies
│   └── vercel.json       # Vercel config
│
└── README.md
```

## 🎯 Status

**✅ REFACTORING COMPLETE**

- Backend: Railway ready
- Frontend: Vercel ready
- All imports: Fixed
- All paths: Correct
- All features: Preserved
- No breaking changes

Ready for production deployment!

