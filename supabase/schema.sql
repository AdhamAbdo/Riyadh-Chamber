-- ============================================================
-- Riyadh Chamber Management — Supabase Schema Setup
-- ============================================================
-- Run this in the Supabase SQL Editor to create the full schema
-- (business tables + Supabase Auth profiles/RLS) from scratch.
-- Safe to re-run (uses IF NOT EXISTS / DROP IF EXISTS).
--
-- If you are upgrading an existing project instead, use the files
-- under supabase/migrations/ in order — this file is only for a
-- brand-new Supabase project.
-- ============================================================

-- ============ PROFILES (Supabase Auth) ============

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL DEFAULT '',
  email      text        NOT NULL,
  role       text        NOT NULL DEFAULT 'مستخدم' CHECK (role IN ('مدير', 'مستخدم')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'مدير'
  );
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'مستخدم')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'فقط المدير يمكنه تغيير الأدوار';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role_trigger ON profiles;
CREATE TRIGGER protect_profile_role_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_role();

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated USING (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_update_self_or_admin" ON profiles;
CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());
DROP POLICY IF EXISTS "profiles_admin_insert" ON profiles;
CREATE POLICY "profiles_admin_insert" ON profiles FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "profiles_admin_delete" ON profiles;
CREATE POLICY "profiles_admin_delete" ON profiles FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ TASKS ============
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     text        NOT NULL,
  department  text        NOT NULL,
  title       text        NOT NULL,
  description text        NOT NULL DEFAULT '',
  type        text        NOT NULL DEFAULT '',
  date        date        DEFAULT CURRENT_DATE,
  progress    integer     NOT NULL DEFAULT 0,
  status      text        NOT NULL DEFAULT '',
  notes       text        NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_tasks_progress        CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT chk_tasks_title_notempty  CHECK (length(btrim(title)) > 0),
  CONSTRAINT chk_tasks_dept_notempty   CHECK (length(btrim(department)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_task_id    ON tasks(task_id);
CREATE INDEX        IF NOT EXISTS idx_tasks_date       ON tasks(date);
CREATE INDEX        IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;
DROP POLICY IF EXISTS "authenticated_select_tasks" ON tasks;
CREATE POLICY "authenticated_select_tasks" ON tasks FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_tasks" ON tasks;
CREATE POLICY "authenticated_insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_tasks" ON tasks;
CREATE POLICY "authenticated_update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_delete_tasks" ON tasks;
CREATE POLICY "admin_delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ MEETINGS ============
CREATE TABLE IF NOT EXISTS meetings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id    text        NOT NULL,
  title         text        NOT NULL,
  date          date        DEFAULT CURRENT_DATE,
  time          time,
  type          text        NOT NULL DEFAULT '',
  classification text       NOT NULL DEFAULT '',
  notes         text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_meetings_title_notempty CHECK (length(btrim(title)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_meeting_id  ON meetings(meeting_id);
CREATE INDEX        IF NOT EXISTS idx_meetings_date        ON meetings(date);
CREATE INDEX        IF NOT EXISTS idx_meetings_created_at  ON meetings(created_at);

ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;
DROP POLICY IF EXISTS "authenticated_select_meetings" ON meetings;
CREATE POLICY "authenticated_select_meetings" ON meetings FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_meetings" ON meetings;
CREATE POLICY "authenticated_insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_meetings" ON meetings;
CREATE POLICY "authenticated_update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_delete_meetings" ON meetings;
CREATE POLICY "admin_delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ PROJECTS ============
CREATE TABLE IF NOT EXISTS projects (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   text        NOT NULL,
  department   text        NOT NULL,
  name         text        NOT NULL,
  description  text        NOT NULL DEFAULT '',
  start_date   date        DEFAULT CURRENT_DATE,
  end_date     date        DEFAULT CURRENT_DATE,
  type         text        NOT NULL DEFAULT '',
  status       text        NOT NULL DEFAULT '',
  progress     integer     NOT NULL DEFAULT 0,
  notes        text        NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_projects_progress     CHECK (progress >= 0 AND progress <= 100),
  CONSTRAINT chk_projects_name_notempty CHECK (length(btrim(name)) > 0),
  CONSTRAINT chk_projects_dates        CHECK (end_date >= start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_id  ON projects(project_id);
CREATE INDEX        IF NOT EXISTS idx_projects_start_date  ON projects(start_date);
CREATE INDEX        IF NOT EXISTS idx_projects_end_date    ON projects(end_date);
CREATE INDEX        IF NOT EXISTS idx_projects_created_at  ON projects(created_at);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;
DROP POLICY IF EXISTS "authenticated_select_projects" ON projects;
CREATE POLICY "authenticated_select_projects" ON projects FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "authenticated_insert_projects" ON projects;
CREATE POLICY "authenticated_insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "authenticated_update_projects" ON projects;
CREATE POLICY "authenticated_update_projects" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "admin_delete_projects" ON projects;
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ LOOKUPS ============
CREATE TABLE IF NOT EXISTS lookups (
  id    integer PRIMARY KEY DEFAULT 1,
  data  jsonb  NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE lookups ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_select_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_insert_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_update_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_delete_lookups" ON lookups;
DROP POLICY IF EXISTS "authenticated_select_lookups" ON lookups;
CREATE POLICY "authenticated_select_lookups" ON lookups FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "admin_insert_lookups" ON lookups;
CREATE POLICY "admin_insert_lookups" ON lookups FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_update_lookups" ON lookups;
CREATE POLICY "admin_update_lookups" ON lookups FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS "admin_delete_lookups" ON lookups;
CREATE POLICY "admin_delete_lookups" ON lookups FOR DELETE
  TO authenticated USING (public.is_admin());

-- The old frontend-only `app_users` table (if it exists from an older
-- setup) is no longer used — Supabase Auth + profiles replace it.
DROP TABLE IF EXISTS app_users CASCADE;
