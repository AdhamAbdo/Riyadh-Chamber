import { supabase } from './supabaseClient';
import type { Task } from '@/types';

interface TaskRow {
  id: string;
  task_id: string;
  department: string;
  title: string;
  description: string;
  type: string;
  date: string;
  progress: number;
  status: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

function mapRow(row: TaskRow): Task {
  return {
    id: row.task_id,
    department: row.department ?? '',
    title: row.title ?? '',
    description: row.description ?? '',
    type: row.type as Task['type'],
    date: row.date ?? '',
    progress: Number(row.progress) || 0,
    status: row.status as Task['status'],
    notes: row.notes ?? '',
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  };
}

export async function getAllTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[taskService] getAllTasks:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return (data as TaskRow[]).map(mapRow);
}

export async function getTask(id: string): Promise<Task | undefined> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('task_id', id)
    .maybeSingle();
  if (error) {
    console.error('[taskService] getTask:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return data ? mapRow(data as TaskRow) : undefined;
}

async function generateTaskId(): Promise<string> {
  const { data, error } = await supabase
    .from('tasks')
    .select('task_id')
    .order('task_id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return 'TASK-00001';
  const last = (data as { task_id: string }).task_id;
  const num = parseInt(last.replace('TASK-', ''), 10) || 0;
  return `TASK-${String(num + 1).padStart(5, '0')}`;
}

export async function createTask(
  task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Task> {
  const taskId = await generateTaskId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      task_id: taskId,
      department: task.department,
      title: task.title,
      description: task.description,
      type: task.type,
      date: task.date,
      progress: task.progress,
      status: task.status,
      notes: task.notes,
      created_at: now,
      updated_at: now,
    })
    .select('*')
    .single();
  if (error) {
    console.error('[taskService] createTask:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as TaskRow);
}

export async function updateTask(id: string, patch: Partial<Task>): Promise<Task> {
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.department !== undefined) update.department = patch.department;
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.description !== undefined) update.description = patch.description;
  if (patch.type !== undefined) update.type = patch.type;
  if (patch.date !== undefined) update.date = patch.date;
  if (patch.progress !== undefined) update.progress = patch.progress;
  if (patch.status !== undefined) update.status = patch.status;
  if (patch.notes !== undefined) update.notes = patch.notes;

  const { data, error } = await supabase
    .from('tasks')
    .update(update)
    .eq('task_id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[taskService] updateTask:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as TaskRow);
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('task_id', id);
  if (error) {
    console.error('[taskService] deleteTask:', error);
    throw new Error('حدث خطأ أثناء حذف البيانات.');
  }
}
