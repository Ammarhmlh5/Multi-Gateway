# Multi-Gateway Telecom Simulation Suite — Go Backend

Lightweight API built with **Gin** that connects directly to the Supabase
PostgreSQL database and implements a two-tier gateway architecture with
dynamic per-route table isolation.

## Two-Tier Architecture

- **Level 1 — Telecom Gateways**: Direct connections to telecom companies
  (e.g. STC, Mobily). These are the exit point for messages leaving the
  system.
- **Level 2 — Internal Routes**: Internal paths linked to a telecom gateway.
  Each route receives messages and forwards them to its assigned Level 1
  gateway for delivery.

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
| POST | `/api/v1/route/:route_slug/sms/send` | `X-API-KEY` | Ingest SMS into an internal route's log table |

Request body for SMS send:

```json
{ "sender": "STC", "to": "+966500000000", "text": "Your code is 1234" }
```

### Admin (JWT-protected)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/telecom-gateways` | Create telecom gateway (Level 1) |
| GET | `/api/admin/telecom-gateways` | List all telecom gateways |
| POST | `/api/admin/internal-routes` | Create internal route (Level 2) + dynamic log table |
| GET | `/api/admin/internal-routes` | List all internal routes with linked gateway |
| GET | `/api/admin/internal-routes/:route_slug/logs` | Logs from a route's dynamic table |
| GET | `/api/admin/stats` | Total telecom gateways + internal routes + logs |

Admin endpoints require `Authorization: Bearer <token>`.

## Dynamic Table Isolation

When an internal route is created, the backend runs raw SQL to create a
dedicated log table named `route_<slug>_logs` (e.g. `route_customer_otp_logs`).
Each such table has: `id` (UUID), `sender_id`, `receiver_phone`,
`message_text`, `status`, `received_at`. RLS is enabled on each dynamic table.
