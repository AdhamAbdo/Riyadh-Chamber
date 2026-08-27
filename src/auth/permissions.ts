import type { UserRole, PageKey } from '@/types';

// Centralized permission matrix. Edit here to change what each role can do.
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
  'settings.backup',
];

const MATRIX: Record<UserRole, Permission[]> = {
  'مدير': ADMIN_PERMS,
  'مستخدم': USER_PERMS,
};

export function can(role: UserRole | undefined, perm: Permission): boolean {
  if (!role) return false;
  return MATRIX[role]?.includes(perm) ?? false;
}

// Pages accessible to each role. Both roles can access all pages; the
// difference is in actions (delete, reset) gated by `can()`.
export const PAGE_ACCESS: Record<PageKey, UserRole[]> = {
  dashboard: ['مدير', 'مستخدم'],
  tasks: ['مدير', 'مستخدم'],
  meetings: ['مدير', 'مستخدم'],
  projects: ['مدير', 'مستخدم'],
  analytics: ['مدير', 'مستخدم'],
  reports: ['مدير', 'مستخدم'],
  settings: ['مدير', 'مستخدم'],
};
