```typescript
import type { UserRole, PageKey } from '@/types';

// ============================================================
// Permission Matrix
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
// BOTH ROLES HAVE THE SAME PERMISSIONS
// ============================================================

const ALL_PERMS: Permission[] = [
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
// ROLE MATRIX
// ============================================================

const MATRIX: Record<UserRole, Permission[]> = {
  'مدير': ALL_PERMS,
  'مستخدم': ALL_PERMS,
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
```
