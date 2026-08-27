import { supabase } from './supabaseClient';
import type { User } from '@/types';

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

function mapRow(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as User['role'],
    createdAt: row.created_at,
  };
}

/** Fetch the `profiles` row for a given auth user id (Supabase Auth user.id). */
export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('[userService] getProfile:', error);
    throw new Error('حدث خطأ أثناء تحميل بيانات المستخدم.');
  }
  return data ? mapRow(data as ProfileRow) : null;
}

/** Admin-only: list all user profiles (enforced by RLS, not just here). */
export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[userService] getAllUsers:', error);
    throw new Error('حدث خطأ أثناء تحميل البيانات.');
  }
  return (data as ProfileRow[]).map(mapRow);
}

export async function updateUser(id: string, patch: Partial<User>): Promise<User> {
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.role !== undefined) update.role = patch.role;

  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();
  if (error) {
    console.error('[userService] updateUser:', error);
    throw new Error('حدث خطأ أثناء حفظ البيانات.');
  }
  return mapRow(data as ProfileRow);
}
