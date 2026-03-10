# LinkPath API Reference

## Setup

### Requirements
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `ANTHROPIC_API_KEY` | Yes | — | Anthropic API key for checkout agent |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `0.0.0.0` | Server host |
| `S3_BUCKET` | No | `linkpath-screenshots` | S3 bucket for screenshots |
| `S3_REGION` | No | `us-east-1` | S3 region |
| `S3_ENDPOINT` | No | — | Custom S3 endpoint (e.g. MinIO) |
| `S3_ACCESS_KEY` | No | — | S3 access key |
| `S3_SECRET_KEY` | No | — | S3 secret key |
| `BROWSERLESS_ENDPOINT` | No | — | Browserless WebSocket endpoint |
| `WORKER_CONCURRENCY` | No | `20` | Max concurrent test workers |
| `WEBHOOK_TIMEOUT_MS` | No | `10000` | Webhook delivery timeout |
| `WEBHOOK_MAX_RETRIES` | No | `3` | Max webhook retry attempts |

### Database Setup

```bash
# Generate migration files
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (development only)
npm run db:push
```

### Create an API Key

```bash
npm run cli -- key:create --name "my-key"
# Prints: lp_... (save this — shown only once)
```

### Start the Server

```bash
npm run dev
```

---

## Authentication

All API endpoints (except health checks) require an API key via the `X-API-Key` header:

```
X-API-Key: lp_your_key_here
```

**Error responses:**

| Status | Body | Cause |
|---|---|---|
| `401` | `{ "error": "Missing X-API-Key header" }` | Header not provided |
| `401` | `{ "error": "Invalid or inactive API key" }` | Key not found or deactivated |

---

## Endpoints

### Health

#### `GET /health`

Returns server status. No auth required.

**Response** `200`
```json
{ "status": "ok", "timestamp": "2025-01-15T10:30:00.000Z" }
```

#### `GET /ready`

Checks Redis connectivity. No auth required.

**Response** `200`
```json
{ "status": "ready" }
```

**Response** `503`
```json
{ "status": "not ready" }
```

---

### Submit Test

#### `POST /api/v1/test`

Enqueues a single affiliate link test.

**Request body:**

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `url` | string (URL) | Yes | — | Affiliate link to test |
| `depth` | string | No | `"redirect"` | `"redirect"`, `"landing"`, or `"checkout"` |
| `expectCookies` | string[] | No | `[]` | Cookie names to verify |
| `productSelector` | string | No | — | CSS selector for product (checkout depth) |
| `addToCartSelector` | string | No | — | CSS selector for add-to-cart button |
| `proxy` | string | No | — | Proxy URL |
| `model` | string | No | `"claude-sonnet-4-6"` | AI model for checkout agent |
| `maxTurns` | number | No | `30` | Max agent turns (1–100) |
| `consentMode` | string | No | `"accept_all"` | `"accept_all"`, `"reject_all"`, `"manage_necessary_only"` |
| `consentCompare` | boolean | No | `false` | Run all consent modes and compare |
| `browserProfile` | string | No | `"chrome"` | `"chrome"`, `"safari"`, `"mobile-chrome"`, `"mobile-safari"` |
| `device` | string | No | — | Playwright device name override |
| `webhookUrl` | string (URL) | No | — | Webhook URL for completion notification |
| `webhookSecret` | string | No | — | HMAC secret for webhook signature |

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/test \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lp_your_key" \
  -d '{
    "url": "https://example.com/affiliate?ref=123",
    "depth": "landing",
    "expectCookies": ["affiliate_id"],
    "browserProfile": "chrome"
  }'
```

**Response** `202`
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "statusUrl": "/api/v1/test/550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Get Test Result

#### `GET /api/v1/test/:jobId`

Poll for test status and results.

**Response** `200` (pending/active)
```json
{
  "jobId": "550e8400-...",
  "status": "pending",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "startedAt": null,
  "completedAt": null
}
```

**Response** `200` (completed)
```json
{
  "jobId": "550e8400-...",
  "status": "completed",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "startedAt": "2025-01-15T10:30:01.000Z",
  "completedAt": "2025-01-15T10:30:15.000Z",
  "result": {
    "testId": "abc123",
    "url": "https://example.com/affiliate?ref=123",
    "depth": "landing",
    "status": "pass",
    "duration": 14200,
    "redirectChain": [...],
    "landing": { ... },
    "issues": []
  }
}
```

**Response** `200` (failed)
```json
{
  "jobId": "550e8400-...",
  "status": "failed",
  "createdAt": "2025-01-15T10:30:00.000Z",
  "completedAt": "2025-01-15T10:30:05.000Z",
  "error": "Navigation timeout exceeded",
  "result": {
    "status": "fail",
    "issues": [
      { "severity": "error", "message": "Navigation timeout exceeded" }
    ]
  }
}
```

**Response** `404`
```json
{ "error": "Job not found" }
```

---

### Submit Batch

#### `POST /api/v1/batch`

Enqueue up to 100 tests in a single request.

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `tests` | array | Yes | Array of test objects (same fields as single test, 1–100 items) |
| `webhookUrl` | string (URL) | No | Default webhook URL for all tests |
| `webhookSecret` | string | No | Default webhook secret for all tests |

Per-test `webhookUrl`/`webhookSecret` override the batch-level defaults.

**Example:**
```bash
curl -X POST http://localhost:3000/api/v1/batch \
  -H "Content-Type: application/json" \
  -H "X-API-Key: lp_your_key" \
  -d '{
    "tests": [
      { "url": "https://example.com/link1", "depth": "redirect" },
      { "url": "https://example.com/link2", "depth": "landing" }
    ],
    "webhookUrl": "https://your-server.com/webhook"
  }'
```

**Response** `202`
```json
{
  "batchId": "660e8400-...",
  "jobs": [
    { "jobId": "...", "status": "pending", "statusUrl": "/api/v1/test/..." },
    { "jobId": "...", "status": "pending", "statusUrl": "/api/v1/test/..." }
  ]
}
```

---

### Get Screenshot

#### `GET /api/v1/test/:jobId/screenshots/:stage`

Returns the stored screenshot for a test stage. With external object storage configured, the API redirects to a presigned URL; with local storage it serves the image directly.

**Path parameters:**

| Param | Description |
|---|---|
| `jobId` | Job UUID |
| `stage` | `"landing"`, `"consent"`, or `"checkout"` |

**Response** `200` — Local image bytes

**Response** `302` — Redirect to presigned object storage URL

**Response** `404`
```json
{ "error": "Screenshot not found" }
```

---

## Webhooks

When a `webhookUrl` is provided with a test submission, LinkPath sends a `POST` request on completion or failure.

### Headers

| Header | Description |
|---|---|
| `Content-Type` | `application/json` |
| `X-LinkPath-Event` | `test.completed` or `test.failed` |
| `X-LinkPath-Signature` | HMAC-SHA256 of body (only if `webhookSecret` provided) |

### Success Payload

```json
{
  "jobId": "550e8400-...",
  "status": "completed",
  "result": { ... }
}
```

### Failure Payload

```json
{
  "jobId": "550e8400-...",
  "status": "failed",
  "error": "Error message"
}
```

### Retry Policy

- Up to 3 attempts (configurable via `WEBHOOK_MAX_RETRIES`)
- Exponential backoff: 1s, 2s, 4s
- Timeout: 10s per attempt (configurable via `WEBHOOK_TIMEOUT_MS`)

### Signature Verification

If `webhookSecret` is provided, verify the `X-LinkPath-Signature` header:

```javascript
import crypto from "node:crypto";

function verifySignature(body, secret, signature) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}
```

---

## Error Codes

| Status | Meaning |
|---|---|
| `200` | Success |
| `202` | Accepted (job enqueued) |
| `302` | Redirect (screenshot presigned URL) |
| `401` | Unauthorized (missing/invalid API key) |
| `404` | Not found |
| `429` | Rate limited |
| `500` | Internal server error |
