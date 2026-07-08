# Multi-Gateway Telecom Simulation Suite — Go Backend

Lightweight API built with **Gin** that connects directly to the Supabase
PostgreSQL database and performs dynamic per-gateway table isolation.

## Prerequisites

- Go 1.22+
- A Supabase PostgreSQL project (connection string from
  Project Settings → Database → Connection string → URI)

## Setup

1. Copy `.env.example` to `.env` and fill in the values:

   ```
   DATABASE_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
   JWT_SECRET=your-long-random-secret
   PORT=8080
   ```

2. Install dependencies and run:

   ```
   go mod tidy
   go run main.go
   ```

The API starts on `http://localhost:8080`.

## Default Admin

Username: `alhomely5@gmail.com`

Set via the database. Update the `admin_users` row to change it.

## Endpoints

### Public

| Method | Path | Headers | Description |
|--------|------|---------|-------------|
| GET | `/api/health` | — | Health check |
| POST | `/api/admin/login` | — | Admin login, returns JWT |
| POST | `/api/v1/gateway/:gateway_slug/sms/send` | `X-API-KEY` | Ingest SMS into a gateway's dynamic log table |

Request body for SMS send:

```json
{ "sender": "STC", "to": "+966500000000", "text": "Your code is 1234" }
```

### Admin (JWT-protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/gateways` | Create gateway + dynamic log table |
| GET | `/api/admin/gateways` | List all gateways |
| GET | `/api/admin/gateways/:gateway_slug/logs` | Logs from a gateway's dynamic table |
| GET | `/api/admin/stats` | Total gateways + total logs across DB |

Admin endpoints require `Authorization: Bearer <token>`.

## Dynamic Table Isolation

When a gateway is created, the backend runs raw SQL to create a dedicated log
table named `gw_table_<slug>_logs` (e.g. `gw_table_stc_logs`). Each such table
has: `id` (UUID), `sender_id`, `receiver_phone`, `message_text`, `status`,
`received_at`. RLS is enabled on each dynamic table to block anon-key access.
