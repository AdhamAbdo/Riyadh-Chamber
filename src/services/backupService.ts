import type { BackupPayload, Task, Meeting, Project, LookupCategory, Settings } from '@/types';
import { DEFAULT_LOOKUPS } from '@/data/lookups';
import { supabase } from './supabaseClient';

// ===== Backup/Restore =====
//
// Export builds a JSON file from the in-memory data already loaded by useData.
// Import pushes records back to Supabase tables, replacing existing data.

export function buildBackup(
  settings: Settings,
  tasks: Task[],
  meetings: Meeting[],
  projects: Project[],
  lookups: LookupCategory,
): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    users: [],
    tasks,
    meetings,
    projects,
    lookups,
    settings,
  };
}

export function downloadJson(payload: BackupPayload, filename: string): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function validateBackup(data: unknown): data is BackupPayload {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.version === 'number' &&
    Array.isArray(d.tasks) &&
    Array.isArray(d.meetings) &&
    Array.isArray(d.projects) &&
    typeof d.lookups === 'object' &&
    d.lookups !== null
  );
}

export async function importBackup(payload: BackupPayload): Promise<void> {
  const lookups = payload.lookups ?? DEFAULT_LOOKUPS;

  await supabase.from('tasks').delete().neq('task_id', '');
  await supabase.from('meetings').delete().neq('meeting_id', '');
  await supabase.from('projects').delete().neq('project_id', '');

  if (payload.tasks.length > 0) {
    const rows = payload.tasks.map((t) => ({
      task_id: t.id,
      department: t.department,
      title: t.title,
      description: t.description,
      type: t.type,
      date: t.date,
      progress: t.progress,
      status: t.status,
      notes: t.notes,
      created_at: t.createdAt || new Date().toISOString(),
      updated_at: t.updatedAt || new Date().toISOString(),
    }));
    const { error: e1 } = await supabase.from('tasks').insert(rows);
    if (e1) {
      console.error('[backupService] import tasks:', e1);
      throw new Error('حدث خطأ أثناء الاستيراد.');
    }
  }

  if (payload.meetings.length > 0) {
    const rows = payload.meetings.map((m) => ({
      meeting_id: m.id,
      title: m.title,
      date: m.date,
      time: m.time,
      type: m.type,
      classification: m.classification,
      notes: m.notes,
      created_at: m.createdAt || new Date().toISOString(),
      updated_at: m.updatedAt || new Date().toISOString(),
    }));
    const { error: e2 } = await supabase.from('meetings').insert(rows);
    if (e2) {
      console.error('[backupService] import meetings:', e2);
      throw new Error('حدث خطأ أثناء الاستيراد.');
    }
  }

  if (payload.projects.length > 0) {
    const rows = payload.projects.map((p) => ({
      project_id: p.id,
      department: p.department,
      name: p.name,
      description: p.description,
      start_date: p.startDate,
      end_date: p.endDate,
      type: p.type,
      status: p.status,
      progress: p.progress,
      notes: p.notes,
      created_at: p.createdAt || new Date().toISOString(),
      updated_at: p.updatedAt || new Date().toISOString(),
    }));
    const { error: e3 } = await supabase.from('projects').insert(rows);
    if (e3) {
      console.error('[backupService] import projects:', e3);
      throw new Error('حدث خطأ أثناء الاستيراد.');
    }
  }

  const { error: e4 } = await supabase
    .from('lookups')
    .upsert({ id: 1, data: lookups });
  if (e4) {
    console.error('[backupService] import lookups:', e4);
    throw new Error('حدث خطأ أثناء الاستيراد.');
  }
}
