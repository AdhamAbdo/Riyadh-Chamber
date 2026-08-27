import type { UserRole, PageKey } from '@/types';

// ============================================================
// Permission Types
// ============================================================

export type Permission =
  | 'task.create'
  | 'task.edit'
  | 'task.delete'
  | 'meeting.create'
  | 'meeting.edit'
  | 'meeting.delete'
  | 'project.create'
  | 'project.edit'
  | 'project.delete'
  | 'analytics.view'
  | 'reports.view'
  | 'report.export'
  | 'excel.export'
  | 'pdf.export'
  | 'print'
  | 'settings.view'
  | 'settings.resetData'
  | 'settings.backup'
  | 'settings.restore';


// ============================================================
// ADMIN PERMISSIONS
// ============================================================

const ADMIN_PERMS: Permission[] = [
  'task.create',
  'task.edit',
  'task.delete',

  'meeting.create',
  'meeting.edit',
  'meeting.delete',

  'project.create',
  'project.edit',
  'project.delete',

  'analytics.view',

  'reports.view',
  'report.export',

  'excel.export',
  'pdf.export',
  'print',

  'settings.view',
  'settings.resetData',
  'settings.backup',
  'settings.restore',
];


// ============================================================
// USER PERMISSIONS
// ============================================================

const USER_PERMS: Permission[] = [
  'task.create',
  'task.edit',

  'meeting.create',
  'meeting.edit',

  'project.create',
  'project.edit',

  'analytics.view',

  'reports.view',
  'report.export',

  'excel.export',
  'pdf.export',
  'print',

  'settings.view',
];


// ============================================================
// ROLE → PERMISSIONS MATRIX
// ============================================================

const MATRIX: Record<UserRole, Permission[]> = {
  'مدير': ADMIN_PERMS,
  'مستخدم': USER_PERMS,
};


// ============================================================
// PERMISSION CHECK
// ============================================================

export function can(
  role: UserRole | undefined,
  perm: Permission
): boolean {
  if (!role) return false;

  return MATRIX[role]?.includes(perm) ?? false;
}


// ============================================================
// PAGE ACCESS
// ============================================================

export const PAGE_ACCESS: Record<PageKey, UserRole[]> = {
  dashboard: ['مدير', 'مستخدم'],
  tasks: ['مدير', 'مستخدم'],
  meetings: ['مدير', 'مستخدم'],
  projects: ['مدير', 'مستخدم'],
  analytics: ['مدير', 'مستخدم'],
  reports: ['مدير', 'مستخدم'],
  settings: ['مدير', 'مستخدم'],
};
