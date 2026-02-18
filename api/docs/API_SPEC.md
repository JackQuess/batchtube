# BatchTube API v1 Specification

## Overview
The BatchTube API allows developers to programmatically create batches of URLs, queue them for processing across 30+ supported platforms, and retrieve the resulting media files.

**Base URL:** `https://api.batchtube.app/v1`

## Authentication
All API requests must include your API Key in the `Authorization` header using the Bearer scheme.
API Keys are opaque strings starting with `bt_live_`.

```txt
Authorization: Bearer bt_live_xxxxxxxxxxxxxxxxxxxxxxxx
```

## Errors
All errors follow a standard JSON structure.

```json
{
  "error": {
    "code": "rate_limit_exceeded",
    "message": "You have exceeded your plan limits.",
    "request_id": "req_12345abc",
    "details": {
      "retry_after": 60
    }
  }
}
```

Common codes: `unauthorized`, `forbidden`, `not_found`, `validation_error`, `rate_limit_exceeded`, `internal_server_error`.

## Rate Limiting
Headers returned on every request:
- `X-RateLimit-Limit`: Requests permitted per minute.
- `X-RateLimit-Remaining`: Requests left in current window.
- `X-RateLimit-Reset`: UTC timestamp when the window resets.

## Resources

### 1. Batches

#### Create a Batch
`POST /batches`

Parses a list of URLs, auto-detects providers, and creates items.

Request Body:
```json
{
  "name": "Social Media Backup 2026",
  "urls": [
    "https://www.youtube.com/watch?v=...",
    "https://www.instagram.com/p/..."
  ],
  "options": {
    "format": "mp4",
    "quality": "1080p",
    "archive_as_zip": true
  },
  "auto_start": true,
  "callback_url": "https://myapp.com/webhooks/batchtube"
}
```

Response (201 Created):
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "Social Media Backup 2026",
  "status": "queued",
  "item_count": 2,
  "progress": 0,
  "created_at": "2026-10-24T10:00:00Z"
}
```

#### List Batches
`GET /batches`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `status` (optional)

Response (200 OK):
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Batch A",
      "status": "completed",
      "item_count": 5,
      "progress": 100,
      "created_at": "2026-10-24T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### Get Batch Details
`GET /batches/{id}`

Returns detailed status and aggregate progress.

#### Cancel Batch
`POST /batches/{id}/cancel`

Stops all pending or processing items in the batch. Sets batch status to `cancelled`.

#### Get Batch ZIP
`GET /batches/{id}/zip`

Returns a temporary signed URL to download the full batch archive (if `archive_as_zip` was enabled and batch is completed).

Response (200 OK):
```json
{
  "url": "https://storage.batchtube.app/signed/archive.zip?token=...",
  "expires_at": "2026-10-24T12:00:00Z"
}
```

### 2. Batch Items

#### List Items in Batch
`GET /batches/{id}/items`

Query Parameters:
- `page` (default: 1)
- `limit` (default: 50)

Response (200 OK):
```json
{
  "data": [
    {
      "id": "789e4567-e89b-12d3-a456-426614174111",
      "original_url": "https://www.youtube.com/watch?v=...",
      "provider": "youtube",
      "status": "completed",
      "file_id": "111e4567-e89b-12d3-a456-426614174222",
      "error": null
    }
  ],
  "meta": { "page": 1, "total": 50 }
}
```

### 3. Files

#### Get Download Link
`GET /files/{id}/download`

Response (200 OK):
```json
{
  "url": "https://storage.batchtube.app/signed/video.mp4?token=...",
  "expires_at": "2026-10-24T11:00:00Z"
}
```

### 4. Account

#### Get Usage & Limits
`GET /account/usage`

Response (200 OK):
```json
{
  "plan": "archivist",
  "cycle_reset": "2026-11-01T00:00:00Z",
  "limits": {
    "bandwidth_bytes": 1000000000000,
    "monthly_downloads": 10000,
    "concurrency": 50
  },
  "used": {
    "bandwidth_bytes": 45000000000,
    "monthly_downloads": 1540
  }
}
```

## Webhooks
Events are sent to the `callback_url` provided during batch creation.

Headers:
- `X-BatchTube-Event`: Event name (e.g., `batch.completed`)
- `X-BatchTube-Signature`: HMAC-SHA256 signature of the payload using your Webhook Secret.
- `Content-Type: application/json`

Events:
- `batch.completed`
- `batch.failed`

Payload:
```json
{
  "event": "batch.completed",
  "timestamp": "2026-10-24T10:05:00Z",
  "data": {
    "batch_id": "123e4567-e89b-12d3-a456-426614174000",
    "status": "completed",
    "successful_items": 10,
    "failed_items": 0
  }
}
```
