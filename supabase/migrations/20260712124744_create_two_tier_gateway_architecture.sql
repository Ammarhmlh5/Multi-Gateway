/*
# Two-Tier Gateway Architecture: Telecom Gateways + Internal Routes

1. Overview
This migration replaces the single-tier `gateways` concept with a two-tier
architecture:
  - **Telecom Gateways (Level 1)**: Direct connections to telecom companies.
    These are the exit point — messages leave the system through these
    gateways to reach the telecom provider.
  - **Internal Routes (Level 2)**: Internal paths/accounts that are linked to
    a telecom gateway. Each internal route forwards its messages to its
    assigned telecom gateway for delivery.

2. New Tables
- `telecom_gateways` (Level 1)
  - `id`               (uuid, PK, defaults to gen_random_uuid())
  - `name`             (varchar(255), not null) — human-readable name
  - `slug`             (varchar(100), not null, unique) — URL-safe identifier
  - `provider`         (varchar(255), not null) — telecom company name (e.g. "STC")
  - `api_key`          (varchar(255), not null) — key for telecom company auth
  - `created_at`       (timestamptz, defaults to now())
- `internal_routes` (Level 2)
  - `id`                  (uuid, PK, defaults to gen_random_uuid())
  - `name`                (varchar(255), not null) — human-readable name
  - `slug`                (varchar(100), not null, unique) — URL-safe identifier
  - `telecom_gateway_id`  (uuid, not null, FK → telecom_gateways.id ON DELETE RESTRICT)
  - `api_key`             (varchar(255), not null) — key for inbound auth
  - `created_at`          (timestamptz, defaults to now())

3. Relationship
- Each internal route MUST reference exactly one telecom gateway.
- A telecom gateway can serve multiple internal routes.
- ON DELETE RESTRICT prevents deleting a telecom gateway that still has
  internal routes attached.

4. Security (RLS)
- RLS ENABLED on both new tables.
- No anon policies — access is exclusively through the Go backend's privileged
  connection (service role bypasses RLS). The React frontend never touches
  these tables directly via the anon key.
- Dynamic log tables (created at runtime by the Go backend as
  `route_<slug>_logs`) will also have RLS enabled at creation time.

5. Old Table
- The original `gateways` table is left in place (data safety: never DROP).
  It had 0 rows and is superseded by the new two-tier design. The Go backend
  will no longer reference it.

6. Indexes
- Unique index on `telecom_gateways.slug` (via UNIQUE constraint).
- Unique index on `internal_routes.slug` (via UNIQUE constraint).
- Index on `internal_routes.telecom_gateway_id` for FK join performance.
*/

-- Level 1: Telecom Gateways
CREATE TABLE IF NOT EXISTS telecom_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  provider varchar(255) NOT NULL,
  api_key varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE telecom_gateways ENABLE ROW LEVEL SECURITY;

-- Level 2: Internal Routes (linked to a telecom gateway)
CREATE TABLE IF NOT EXISTS internal_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  telecom_gateway_id uuid NOT NULL REFERENCES telecom_gateways(id) ON DELETE RESTRICT,
  api_key varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE internal_routes ENABLE ROW LEVEL SECURITY;

-- Index for FK lookups
CREATE INDEX IF NOT EXISTS idx_internal_routes_telecom_gateway_id
  ON internal_routes(telecom_gateway_id);
