import { supabase } from './supabaseClient';
import type { Project } from '@/types';

interface ProjectRow {
  id: string;
  project_id: string;
  department: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  type: string;
  status: string;
  progress: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: ProjectRow): Project {
  return {
    id: row.project_id,
    department: row.department ?? '',
    name: row.name ?? '',
    description: row.description ?? '',
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    type: row.type as Project['type'],
    status: row.status as Project['status'],
    progress: Number(row.progress) || 0,
    notes: row.notes ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[projectService] getAllProjects:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return (data as ProjectRow[]).map(mapRow);
}

export async function getProject(id: string): Promise<Project | undefined> {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('project_id', id)
    .maybeSingle();
  if (error) {
    console.error('[projectService] getProject:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return data ? mapRow(data as ProjectRow) : undefined;
}

async function generateProjectId(): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .select('project_id')
    .order('project_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 'PROJ-00001';
  const last = (data as { project_id: string }).project_id;
  const num = parseInt(last.replace('PROJ-', ''), 10) || 0;
  return `PROJ-${String(num + 1).padStart(5, '0')}`;
}

export async function createProject(
  project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Project> {
  const projectId = await generateProjectId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('projects')
    .insert({
      project_id: projectId,
      department: project.department,
      name: project.name,
      description: project.description,
      start_date: project.startDate,
      end_date: project.endDate,
      type: project.type,
      status: project.status,
      progress: project.progress,
      notes: project.notes,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[projectService] createProject:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as ProjectRow);
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<Project> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.department !== undefined) update.department = patch.department;
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.endDate !== undefined) update.end_date = patch.endDate;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.progress !== undefined) update.progress = patch.progress;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { data, error } = await supabase
    .from('projects')
    .update(update)
    .eq('project_id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[projectService] updateProject:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as ProjectRow);
}

export async function deleteProject(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('project_id', id);
  if (error) {
    console.error('[projectService] deleteProject:', error);
    throw new Error('حدث خطأ أثناء حذف البيانات.');
  }
}

export function isProjectDelayed(p: Project, today = new Date()): boolean {
  if (p.status === 'مكتملة' || p.progress >= 100) return false;
  const end = new Date(p.endDate + 'T23:59:59');
  return end < today;
}
