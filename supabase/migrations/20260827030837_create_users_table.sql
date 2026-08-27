/*
# Create app_users table for frontend-only authentication

1. New Tables
- `app_users`
  - `id` (text, primary key) — business ID like "USER-00001"
  - `name` (text, not null) — display name
  - `email` (text, unique, not null) — login email
  - `password_hash` (text, not null) — simple hash (frontend-only auth, not Supabase Auth)
  - `role` (text, not null) — "مدير" or "مستخدم"
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `app_users`.
- Allow anon + authenticated CRUD since this is a single-tenant app with frontend-only auth.
- The app uses the anon key to read/write user records for login verification.

3. Seed Data
- Inserts two seed users (admin + regular user) matching the existing seedData.ts.
- Uses ON CONFLICT to be idempotent.
*/

CREATE TABLE IF NOT EXISTS app_users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_app_users" ON app_users;
CREATE POLICY "anon_select_app_users" ON app_users FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_app_users" ON app_users;
CREATE POLICY "anon_insert_app_users" ON app_users FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_app_users" ON app_users;
CREATE POLICY "anon_update_app_users" ON app_users FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_app_users" ON app_users;
CREATE POLICY "anon_delete_app_users" ON app_users FOR DELETE
  TO anon, authenticated USING (true);

-- Seed users (password hashes match simpleHash() output from seedData.ts)
INSERT INTO app_users (id, name, email, password_hash, role, created_at)
VALUES
  ('USER-00001', 'مدير النظام', 'admin@riyadhchamber.local', '5f4d3e2c', 'مدير', '2026-01-01T08:00:00.000Z'),
  ('USER-00002', 'مستخدم النظام', 'user@riyadhchamber.local', 'a1b2c3d4', 'مستخدم', '2026-01-01T08:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
