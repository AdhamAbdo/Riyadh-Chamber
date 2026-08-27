/*
# Migrate authentication to real Supabase Auth + enforce RLS by role

Replaces the previous frontend-only "app_users" login (password hashes
readable by anyone with the anon key, no real access control) with real
Supabase Auth, backed by a `profiles` table and enforced by RLS.

1. New Tables
- `profiles` — one row per Supabase Auth user (id references auth.users).
  Holds display name, email (denormalized for convenience) and role
  ('مدير' | 'مستخدم'). Auto-created by a trigger on auth.users insert.

2. New Functions
- `public.is_admin()` — SECURITY DEFINER helper, true when the current
  auth.uid() has role = 'مدير' in profiles. Used by RLS policies.
- `public.handle_new_user()` — trigger function that inserts a `profiles`
  row whenever a new Supabase Auth user is created, reading name/role from
  the user's metadata (falls back to role = 'مستخدم').

3. Security changes
- RLS enabled on `profiles`.
  - Any authenticated user can read their own profile; admins can read all.
  - Users can update their own name; only admins can change a role
    (enforced by a BEFORE UPDATE trigger, not just a policy).
  - Only admins can insert/delete profiles directly (normal creation goes
    through the auth trigger).
- `tasks`, `meetings`, `projects`, `lookups`: the old `anon`-inclusive,
  unconditionally-true policies are dropped and replaced with
  `authenticated`-only policies:
  - SELECT / INSERT / UPDATE: any authenticated user (matches the existing
    app permission matrix, where both roles can create/edit).
  - DELETE: admins only (matches `task.delete` / `meeting.delete` /
    `project.delete` / lookups management being admin-only in
    src/auth/permissions.ts).
- `app_users` (the old frontend-only login table with exposed password
  hashes) is dropped — it is no longer used by the application.

4. Notes
- This migration does NOT create any Supabase Auth users itself (that
  requires the Auth Admin API / Dashboard, not plain SQL). See the app
  README / migration guide for how to create the two demo accounts.
*/

-- ============ PROFILES ============

CREATE TABLE IF NOT EXISTS profiles (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL DEFAULT '',
  email      text        NOT NULL,
  role       text        NOT NULL DEFAULT 'مستخدم' CHECK (role IN ('مدير', 'مستخدم')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Helper: is the current user an admin? SECURITY DEFINER so it can read
-- `profiles` without recursing through the RLS policies that call it.
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

-- Auto-create a profile row whenever a Supabase Auth user is created.
-- Name/role can be supplied via the user's metadata at creation time
-- (e.g. { "name": "...", "role": "مدير" }); role defaults to 'مستخدم'.
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

-- Prevent a non-admin from granting themselves the admin role via the
-- self-update policy below.
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

-- ============ TASKS: authenticated-only, admin-only delete ============

DROP POLICY IF EXISTS "anon_select_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_insert_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_update_tasks" ON tasks;
DROP POLICY IF EXISTS "anon_delete_tasks" ON tasks;

CREATE POLICY "authenticated_select_tasks" ON tasks FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "authenticated_insert_tasks" ON tasks FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_tasks" ON tasks FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_tasks" ON tasks FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ MEETINGS: authenticated-only, admin-only delete ============

DROP POLICY IF EXISTS "anon_select_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_insert_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_update_meetings" ON meetings;
DROP POLICY IF EXISTS "anon_delete_meetings" ON meetings;

CREATE POLICY "authenticated_select_meetings" ON meetings FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "authenticated_insert_meetings" ON meetings FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_meetings" ON meetings FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_meetings" ON meetings FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ PROJECTS: authenticated-only, admin-only delete ============

DROP POLICY IF EXISTS "anon_select_projects" ON projects;
DROP POLICY IF EXISTS "anon_insert_projects" ON projects;
DROP POLICY IF EXISTS "anon_update_projects" ON projects;
DROP POLICY IF EXISTS "anon_delete_projects" ON projects;

CREATE POLICY "authenticated_select_projects" ON projects FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "authenticated_insert_projects" ON projects FOR INSERT
  TO authenticated WITH CHECK (true);
CREATE POLICY "authenticated_update_projects" ON projects FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "admin_delete_projects" ON projects FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ LOOKUPS: everyone reads, only admins manage ============

DROP POLICY IF EXISTS "anon_select_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_insert_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_update_lookups" ON lookups;
DROP POLICY IF EXISTS "anon_delete_lookups" ON lookups;

CREATE POLICY "authenticated_select_lookups" ON lookups FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "admin_insert_lookups" ON lookups FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "admin_update_lookups" ON lookups FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "admin_delete_lookups" ON lookups FOR DELETE
  TO authenticated USING (public.is_admin());

-- ============ DROP the old frontend-only auth table ============
-- Password hashes were readable by anyone with the anon key. No longer
-- used now that Supabase Auth + profiles handle authentication.

DROP TABLE IF EXISTS app_users CASCADE;
