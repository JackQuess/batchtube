# Railway Deployment Setup Guide

## Problem
Railway cannot auto-detect the build configuration because this is a monorepo with both `frontend/` and `backend/` directories.

## Solution: Configure Root Directory

### Option 1: Set Root Directory in Railway Dashboard (Recommended)

1. **Go to Railway Dashboard** → Your Project → Settings
2. **Find "Root Directory"** setting
3. **Set Root Directory to:** `backend`
4. **Save**

Railway will now:
- Use `backend/package.json` for build detection
- Run `npm install` in the `backend/` directory
- Run `npm run build` (which runs `tsc`)
- Run `npm start` (which runs `node dist/server.js`)

### Option 2: Use Railway Configuration Files

I've created configuration files that Railway can use:

- `railway.json` (root) - Points to backend directory
- `backend/railway.json` - Backend-specific config
- `backend/nixpacks.toml` - Nixpacks build configuration

### Option 3: Deploy Backend as Separate Repository

If the above doesn't work, create a separate GitHub repository for the backend:

```bash
cd backend
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/batchtube-backend.git
git push -u origin main
```

Then deploy that repository to Railway.

---

## Railway Settings Checklist

After setting Root Directory to `backend`, verify:

1. **Build Command:** `npm install && npm run build`
   - This will install dependencies and compile TypeScript

2. **Start Command:** `npm start`
   - This runs `node dist/server.js`

3. **Environment Variables:**
   ```
   PORT=3000
   NODE_ENV=production
   CLIENT_ORIGIN=https://www.batchtube.net
   ```

4. **Node Version:** Railway will auto-detect Node.js 20 (from nixpacks.toml)

---

## Verification

After deployment, check:

1. **Build Logs:** Should show TypeScript compilation
2. **Start Logs:** Should show "Backend running on port 3000"
3. **Health Check:** `curl https://your-app.up.railway.app/health`

---

## Troubleshooting

### "Script start.sh not found"
- **Fix:** Set Root Directory to `backend` in Railway settings

### "Cannot find module"
- **Fix:** Ensure `postinstall` script runs `tsc` (already in package.json)

### "TypeScript not found"
- **Fix:** TypeScript is now in `dependencies` (not devDependencies)

### Build fails
- **Fix:** Check Railway logs for specific errors
- Verify `tsconfig.json` is correct
- Ensure all dependencies are in `package.json`

---

## Quick Fix Command

If you want to test locally first:

```bash
cd backend
npm install
npm run build
npm start
```

This should work exactly as Railway will run it.

