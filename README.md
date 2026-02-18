# BatchTube - Premium Media Downloader

BatchTube is a high-performance, full-stack media downloader application featuring a dark premium UI, parallel batch processing, and privacy-focused architecture.

## 🚀 Features

- **Fast Search**: Uses HTML scraping and oEmbed (No YouTube Data API quota limits).
- **Parallel Batch Engine**: Downloads up to 3 videos concurrently and zips them automatically.
- **Privacy First**: No logs stored permanently. Auto-cleanup of files after 1 hour.
- **Global Ready**: Fully localized in TR, EN, ES, DE, FR, PT, AR.
- **Premium UI**: TailwindCSS driven dark mode with smooth animations.

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, TypeScript (ESM)
- **Core Tools**: `yt-dlp` (Media extraction), `archiver` (ZIP generation)

## 📦 Installation

### Prerequisites
1. **Node.js** (v18+)
2. **Python 3** (Required for yt-dlp)
3. **yt-dlp**: Must be installed and available in system PATH.
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
```

## Admin Panel + API v1 (Current)

This repository now also includes:
- `api/` Fastify + Prisma + BullMQ + MinIO backend (`/v1/*` + `/admin-api/*`)
- `admin/` internal owner dashboard frontend

Run everything with Docker:

```bash
docker compose up --build
```

Run manually:

```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

```bash
cd admin
npm install
npm run dev
```

## ⚖️ Legal

This project is for educational purposes only. Users must comply with YouTube's Terms of Service. BatchTube is not affiliated with Google LLC.

## 📄 ads.txt (AdSense)

BatchTube serves `ads.txt` from the frontend public directory:

- File: `frontend/public/ads.txt`
- Production URL (example): `https://batchtube.net/ads.txt`

To enable AdSense, replace the placeholder line in `frontend/public/ads.txt` with the exact line provided in your AdSense dashboard (Publisher ID `pub-...`).
