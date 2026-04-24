# Cookie Agent Deployment (Local + Hetzner)

## Local test

1. Put cookie files into `backend/runtime/cookies/`:
   - `youtube-main.txt`
   - `youtube-backup-1.txt`
   - `youtube-backup-2.txt`
2. Set environment variables in backend env:
   - `COOKIE_AGENT_ENABLED=true`
   - `COOKIE_DIR=./runtime/cookies`
   - `COOKIE_PROVIDER=youtube`
   - `COOKIE_ROTATION_MODE=health_based`
   - `COOKIE_MIN_VALID_SCORE=70`
   - `COOKIE_HEALTH_CHECK_INTERVAL_MS=300000`
   - `COOKIE_TEST_URL=https://www.youtube.com/watch?v=dQw4w9WgXcQ`
   - `YTDLP_COOKIE_MODE=file`
   - `ADMIN_TOKEN=change-me-local`
3. Run:
   - `npm run cookie:status`
   - `npm run cookie:health`

## Docker compose volume example

Use a read-only mount for cookie files:

```yaml
services:
  backend:
    volumes:
      - ./runtime/cookies:/app/runtime/cookies:ro
```

## Hetzner setup

1. Create runtime cookie directory on host:
   - `/opt/batchtube/backend/runtime/cookies`
2. Copy cookie files manually from your own permitted account export.
3. Mount host directory into container as read-only (`:ro`).
4. Set permissions:
   - owner: deployment user
   - mode: `750` for directory
   - mode: `640` for cookie files
5. Restart backend after cookie updates.

## Manual cookie refresh flow

1. Replace old cookie files with new exports in `runtime/cookies`.
2. Call:
   - `POST /api/admin/cookie-agent/reload`
   - `POST /api/admin/cookie-agent/health-check`
3. Verify:
   - `GET /api/admin/cookie-agent/status`

All admin endpoints require:
- `Authorization: Bearer <ADMIN_TOKEN>`

## Security notes

- Never commit cookie files to git.
- Never log cookie content, session tokens, SID, HSID, or similar values.
- Keep cookie volume read-only in containers.
- Use only manually exported, authorized account cookies.
