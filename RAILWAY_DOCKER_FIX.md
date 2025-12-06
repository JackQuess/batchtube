# Railway Docker Detection Fix

## Problem
Railway is auto-detecting and trying to use Docker instead of Nixpacks, causing "npm: command not found" errors.

## Root Cause
Railway's auto-detection is finding something that makes it think Docker should be used, or there's a Dockerfile somewhere.

## Solution: Force Nixpacks

### Step 1: Railway Dashboard Settings

**CRITICAL:** You must configure this in Railway Dashboard:

1. Go to **Railway Dashboard** → Your Project
2. Click **Settings** tab
3. Scroll to **"Build & Deploy"** section
4. Find **"Builder"** or **"Build Pack"** setting
5. **Change from "Docker" to "Nixpacks"** (or "Auto" if Nixpacks is an option)
6. **Set Root Directory to:** `backend`
7. **Save**

### Step 2: Remove Docker Detection

I've created files to prevent Docker detection:

- `railway.toml` - Explicitly sets builder to Nixpacks
- `.railwayignore` - Ignores Docker files

### Step 3: Verify No Dockerfile Exists

Check if there's a Dockerfile in the repo:

```bash
find . -name "Dockerfile*" -o -name ".dockerignore"
```

If found, delete them (they're not needed for Nixpacks).

### Step 4: Redeploy

1. In Railway Dashboard → **Deployments**
2. Click **"Redeploy"** or trigger new deployment
3. Watch logs - should now show:
   ```
   Using Nixpacks builder...
   Installing Node.js 20...
   npm install...
   npm run build...
   ```

## Alternative: Manual Railway Configuration

If the dashboard settings don't work:

1. **Delete the Railway service** (if it exists)
2. **Create a new service**
3. **Connect to GitHub repo**
4. **Before deploying, go to Settings:**
   - Root Directory: `backend`
   - Builder: `Nixpacks` (explicitly select)
5. **Then deploy**

## Files Created

- ✅ `railway.toml` - Forces Nixpacks builder
- ✅ `.railwayignore` - Ignores Docker files
- ✅ `backend/nixpacks.toml` - Nixpacks configuration
- ✅ `backend/Procfile` - Process file

## Verification

After successful deployment, logs should show:

```
[Server] Backend running on port 3000
[Server] Environment: production
```

Test endpoint:
```bash
curl https://your-app.up.railway.app/health
```

## If Still Failing

If Railway still tries Docker after these changes:

1. **Check Railway Dashboard** → Settings → Builder = Must be "Nixpacks"
2. **Check Root Directory** = Must be "backend"
3. **Delete any Dockerfile** in the repository
4. **Create a new Railway service** from scratch
5. **Select Nixpacks explicitly** during setup

The key is: **Railway Dashboard Settings override any config files**. You MUST set Builder to Nixpacks in the dashboard.

