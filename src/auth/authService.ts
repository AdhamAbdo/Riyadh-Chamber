import { supabase } from '@/services/supabaseClient';
import { getProfile } from '@/services/userService';
import { buildSession } from './session';
import type { Session } from '@/types';

function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) {
    return 'بيانات الدخول غير صحيحة';
  }
  if (/email not confirmed/i.test(message)) {
    return 'يرجى تأكيد البريد الإلكتروني قبل تسجيل الدخول';
  }
  return 'حدث خطأ أثناء تسجيل الدخول';
}

export async function login(
  email: string,
  password: string,
  // Supabase Auth persists its own (securely refreshed) session; there is
  // no separate "remember me" storage mode to toggle here anymore. The
  // parameter is kept so Login.tsx doesn't need to change its call site.
  remember: boolean = true,
): Promise<Session> {
  void remember;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error ? friendlyAuthError(error.message) : 'بيانات الدخول غير صحيحة');
  }

  const profile = await getProfile(data.user.id);
  if (!profile) {
    await supabase.auth.signOut();
    throw new Error('لا يوجد ملف مستخدم مرتبط بهذا الحساب. يرجى التواصل مع مسؤول النظام.');
  }

  return buildSession(data.session, profile);
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
}

export async function currentSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session || !data.session.user) return null;

  const profile = await getProfile(data.session.user.id);
  if (!profile) return null;

  return buildSession(data.session, profile);
}
