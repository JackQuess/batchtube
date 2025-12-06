# Railway Build Fix - Docker vs Nixpacks

## Problem
Railway is trying to use Docker instead of Nixpacks, causing "npm: command not found" error.

## Solution

### Step 1: Set Root Directory in Railway Dashboard

1. Go to **Railway Dashboard** → Your Project → **Settings**
2. Find **"Root Directory"** setting
3. Set to: `backend`
4. **Save**

### Step 2: Force Nixpacks Builder

1. In Railway Dashboard → Your Project → **Settings**
2. Find **"Build Command"** (or Builder settings)
3. Ensure it's set to **"Nixpacks"** (not Docker)
4. If you see Docker option, disable it

### Step 3: Verify Configuration Files

The following files are now in place:

- `backend/nixpacks.toml` - Tells Railway to use Node.js 20 and yt-dlp
- `backend/Procfile` - Tells Railway how to start the app
- `backend/package.json` - Has `postinstall` script that runs `tsc`

### Step 4: Railway Settings

In Railway Dashboard → Settings, verify:

- **Root Directory:** `backend`
- **Build Command:** (leave empty, Nixpacks will auto-detect)
- **Start Command:** (leave empty, uses Procfile or package.json scripts)

### Step 5: Redeploy

1. Go to **Deployments** tab
2. Click **"Redeploy"** or trigger a new deployment
3. Watch the build logs - should see:
   ```
   Installing Node.js 20...
   Running npm install...
   Running npm run build...
   Starting with: npm start
   ```

## Alternative: If Nixpacks Still Doesn't Work

If Railway still tries to use Docker:

1. **Delete any Dockerfile** (if exists)
2. In Railway Settings → **Disable Docker**
3. **Enable Nixpacks** explicitly
4. Set **Root Directory** to `backend`

## Verification

After successful deployment, check logs:

```
[Server] Backend running on port 3000
[Server] Environment: production
```

Then test:
```bash
curl https://your-app.up.railway.app/health
# Should return: {"status":"ok"}
```

## Files Created

- ✅ `backend/nixpacks.toml` - Nixpacks configuration
- ✅ `backend/Procfile` - Process file for Railway
- ✅ `railway.json` - Railway config (simplified)
- ✅ `backend/railway.json` - Backend-specific config

All files are committed and pushed to GitHub.

