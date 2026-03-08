# BatchTube CLI – Deliverables

## A) Implementation plan

1. **Package setup** — New `cli/` package: `@batchtube/cli`, bin `batchtube`, TypeScript, ESM, build to `dist/`.
2. **Config** — Config manager: `~/.batchtube/config.json` (or `BATCHTUBE_CONFIG_DIR`), stores `apiBaseUrl` and `apiKey`. No raw secrets in logs.
3. **Auth** — `login` (prompts for API base URL + API key, verify via GET /v1/account/usage), `logout` (remove config), `whoami` (show plan/credits or validate key).
4. **API client** — Single `api.ts` with `fetch`, Bearer token, error parsing. Used by all commands. No direct download logic.
5. **Commands** — `download <url>`, `batch <file-or-urls...>`, `status <batchId>`, `files`, `download-file <fileId>`. Options: `--format`, `--quality`, `--zip`, `--json` (and global `--api`).
6. **Output** — Human-friendly by default; `--json` for status, files, download, batch, whoami.
7. **Errors** — Handle 401, 403, 429, 503 with clear messages; exit 1 for client errors, 2 for server errors.

## B) File-by-file changes

| Path | Description |
|------|-------------|
| `cli/package.json` | New package: name `@batchtube/cli`, bin `batchtube`, scripts build/prepare, deps commander + prompts, devDeps typescript + @types/node + @types/prompts |
| `cli/tsconfig.json` | Target ES2022, NodeNext, outDir dist, strict |
| `cli/src/config.ts` | Config load/save/delete, path `~/.batchtube/config.json`, override base URL support |
| `cli/src/api.ts` | API client: createBatch, getBatch, getAccountUsage, getFileDownload, listFiles; BatchTubeApiError; Bearer auth |
| `cli/src/output.ts` | formatBytes, formatDate, tableFormat |
| `cli/src/commands/login.ts` | Prompts for apiBaseUrl + apiKey, verify with account/usage, saveConfig |
| `cli/src/commands/logout.ts` | deleteConfig, message |
| `cli/src/commands/whoami.ts` | loadConfig, getAccountUsage, print plan/credits or JSON |
| `cli/src/commands/download.ts` | createBatch single URL, --format, --quality, --zip, --json |
| `cli/src/commands/batch.ts` | Parse file or URLs, createBatch with same options |
| `cli/src/commands/status.ts` | getBatch, print id/status/items/progress/zip-ready or JSON |
| `cli/src/commands/files.ts` | listFiles (GET /v1/files), table or JSON; handle 404 with friendly message |
| `cli/src/commands/download-file.ts` | getFileDownload, print URL and expires or JSON |
| `cli/src/index.ts` | Commander: --api, --json global; login, logout, whoami, download, batch, status, files, download-file; error handler |
| `cli/README.md` | Install, login, commands, examples, requirements |

No changes to backend or API code.

## C) package.json for @batchtube/cli

See `cli/package.json`. Summary:

- **name:** `@batchtube/cli`
- **version:** 1.0.0
- **bin:** `batchtube` → `./dist/index.js`
- **main:** `dist/index.js`
- **type:** module
- **scripts:** build, prepare, dev
- **dependencies:** commander ^12.1.0, prompts ^2.4.2
- **devDependencies:** typescript ^5.3.0, @types/node ^20.10.0, @types/prompts
- **files:** ["dist"]
- **engines:** node >= 18

## D) Exact commands supported

| Command | Description |
|---------|-------------|
| `batchtube` (no args) | Show help |
| `batchtube login` | Prompt for API base URL and API key; verify and save |
| `batchtube logout` | Remove stored credentials |
| `batchtube whoami` | Show plan/credits or validate key; `--json` for raw |
| `batchtube download <url>` | Create single-item batch; `--format mp4\|mp3`, `--quality best\|1080p\|720p`, `--zip`, `--json` |
| `batchtube batch <file-or-urls...>` | Create batch from file or URLs; same options as download |
| `batchtube status <batchId>` | Batch status; `--json` |
| `batchtube files` | List files; `--json`; graceful message if GET /v1/files missing |
| `batchtube download-file <fileId>` | Print signed download URL; `--json` |

Global options (before command): `--api <url>`, `--json`.

## E) How to test locally

1. **Build and link**
   ```bash
   cd cli
   npm install
   npm run build
   npm link
   batchtube --help
   ```

2. **Run without linking**
   ```bash
   node cli/dist/index.js --help
   node cli/dist/index.js whoami   # will ask to login if no config
   ```

3. **Login** (use a valid API key from your BatchTube account; API must accept Bearer `bt_live_...` on /v1 routes — see F)
   ```bash
   batchtube login
   batchtube whoami
   ```

4. **Download / batch** (requires API that accepts API key on POST /v1/batches)
   ```bash
   batchtube download "https://youtube.com/watch?v=..."
   batchtube status <returned-batch-id>
   ```

5. **Override API base**
   ```bash
   batchtube --api https://your-api.example.com whoami
   ```

## F) Backend route gaps

1. **API key auth on main /v1 routes**  
   The API spec says all requests use `Authorization: Bearer bt_live_...`. In the codebase:
   - `api/src/plugins/auth.ts` — For `/v1` (except `/v1/api/`) it expects a **Supabase JWT** and does not accept API keys.
   - `api/src/plugins/api-key-auth.ts` — Accepts API keys only for **`/v1/api/`** (e.g. API key management routes).

   So **batches, files, and account** (`/v1/batches`, `/v1/files`, `/v1/account`) are currently **JWT-only**. For the CLI to work with an API key, the backend must accept API keys on these routes (e.g. when `Authorization: Bearer bt_live_...` is present, resolve user from API key and set `request.auth` the same way as JWT). This is a **backend change**, not a CLI change.

2. **GET /v1/files (list files)**  
   The API has `GET /v1/files/:id/download` but **no GET /v1/files** to list files. The CLI calls `GET /v1/files?page=1&limit=100`. If the backend returns 404, the CLI prints a friendly message and suggests using `batchtube status` and batch items to get file IDs. Adding **GET /v1/files** (paginated list of files for the authenticated user) would make `batchtube files` fully functional.

3. **Account usage shape**  
   The CLI uses the current **account/usage** response: `plan`, `cycle_reset`, `credits: { used, limit, available }`. The written API_SPEC.md also describes `limits` and `used` (e.g. bandwidth, monthly_downloads). The CLI works with the current implementation; if the backend adds more fields, the CLI can show them later without breaking.

**Summary for backend:**  
- Add API key authentication for `/v1` routes (or at least `/v1/batches`, `/v1/files`, `/v1/account`) when the Bearer token starts with `bt_live_`.  
- Optionally add **GET /v1/files** (list files) for `batchtube files`.
