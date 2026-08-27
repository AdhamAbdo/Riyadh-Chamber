/*
# Upgrade schema: UUID PKs + business IDs + proper types + constraints

Upgrades the business tables:
- UUID primary keys (id) with gen_random_uuid() default
- Separate unique business ID columns (task_id, meeting_id, project_id)
- PostgreSQL `date` type for date columns
- PostgreSQL `time` type for meeting time
- Constraints: progress 0-100, end_date >= start_date, non-empty titles

Steps per table:
1. Drop existing text PK constraint
2. Rename `id` to business-id column (task_id/meeting_id/project_id)
3. Add new `id uuid` PK with gen_random_uuid() default
4. Unique index on business-id column
5. Drop text defaults on date/time columns, cast to proper types, set new defaults
6. Add check constraints + indexes

1. Modified Tables: tasks, meetings, projects
2. Security: RLS policies unchanged (anon+authenticated, USING true)
*/

-- ============ TASKS ============
ALTER TABLE tasks DROP CONSTRAINT tasks_pkey;
ALTER TABLE tasks RENAME COLUMN id TO task_id;
ALTER TABLE tasks ALTER COLUMN task_id SET NOT NULL;
ALTER TABLE tasks ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_task_id ON tasks(task_id);

ALTER TABLE tasks ALTER COLUMN date DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN date TYPE date USING date::date;
ALTER TABLE tasks ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE tasks ADD CONSTRAINT chk_tasks_progress CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_title_notempty CHECK (length(btrim(title)) > 0);
ALTER TABLE tasks ADD CONSTRAINT chk_tasks_department_notempty CHECK (length(btrim(department)) > 0);
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);

-- ============ MEETINGS ============
ALTER TABLE meetings DROP CONSTRAINT meetings_pkey;
ALTER TABLE meetings RENAME COLUMN id TO meeting_id;
ALTER TABLE meetings ALTER COLUMN meeting_id SET NOT NULL;
ALTER TABLE meetings ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_meetings_meeting_id ON meetings(meeting_id);

ALTER TABLE meetings ALTER COLUMN date DROP DEFAULT;
ALTER TABLE meetings ALTER COLUMN date TYPE date USING date::date;
ALTER TABLE meetings ALTER COLUMN date SET DEFAULT CURRENT_DATE;

ALTER TABLE meetings ALTER COLUMN time DROP DEFAULT;
ALTER TABLE meetings ALTER COLUMN time TYPE time USING time::time;

ALTER TABLE meetings ADD CONSTRAINT chk_meetings_title_notempty CHECK (length(btrim(title)) > 0);
CREATE INDEX IF NOT EXISTS idx_meetings_date ON meetings(date);
CREATE INDEX IF NOT EXISTS idx_meetings_created_at ON meetings(created_at);

-- ============ PROJECTS ============
ALTER TABLE projects DROP CONSTRAINT projects_pkey;
ALTER TABLE projects RENAME COLUMN id TO project_id;
ALTER TABLE projects ALTER COLUMN project_id SET NOT NULL;
ALTER TABLE projects ADD COLUMN id uuid PRIMARY KEY DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_project_id ON projects(project_id);

ALTER TABLE projects ALTER COLUMN start_date DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN start_date TYPE date USING start_date::date;
ALTER TABLE projects ALTER COLUMN start_date SET DEFAULT CURRENT_DATE;

ALTER TABLE projects ALTER COLUMN end_date DROP DEFAULT;
ALTER TABLE projects ALTER COLUMN end_date TYPE date USING end_date::date;
ALTER TABLE projects ALTER COLUMN end_date SET DEFAULT CURRENT_DATE;

ALTER TABLE projects ADD CONSTRAINT chk_projects_progress CHECK (progress >= 0 AND progress <= 100);
ALTER TABLE projects ADD CONSTRAINT chk_projects_name_notempty CHECK (length(btrim(name)) > 0);
ALTER TABLE projects ADD CONSTRAINT chk_projects_dates CHECK (end_date >= start_date);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
