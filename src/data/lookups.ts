import type { LookupCategory } from '@/types';

// Centralized lookup values. Edit here to change dropdown options app-wide.
export const DEFAULT_LOOKUPS: LookupCategory = {
  departments: [
    'إدارة البيانات',
    'إدارة المتابعة والتمكين',
    'إدارة اللجان القطاعية',
    'إدارة التعاون الدولي',
    'مكتب الأمين العام',
    'مكتب نائب الأمين العام',
    'المنشآت العائلية',
    'إدارة أخرى',
  ],
  taskTypes: ['داخلي', 'خارجي'],
  taskStatuses: ['مكتملة', 'قيد التنفيذ', 'مغلقة'],
  meetingTypes: ['حضوري', 'عن بعد'],
  meetingClassifications: ['داخلي', 'خارجي', 'إداري'],
  projectTypes: ['مبادرة', 'برنامج', 'مشروع', 'شراكة'],
  projectStatuses: ['لم تبدأ', 'قيد التنفيذ', 'مكتملة'],
};
