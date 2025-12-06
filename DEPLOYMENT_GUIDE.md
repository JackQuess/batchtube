# BatchTube Production Deployment Guide

Complete step-by-step guide for deploying BatchTube to Vercel (Frontend) and Railway (Backend).

---

## 📋 Prerequisites

- GitHub account
- Vercel account (free tier works)
- Railway account (free tier works)
- Domain name (optional): `batchtube.net` and `www.batchtube.net`
- Git installed locally

---

## 🚀 PART 1: Backend Deployment (Railway)

### Step 1: Prepare Backend Repository

1. **Push backend to GitHub:**
   ```bash
   cd backend
   git init
   git add .
   git commit -m "feat: BatchTube backend production ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/batchtube-backend.git
   git push -u origin main
   ```

### Step 2: Deploy to Railway

1. **Go to [Railway.app](https://railway.app)**
2. **Click "New Project"**
3. **Select "Deploy from GitHub repo"**
4. **Choose your `batchtube-backend` repository**
5. **Railway will auto-detect Node.js**

### Step 3: Configure Railway Environment Variables

In Railway dashboard → Your Project → Variables tab, add:

```
PORT=3000
NODE_ENV=production
CLIENT_ORIGIN=https://www.batchtube.net
```

### Step 4: Configure Railway Settings

1. **Build Command:** `npm install`
2. **Start Command:** `npm start`
3. **Root Directory:** `/` (default)

### Step 5: Verify yt-dlp Installation

Railway comes with `yt-dlp` preinstalled. Verify in Railway logs:

```bash
# In Railway dashboard → Deployments → View Logs
# You should see yt-dlp available
```

Or add a test endpoint temporarily:

```javascript
// In server.ts (remove after testing)
app.get('/test-ytdlp', async (req, res) => {
  const { exec } = require('child_process');
  exec('yt-dlp --version', (error, stdout) => {
    res.json({ version: stdout.trim(), error: error?.message });
  });
});
```

### Step 6: Get Railway Domain

1. Railway will assign a domain like: `your-app.up.railway.app`
2. **Note this URL** - you'll use it for `VITE_API_BASE_URL`
3. **Or configure custom domain:** `api.batchtube.net`

### Step 7: Configure Custom Domain (Optional)

1. In Railway → Settings → Domains
2. Add custom domain: `api.batchtube.net`
3. Add DNS records in your domain provider:
   ```
   Type: CNAME
   Name: api
   Value: your-app.up.railway.app
   ```

### Step 8: Verify Backend Health

```bash
curl https://api.batchtube.net/health
# Should return: {"status":"ok"}
```

---

## 🎨 PART 2: Frontend Deployment (Vercel)

### Step 1: Prepare Frontend Repository

1. **Push frontend to GitHub:**
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "feat: BatchTube frontend production ready"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/batchtube-frontend.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. **Go to [Vercel.com](https://vercel.com)**
2. **Click "Add New Project"**
3. **Import your `batchtube-frontend` repository**
4. **Vercel will auto-detect Vite**

### Step 3: Configure Vercel Environment Variables

In Vercel dashboard → Your Project → Settings → Environment Variables:

```
VITE_API_BASE_URL=https://api.batchtube.net
```

**Important:** Set this for **Production**, **Preview**, and **Development** environments.

### Step 4: Configure Vercel Build Settings

Vercel should auto-detect from `vercel.json`, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Vercel will assign a domain: `your-app.vercel.app`

### Step 6: Configure Custom Domain (Optional)

1. In Vercel → Your Project → Settings → Domains
2. Add domains:
   - `batchtube.net`
   - `www.batchtube.net`
3. Add DNS records in your domain provider:
   ```
   Type: A
   Name: @
   Value: 76.76.21.21 (Vercel IP - check Vercel docs for latest)
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

---

## ✅ PART 3: Verification & Testing

### 1. Verify API Endpoints

```bash
# Health check
curl https://api.batchtube.net/health

# Search endpoint
curl "https://api.batchtube.net/api/search?q=test"

# Should return JSON array
```

### 2. Test Frontend → Backend Connection

1. Open `https://www.batchtube.net`
2. Open browser DevTools → Network tab
3. Search for a video
4. Verify API calls go to `https://api.batchtube.net/api/search`
5. Check for CORS errors (should be none)

### 3. Test Downloads

1. Select 2-3 videos
2. Click "Download ZIP"
3. Verify:
   - Progress modal appears
   - Downloads complete
   - ZIP file downloads successfully
   - File is valid (can open in macOS/Windows)

### 4. Verify HTTPS + HSTS

```bash
# Check HTTPS
curl -I https://www.batchtube.net
# Should see: HTTP/2 200

# Check HSTS (if configured)
curl -I https://www.batchtube.net | grep -i strict-transport
```

### 5. Test yt-dlp in Production

```bash
# SSH into Railway container (if available)
# Or check logs for yt-dlp commands
```

---

## 🔧 PART 4: Troubleshooting

### CORS Issues

**Symptom:** Browser console shows CORS errors

**Fix:**
1. Verify backend CORS allows `*` origin
2. Check Railway environment variables
3. Verify frontend uses `credentials: 'omit'` in fetch calls

### API Not Responding

**Symptom:** Frontend can't reach backend

**Fix:**
1. Check Railway deployment status
2. Verify `VITE_API_BASE_URL` in Vercel environment variables
3. Test backend directly: `curl https://api.batchtube.net/health`

### Downloads Fail

**Symptom:** "Download failed" errors

**Fix:**
1. Check Railway logs for yt-dlp errors
2. Verify cookies.txt exists in Railway
3. Check `/tmp` directory permissions
4. Verify yt-dlp is installed: `yt-dlp --version`

### Slow Progress Updates

**Symptom:** Progress bar updates slowly

**Fix:**
1. Verify polling interval is 1 second
2. Check Railway response times
3. Ensure batch-progress endpoint responds in <50ms

### Stale Containers

**Symptom:** Old downloads not cleaned up

**Fix:**
1. Verify cleanup interval runs every hour
2. Check maxAge is 10 minutes (600000ms)
3. Manually trigger cleanup if needed

---

## 📊 PART 5: Monitoring

### Railway Monitoring

1. **Logs:** Railway dashboard → Deployments → View Logs
2. **Metrics:** Railway dashboard → Metrics tab
3. **Alerts:** Set up Railway alerts for deployment failures

### Vercel Monitoring

1. **Analytics:** Vercel dashboard → Analytics tab
2. **Logs:** Vercel dashboard → Deployments → View Logs
3. **Performance:** Vercel dashboard → Speed Insights

### Health Checks

Set up external monitoring:

```bash
# Uptime monitoring service (e.g., UptimeRobot)
# Monitor: https://api.batchtube.net/health
# Expected: {"status":"ok"}
```

---

## 🔐 PART 6: Security Checklist

- [ ] HTTPS enabled on both frontend and backend
- [ ] CORS configured correctly (no credentials)
- [ ] Environment variables set (not hardcoded)
- [ ] No sensitive data in logs
- [ ] Rate limiting considered (future enhancement)
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info

---

## 🚀 PART 7: Post-Deployment

### 1. Purge Stale Railway Containers

Railway auto-scales, but you can manually restart:

1. Railway dashboard → Your Project → Settings
2. Click "Restart" if needed

### 2. Verify Custom Domains

```bash
# Test both domains
curl https://batchtube.net
curl https://www.batchtube.net
curl https://api.batchtube.net/health
```

### 3. Test Full Workflow

1. Search videos
2. Select multiple videos
3. Start batch download
4. Monitor progress
5. Download ZIP
6. Verify ZIP opens correctly

### 4. Monitor First 24 Hours

- Check Railway logs for errors
- Monitor Vercel analytics
- Verify downloads complete successfully
- Check cleanup jobs run correctly

---

## 📝 Final Checklist

### Backend (Railway)
- [ ] Repository pushed to GitHub
- [ ] Railway project created
- [ ] Environment variables set
- [ ] Custom domain configured (api.batchtube.net)
- [ ] Health endpoint responds
- [ ] yt-dlp verified working
- [ ] Downloads complete successfully
- [ ] Cleanup jobs running

### Frontend (Vercel)
- [ ] Repository pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set (VITE_API_BASE_URL)
- [ ] Custom domain configured (batchtube.net, www.batchtube.net)
- [ ] Build completes successfully
- [ ] Frontend connects to backend
- [ ] No CORS errors
- [ ] Downloads work end-to-end

### Testing
- [ ] Search works
- [ ] Batch download works
- [ ] Progress updates correctly
- [ ] ZIP downloads successfully
- [ ] Multi-language UI works
- [ ] Mobile/Safari downloads work
- [ ] Cookie consent system works

---

## 🎉 Success!

Your BatchTube is now live in production!

- **Frontend:** https://www.batchtube.net
- **Backend:** https://api.batchtube.net
- **Health Check:** https://api.batchtube.net/health

---

## 📞 Support

If you encounter issues:

1. Check Railway logs
2. Check Vercel logs
3. Verify environment variables
4. Test endpoints directly with curl
5. Check browser console for errors

---

**Last Updated:** 2024
**Version:** BatchTube v2.0 Production

