# @batchtube/cli

Official CLI for [BatchTube](https://batchtube.app) — batch download from 30+ platforms (YouTube, TikTok, Instagram, etc.) via the BatchTube API.

## Installation

```bash
npm install -g @batchtube/cli
```

After install, the `batchtube` command is available globally.

## Login

Authenticate with your API key (create one in your BatchTube dashboard):

```bash
batchtube login
```

You'll be prompted for:

- **API base URL** (default: `https://api.batchtube.net`)
- **API key** (starts with `bt_live_`)

Credentials are stored in `~/.batchtube/config.json` (or `%USERPROFILE%\.batchtube\config.json` on Windows).

## Commands

### `batchtube whoami`

Show current plan and credits, or validate your API key.

```bash
batchtube whoami
batchtube whoami --json
```

### `batchtube download <url>`

Create a single-item batch and start processing.

```bash
batchtube download https://youtube.com/watch?v=...
batchtube download https://youtube.com/watch?v=... --format mp3 --quality best
batchtube download https://... --zip
```

Options:

- `--format mp4|mp3` — Output format (default: mp4)
- `--quality best|1080p|720p` — Quality (default: best)
- `--zip` — Request a ZIP archive when the batch completes

### `batchtube batch <file-or-urls...>`

Create a batch from a text file of URLs or from multiple URL arguments.

```bash
batchtube batch urls.txt
batchtube batch https://youtube.com/... https://tiktok.com/...
batchtube batch urls.txt --format mp3 --zip
```

Options: same as `download` (`--format`, `--quality`, `--zip`).

### `batchtube status <batchId>`

Fetch batch status.

```bash
batchtube status <batch-uuid>
batchtube status <batch-uuid> --json
```

Shows: batch id, status, item count, progress, ZIP ready yes/no.

### `batchtube files`

List available files for your account (file id, name, size, expires).

```bash
batchtube files
batchtube files --json
```

*Note: If the API does not yet expose a list-files endpoint, you'll see a message to use `batchtube status` and batch items to get file IDs.*

### `batchtube download-file <fileId>`

Get a signed download URL for a file.

```bash
batchtube download-file <file-uuid>
batchtube download-file <file-uuid> --json
```

Prints the direct download URL and expiry.

### `batchtube logout`

Remove stored credentials.

```bash
batchtube logout
```

## Global options

- **`--api <url>`** — Override API base URL (e.g. for staging or self-hosted).

  ```bash
  batchtube --api https://custom-api.example.com status <batchId>
  ```

- **`--json`** — Machine-readable JSON output (supported on `whoami`, `download`, `batch`, `status`, `files`, `download-file`).

## Examples

```bash
# Install and login
npm install -g @batchtube/cli
batchtube login

# Single video
batchtube download "https://www.youtube.com/watch?v=abc123"

# Batch from file
batchtube batch ~/urls.txt --format mp3 --zip

# Check status
batchtube status 123e4567-e89b-12d3-a456-426614174000

# List files and get a download link
batchtube files
batchtube download-file <file-id>
```

## Requirements

- Node.js 18+
- BatchTube API key (Archivist or Enterprise plan for API access)

## License

MIT
