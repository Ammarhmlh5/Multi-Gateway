/*
# Create gateways and admin_users master tables

1. Overview
This migration establishes the two master tables for the Multi-Gateway Telecom
Simulation Suite:
  - `gateways`   : holds the registry of all SMS gateways. Each gateway has a
                   unique slug that determines the name of its dedicated log
                   table (created dynamically by the Go backend as
                   `gw_table_<slug>_logs`).
  - `admin_users`: holds the administrator credentials used for JWT login in
                   the Go backend.

2. New Tables
- `gateways`
  - `id`          (uuid, primary key, defaults to gen_random_uuid())
  - `name`        (varchar(255), not null) - human-readable gateway name
  - `slug`        (varchar(100), not null, unique) - URL-safe identifier used
                   to build the dynamic log table name
  - `api_key`     (varchar(255), not null) - secret key clients send in the
                   `X-API-KEY` header to send SMS through the gateway
  - `created_at`  (timestamptz, defaults to now())
- `admin_users`
  - `id`             (uuid, primary key, defaults to gen_random_uuid())
  - `username`       (varchar(100), not null, unique) - admin login username
  - `password_hash`  (varchar(255), not null) - bcrypt hash of the password

3. Seed Data
- Inserts one default admin user:
  - username: admin
  - password_hash: bcrypt hash of "admin123"
  This is created idempotently (only if no admin user named 'admin' exists yet)
  so first login works immediately after deployment.

4. Security (Row Level Security)
- RLS is ENABLED on both master tables.
- These tables are accessed exclusively by the Go backend, which connects with
  the privileged Postgres connection string (service role) that bypasses RLS.
  The React frontend never uses the Supabase anon key to read these tables —
  it goes through the Go API only.
- No policies are added for the anon role, which means anon-key access is fully
  blocked. This is intentional: the admin registry and credentials must not be
  exposed to the public anon key. All data access is mediated by the Go backend
  and its JWT auth.
- Note on dynamic log tables: the per-gateway tables (`gw_table_<slug>_logs`)
  are created at runtime by the Go backend. RLS will be enabled on each of them
  at creation time by the backend's dynamic SQL, keeping them locked to anon
  access as well.

5. Indexes
- Unique index on `gateways.slug` (enforced by the UNIQUE constraint).
- Unique index on `admin_users.username` (enforced by the UNIQUE constraint).

6. Important Notes
- The dynamic log tables are NOT created here. They are created by the Go
  backend's `POST /api/admin/gateways` handler via raw SQL at runtime, using
  the strict naming convention `gw_table_<slug>_logs`.
- This migration is idempotent: re-running it will not duplicate the seed admin
  or recreate existing tables.
*/

-- gateways master table
CREATE TABLE IF NOT EXISTS gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  slug varchar(100) NOT NULL UNIQUE,
  api_key varchar(255) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;

-- admin_users master table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username varchar(100) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL
);

ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Seed default admin user (idempotent)
INSERT INTO admin_users (username, password_hash)
SELECT 'admin', '$2b$10$OLrNz4ciwm.64Pekbs3IQ.LD3e2Q9VK.O6WyCXhzRrGBgtOxnq1Qa'
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users WHERE username = 'admin'
);
