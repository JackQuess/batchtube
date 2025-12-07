# Local Development Setup

## Prerequisites

### 1. Redis (Required for Batch Downloads)

**Option A: Docker (Recommended)**
```bash
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Option B: Homebrew (macOS)**
```bash
brew install redis
brew services start redis
```

**Option C: Skip Redis (Search will work, batch downloads won't)**
- Server will start but queue features will be unavailable
- You'll see warnings: `[Redis] Connection refused`
- Search endpoint will work fine

## Running the Project

### Backend

```bash
cd backend
npm install
npm run dev
```

Server will start on port **3001** (changed from 3000 to avoid conflicts).

**Note:** If Redis is not running, you'll see warnings but the server will still start. Search will work, but batch downloads require Redis.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend will start on port **5173**.

## Environment Variables

### Backend (Optional for local dev)

Create `backend/.env`:
```env
PORT=3001
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```

### Frontend (Optional for local dev)

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

## Testing

1. **Search (works without Redis):**
   - Open http://localhost:5173
   - Search for videos
   - Should work immediately

2. **Batch Download (requires Redis):**
   - Start Redis first
   - Select videos
   - Click "Download ZIP"
   - Should process in background

## Troubleshooting

### Redis Connection Errors

If you see `ECONNREFUSED` errors:
- **Option 1:** Start Redis (see above)
- **Option 2:** Ignore them - search will still work
- **Option 3:** Set `REDIS_URL` if using remote Redis

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Vite Not Found

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

