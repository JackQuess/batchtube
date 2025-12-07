# BatchTube 2.0 - Railway Deployment Guide

## 🚀 Quick Setup

### 1. Backend Service

**Settings:**
- **Root Directory:** `backend` (leave empty, Dockerfile handles it)
- **Build Command:** (auto from Dockerfile)
- **Start Command:** (default: `node backend/src/server.js`)
- **Port:** 3000

**Environment Variables:**
```
REDIS_URL=redis://:password@host:port
ALLOWED_ORIGIN=https://batchtube.net,https://www.batchtube.net
NODE_ENV=production
PORT=3000
```

### 2. Worker Service

**Settings:**
- **Root Directory:** (same as backend)
- **Build Command:** (auto from Dockerfile)
- **Start Command:** `node backend/src/worker.js` ⚠️ **OVERRIDE THIS**
- **Port:** (not needed, worker doesn't listen)

**Environment Variables:**
```
REDIS_URL=redis://:password@host:port
NODE_ENV=production
```

### 3. Redis Service

**Settings:**
- Add Redis service from Railway marketplace
- Copy `REDIS_URL` from service variables
- Use same `REDIS_URL` in both backend and worker

## 📁 Project Structure

```
/
  Dockerfile              # Single Dockerfile for both services
  .dockerignore
  backend/
    package.json
    src/
      server.js          # API server
      worker.js          # Background worker
      queue.js           # BullMQ queue
      routes/
        batch.js         # Batch API routes
      utils/
        redis.js         # Redis connection
        ytService.js     # yt-dlp wrapper
        zip.js           # ZIP creation
        helpers.js       # Utilities
```

## 🔧 Dockerfile Details

- Installs: python3, ffmpeg, curl
- Downloads: yt-dlp from GitHub
- Installs: backend dependencies only
- Exposes: port 3000
- Default CMD: `node backend/src/server.js`

## ⚙️ Service Configuration

### Backend Service
- Uses Dockerfile
- Start Command: (default, don't override)
- Needs: `REDIS_URL`, `ALLOWED_ORIGIN`

### Worker Service  
- Uses same Dockerfile
- Start Command: `node backend/src/worker.js` ⚠️ **MUST OVERRIDE**
- Needs: `REDIS_URL`

## ✅ Verification

1. Backend health: `GET https://your-api.railway.app/health`
2. Worker logs: Check Railway worker service logs for `[Worker] Batch download worker started`
3. Test batch: Create a job and verify it processes

## 🐛 Troubleshooting

**Worker not processing:**
- Check `REDIS_URL` is set correctly
- Verify worker service Start Command is `node backend/src/worker.js`
- Check Redis connection in logs

**Jobs stuck:**
- Verify Redis service is running
- Check worker is connected to same Redis
- Review worker logs for errors

