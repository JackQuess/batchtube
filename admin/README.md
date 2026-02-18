# BatchTube Admin

Internal owner-only admin panel for BatchTube.

## Run

```bash
cd admin
npm install
npm run dev
```

Default URL: `http://localhost:5174`

Admin UI talks to API via Vite proxy:
- `/admin-api/*` -> `http://localhost:8080/admin-api/*`
