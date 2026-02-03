# BatchTube - Premium Media Downloader

BatchTube is a high-performance, full-stack media downloader application featuring a dark premium UI, parallel batch processing, and privacy-focused architecture.

## 🚀 Features

- **Fast Search**: Uses HTML scraping and oEmbed (No YouTube Data API quota limits).
- **Parallel Batch Engine**: Downloads up to 3 videos concurrently and zips them automatically.
- **Privacy First**: No logs stored permanently. Auto-cleanup of files after 1 hour.
- **Global Ready**: Fully localized in TR, EN, ES, DE, FR, PT, AR.
- **Premium UI**: TailwindCSS driven dark mode with smooth animations.

## 🛠 Tech Stack

<<<<<<< HEAD
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript (ESM)
- **Core Tools**: `yt-dlp` (Media extraction), `archiver` (ZIP generation)

## 📦 Installation
=======
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript (ESM)
- **Core Tools**: `yt-dlp` (Media extraction), `archiver` (ZIP generation)

## 📦 Project Structure

```
/
├── backend/          # Backend API server
│   ├── server.ts     # Main server file
│   ├── src/          # Source code
│   │   ├── core/     # Core business logic
│   │   ├── services/ # API services
│   │   └── utils/    # Utility functions
│   └── package.json
│
├── frontend/         # Frontend React app
│   ├── src/          # Source code
│   ├── components/   # React components
│   ├── hooks/        # React hooks
│   ├── public/        # Static assets
│   └── package.json
│
└── README.md
```

## 🔧 Local Development
>>>>>>> 69f9136 (Initial commit)

### Prerequisites
1. **Node.js** (v18+)
2. **Python 3** (Required for yt-dlp)
3. **yt-dlp**: Must be installed and available in system PATH.
<<<<<<< HEAD
   ```bash
   # Linux/macOS
   sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
   sudo chmod a+rx /usr/local/bin/yt-dlp

   # Windows
   winget install yt-dlp
   ```

### Setup Backend
```bash
cd backend
npm install
npm run build
npm start
# Server runs on http://localhost:3001
```

### Setup Frontend
```bash
# Root directory
npm install
npm run dev
# App runs on http://localhost:5173
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|:---|:---|:---|
| `POST` | `/api/search` | Search videos or resolve URLs |
| `POST` | `/api/single-download` | Start single file download |
| `POST` | `/api/batch-download` | Start parallel batch job |
| `GET` | `/api/job-progress/:id` | Poll job status |
| `GET` | `/api/download-file/:id` | Stream final file/zip |

## 🌍 Environment Variables

Create a `.env` file in `backend/` (Optional):
```env
PORT=3001
TEMP_DIR=./temp_downloads
MAX_CONCURRENT_JOBS=3
=======

### Setup Backend

```bash
cd backend
npm install
npm run build  # Compile TypeScript
npm start      # Production
# OR
npm run dev    # Development with auto-reload
```

Backend runs on `http://localhost:3001`

### Setup Frontend

```bash
cd frontend
npm install
npm run dev    # Development server
```

Frontend runs on `http://localhost:5173`

## 🚂 Railway Deployment

This project is configured for deployment on Railway with **two separate services**.

### Backend Service

1. **Create Service**: New service in Railway dashboard
2. **Root Directory**: Set to `backend/`
3. **Environment Variables**:
   ```env
   NODE_ENV=production
   PORT=3001  # Railway sets this automatically
   FRONTEND_URL=https://www.batchtube.net,http://localhost:3000,http://localhost:5173
   ```
4. **Build**: Railway will automatically build using `nixpacks.toml`
5. **Start**: `npm start` (runs compiled `server.js`)

### Frontend Service

1. **Create Service**: New service in Railway dashboard
2. **Root Directory**: Set to `frontend/`
3. **Environment Variables**:
```env
   VITE_API_URL=https://api.batchtube.net/api
   PORT=5173  # Railway sets this automatically
   ```
4. **Build**: Railway will build React app to `dist/`
5. **Start**: `npm start` (serves static files from `dist/`)

### API Endpoints

All backend routes are prefixed with `/api`:

- `GET /api/search?q=...` - Search videos
- `POST /api/single` - Start single download
- `POST /api/batch` - Start batch download
- `GET /api/progress/:jobId` - Get job progress
- `GET /api/download-file/:jobId` - Download completed file

### CORS Configuration

Backend accepts requests from:
- `https://www.batchtube.net`
- `http://localhost:3000`
- `http://localhost:5173`
- Any URLs specified in `FRONTEND_URL` environment variable

## 🔌 API Usage

### Frontend API Service

The frontend uses `VITE_API_URL` environment variable:

```typescript
// Development: uses Vite proxy (/api)
// Production: uses VITE_API_URL or defaults to https://api.batchtube.net/api

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://api.batchtube.net/api";
>>>>>>> 69f9136 (Initial commit)
```

## ⚖️ Legal

This project is for educational purposes only. Users must comply with YouTube's Terms of Service. BatchTube is not affiliated with Google LLC.
