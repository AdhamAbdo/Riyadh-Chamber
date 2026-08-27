/*
# Create business data tables (single-tenant, no auth)

This migration creates the core business data tables for the Riyadh Chamber
task management app: tasks, meetings, projects, and lookups.

The app has its own frontend-only login (stored in IndexedDB), so there is
no Supabase auth — the frontend talks to Supabase with the anon key.
Therefore all policies use `TO anon, authenticated` with `USING (true)`.

1. New Tables
- `tasks` — task records with department, title, description, type, date,
  progress, status, notes, and timestamps.
- `meetings` — meeting records with title, date, time, type, classification,
  notes, and timestamps.
- `projects` — project records with department, name, description, start/end
  dates, type, status, progress, notes, and timestamps.
- `lookups` — single row holding JSON arrays of dropdown values (departments,
  task types/statuses, meeting types/classifications, project types/statuses).

2. Security
- RLS enabled on all tables.
- All tables allow anon + authenticated CRUD (single-tenant, shared data).
*/

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  department text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  progress integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
CREATE POLICY "anon_select_tasks" ON tasks FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
CREATE POLICY "anon_insert_tasks" ON tasks FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
CREATE POLICY "anon_update_tasks" ON tasks FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
CREATE POLICY "anon_delete_tasks" ON tasks FOR DELETE
  TO anon, authenticated USING (true);

-- Meetings
CREATE TABLE IF NOT EXISTS meetings (
  id text PRIMARY KEY,
  title text NOT NULL DEFAULT '',
  date text NOT NULL DEFAULT '',
  time text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  classification text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
CREATE POLICY "anon_select_meetings" ON meetings FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
CREATE POLICY "anon_insert_meetings" ON meetings FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
CREATE POLICY "anon_update_meetings" ON meetings FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
CREATE POLICY "anon_delete_meetings" ON meetings FOR DELETE
  TO anon, authenticated USING (true);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id text PRIMARY KEY,
  department text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  start_date text NOT NULL DEFAULT '',
  end_date text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT '',
  progress integer NOT NULL DEFAULT 0,
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
CREATE POLICY "anon_select_projects" ON projects FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
CREATE POLICY "anon_insert_projects" ON projects FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_projects" ON projects;
CREATE POLICY "anon_update_projects" ON projects FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
CREATE POLICY "anon_delete_projects" ON projects FOR DELETE
  TO anon, authenticated USING (true);

-- Lookups (single row, id = 1)
CREATE TABLE IF NOT EXISTS lookups (
  id integer PRIMARY KEY DEFAULT 1,
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE lookups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_lookups" ON lookups;
CREATE POLICY "anon_select_lookups" ON lookups FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_lookups" ON lookups;
CREATE POLICY "anon_insert_lookups" ON lookups FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_lookups" ON lookups;
CREATE POLICY "anon_update_lookups" ON lookups FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_lookups" ON lookups;
CREATE POLICY "anon_delete_lookups" ON lookups FOR DELETE
  TO anon, authenticated USING (true);