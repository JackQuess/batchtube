# BatchTube 2.0 - Migration Guide

## 🎯 Overview

BatchTube has been upgraded to version 2.0 with a complete redesign:
- **Queue-based architecture** using Redis + BullMQ
- **Background worker** for reliable batch processing
- **Modern premium UI** with smooth animations
- **Clean API design** with proper status tracking

## 📦 New Dependencies

### Backend
- `bullmq` - Queue management
- `ioredis` - Redis client

Install with:
```bash
cd backend
npm install
```

## 🔧 Configuration

### Environment Variables

#### Required for Production (Railway)
```env
REDIS_URL=redis://:password@host:port
PORT=3001
NODE_ENV=production
```

#### Optional (Local Development)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Railway Setup

1. **Add Redis Service**
   - Go to Railway dashboard
   - Add new service → Redis
   - Copy the `REDIS_URL` from the service

2. **Set Environment Variables**
   - In your backend service, add:
     - `REDIS_URL` (from Redis service)
     - `PORT=3001`
     - `NODE_ENV=production`

3. **Deploy**
   - The worker starts automatically with the server
   - Both run in the same process

## 🚀 New API Endpoints

### Batch Download (Queue-based)

**POST** `/api/batch`
```json
{
  "items": [
    {
      "url": "https://www.youtube.com/watch?v=...",
      "title": "Video Title"
    }
  ],
  "format": "mp3" | "mp4",
  "quality": "1080p" | "4k" (optional, for MP4)
}
```

**Response:**
```json
{
  "jobId": "batch-1234567890-abc123"
}
```

**GET** `/api/batch/:jobId/status`
```json
{
  "state": "waiting" | "active" | "completed" | "failed",
  "progress": 75,
  "result": {
    "total": 5,
    "succeeded": 4,
    "failed": 1,
    "results": [
      { "id": 0, "status": "success" },
      { "id": 1, "status": "failed", "error": "..." }
    ]
  }
}
```

**GET** `/api/batch/:jobId/download`
- Streams the ZIP file
- Auto-cleans up after download

## 📁 Project Structure

```
backend/
  src/
    queue.js          # BullMQ queue configuration
    worker.js         # Background worker process
    routes/
      batch.js       # New queue-based batch routes
      single.js      # Single download (legacy, still works)
    core/
      ytService.js   # yt-dlp wrapper
    server.js        # Main server (starts worker)

frontend/
  src/
    services/
      batchAPI.ts    # New batch API client
    components/
      ProgressModal.tsx  # New premium progress UI
      VideoCard.tsx      # Updated card component
      SelectionBar.tsx   # Updated selection bar
    App.tsx          # Updated to use new API
```

## 🔄 Migration Steps

### Backend
1. ✅ Install new dependencies (`bullmq`, `ioredis`)
2. ✅ Queue system is ready (`queue.js`)
3. ✅ Worker is ready (`worker.js`)
4. ✅ New routes are active (`routes/batch.js`)
5. ⚠️ **Add Redis service on Railway**

### Frontend
1. ✅ New `batchAPI` service created
2. ✅ New `ProgressModal` component
3. ✅ `App.tsx` updated to use new API
4. ✅ All components compatible

## 🧪 Testing

### Local Development

1. **Start Redis** (if not using Docker):
   ```bash
   redis-server
   ```

2. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test Batch Download**:
   - Search for videos
   - Select multiple videos
   - Click "Download ZIP"
   - Watch progress in modal
   - Download ZIP when complete

### Production (Railway)

1. Ensure Redis service is running
2. Set `REDIS_URL` environment variable
3. Deploy backend
4. Worker starts automatically
5. Test batch downloads

## 🐛 Troubleshooting

### "Redis connection failed"
- Check `REDIS_URL` is set correctly
- Verify Redis service is running on Railway
- Check network connectivity

### "Worker not processing jobs"
- Check server logs for worker startup message
- Verify `worker.js` is imported in `server.js`
- Check Redis connection

### "Jobs stuck in waiting"
- Check worker is running
- Verify queue connection
- Check job data format

## 📝 Notes

- **Legacy endpoints still work**: Old `/api/batch-download` endpoint is still available for compatibility
- **Single downloads unchanged**: Single download flow remains the same
- **Worker runs in same process**: No separate worker process needed
- **Auto-cleanup**: Temporary files are cleaned after download

## 🎨 UI Changes

- Modern dark theme (`#0e0e11` background)
- Smooth animations and transitions
- Premium card design with rounded corners
- Sticky bottom bar for batch actions
- Progress modal with per-item status
- Responsive design for mobile

## ✅ Checklist

- [x] Install dependencies
- [x] Create queue system
- [x] Create worker
- [x] Update routes
- [x] Create frontend API service
- [x] Create ProgressModal component
- [x] Update App.tsx
- [ ] Add Redis on Railway
- [ ] Test complete flow
- [ ] Deploy to production

