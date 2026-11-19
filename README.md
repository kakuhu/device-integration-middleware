# Device Integration Middleware

A small, portfolio-ready Node.js/Express project demonstrating how one system can coordinate a device transfer with an external platform.

The project is intentionally lightweight. It uses an in-memory sample inventory and a mock external API so it can be run locally without company systems, credentials, or infrastructure.

## What it demonstrates

- REST API development with Node.js and Express
- Outbound API requests using Axios
- Retry handling for network errors, HTTP 429 and HTTP 5xx responses
- No retry for ordinary HTTP 4xx client errors
- Idempotency-key handling to prevent duplicate processing of the same request
- Local state changes only after external confirmation
- Basic transaction logging
- Automated tests with Jest and Supertest

## Requirements

- Node.js 18 or later
- npm

## Setup

1. Extract or clone this repository.
2. Open a terminal in the project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Copy `.env.example` to `.env`.
5. Start the server:

   ```bash
   npm run dev
   ```

The API runs at `http://localhost:5000` by default.

## Run tests

```bash
npm test
```

The tests use a mocked outbound HTTP client for predictable retry tests. They do not call any real external service.

## API endpoints

### Health check

`GET /api/health`

Example response:

```json
{ "success": true, "status": "healthy" }
```

### Transfer a device

`POST /api/transfer`

Required header:

```text
Idempotency-Key: a-unique-request-key
Content-Type: application/json
```

Example body:

```json
{
  "device_id": "DEV-10001",
  "sender_id": "WH-001",
  "receiver_id": "AG-020"
}
```

Example successful response:

```json
{
  "success": true,
  "message": "Device transferred successfully",
  "device_id": "DEV-10001",
  "sender_id": "WH-001",
  "receiver_id": "AG-020",
  "status": "TRANSFERRED",
  "external_transaction_id": "EXT-example",
  "idempotent_replay": false
}
```

Repeat the exact request with the same `Idempotency-Key`: the saved response is returned and the outbound API is not called again. Reusing the same key with different request data returns HTTP 409.

### View transaction logs

`GET /api/transactions`

Returns successful and failed transfer records held in memory since the server started.

### Mock external API

`POST /api/external/transfer`

This endpoint simulates a third-party service. It is included so the project can run end-to-end on one local server.

## Try the failure scenarios

Edit `.env` and restart the server after changing `DEMO_EXTERNAL_SCENARIO`.

| Scenario | Expected behaviour |
|---|---|
| `success` | External API accepts the transfer on the first attempt |
| `temporary_failure` | First two calls return 503; the third succeeds |
| `permanent_failure` | All three attempts return 503; middleware returns failure |
| `client_error` | External API returns 400; middleware does not retry |

Example `.env` settings:

```env
DEMO_EXTERNAL_SCENARIO=temporary_failure
```

Use a fresh available device for each end-to-end test, or restart the server between tests because the sample inventory and mock attempt counters are held in memory.

## Sample inventory

| Device | Initial status | Initial location |
|---|---|---|
| DEV-10001 | AVAILABLE | WH-001 |
| DEV-10002 | AVAILABLE | WH-001 |
| DEV-10003 | IN_USE | AG-002 |

The inventory is deliberately in memory. It resets when the server restarts.

## Architecture

```text
Client
  |
  | POST /api/transfer + Idempotency-Key
  v
Transfer Controller
  |
  +--> Idempotency Service
  |
  v
Device Service
  |
  | Axios request (with retry handling)
  v
Mock External API (/api/external/transfer)
  |
  | success confirmation
  v
Update local sample inventory
  |
  +--> Transaction Logger
  |
  v
JSON response to Client
```

## Project structure

```text
device-integration-middleware/
├── src/
│   ├── app.js
│   ├── controllers/
│   ├── routes/
│   └── services/
├── tests/
├── .env.example
├── .gitignore
├── package.json
├── server.js
└── README.md
```

## Important design notes

- The sample inventory, idempotency store, transaction logs and mock API attempt counter are in-memory. They reset when the process restarts and are not shared across multiple server instances.
- The mock external API is hosted in the same Express application for easy local demonstration. A real integration would call a separately hosted provider endpoint.
- For production use, idempotency records and transaction logs should be stored durably, and the external provider should support idempotency or transaction-status lookup. Retrying a request after a network timeout can otherwise risk repeating an operation that the provider processed but whose response was lost.
- This is a portfolio demonstration, not a production-ready deployment.

## Security

Do not commit `.env`, real credentials, company source code, customer information, production URLs, or private infrastructure details. Only `.env.example` should be committed.
