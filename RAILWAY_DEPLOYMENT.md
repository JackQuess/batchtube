# Railway Deployment Guide

## Backend Deployment (Railway)

### Prerequisites

1. **yt-dlp Installation**: Railway needs `yt-dlp` installed in the container
2. **Node.js 18.x**: Railway will use the version specified in `package.json` or `nvmrc`

### Railway Setup Steps

1. **Create Railway Project**:
   - Connect your GitHub repo to Railway
   - Select the `backend` folder as the root directory

2. **Environment Variables** (set in Railway dashboard):
   - `PORT` - Railway will set this automatically, but you can override
   - `NODE_ENV=production`

3. **Build Command**:
   Railway will automatically detect and run:
   ```
   npm install
   npm run build
   ```

4. **Start Command**:
   Railway will use:
   ```
   npm start
   ```
   This runs `node dist/server.js` (compiled TypeScript)

5. **Install yt-dlp**:
   Add a `railway.json` or use a build script:
   
   Option A: Add to `package.json` scripts:
   ```json
   "postinstall": "curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /tmp/yt-dlp && chmod +x /tmp/yt-dlp && mv /tmp/yt-dlp /usr/local/bin/yt-dlp || echo 'yt-dlp install skipped'"
   ```
   
   Option B: Use Railway's Nixpacks and add a `nixpacks.toml`:
   ```toml
   [phases.setup]
   nixPkgs = ["yt-dlp"]
   ```

   Option C: Use a Dockerfile (recommended for Railway):
   ```dockerfile
   FROM node:18-alpine
   RUN apk add --no-cache python3 py3-pip ffmpeg
   RUN pip3 install yt-dlp
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   RUN npm run build
   CMD ["npm", "start"]
   ```

6. **Domain Setup**:
   - Railway will provide a default domain like `your-app.up.railway.app`
   - Add custom domain `api.batchtube.net` in Railway dashboard
   - Point DNS A record to Railway's IP

### Backend Endpoints

All endpoints are under `/api`:

- `POST /api/search` - Search YouTube videos
- `POST /api/single-download` - Start single download
- `POST /api/batch-download` - Start batch download
- `GET /api/job-progress/:jobId` - Get download progress
- `GET /api/download-file/:jobId` - Download completed file

### CORS Configuration

The backend is configured to allow:
- `https://batchtube.net`
- `https://www.batchtube.net`
- `http://localhost:5173` (dev)
- `http://localhost:3000` (dev)

## Frontend Deployment

### Environment Variables

Create a `.env.production` file or set in your hosting platform (Netlify/Vercel):

```env
VITE_API_URL=https://api.batchtube.net/api
```

### Build Command

```bash
npm run build
```

### Deploy to Netlify/Vercel

1. Connect your repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variable: `VITE_API_URL=https://api.batchtube.net/api`

## Testing Locally

### Backend
```bash
cd backend
npm install
npm run dev  # Uses ts-node for hot reload
```

### Frontend
```bash
npm install
npm run dev  # Vite dev server with proxy to localhost:3001
```

## Production Checklist

- [ ] Backend deployed to Railway
- [ ] `yt-dlp` installed in Railway container
- [ ] Custom domain `api.batchtube.net` configured
- [ ] CORS allows frontend domain
- [ ] Frontend deployed with `VITE_API_URL` env var
- [ ] Test search endpoint
- [ ] Test single download
- [ ] Test batch download
- [ ] Verify file downloads work in Safari/Chrome

## Troubleshooting

### Backend Issues

1. **yt-dlp not found**: Ensure it's installed in the build process
2. **Port binding**: Railway sets `PORT` automatically, don't hardcode
3. **Temp directory**: Using `os.tmpdir()` which works on Railway
4. **CORS errors**: Check allowed origins in `server.ts`

### Frontend Issues

1. **API calls failing**: Check `VITE_API_URL` is set correctly
2. **CORS errors**: Verify backend CORS allows your frontend domain
3. **Proxy not working**: In dev, Vite proxy should handle `/api` routes

