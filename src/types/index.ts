// ===== Core domain types =====

export type UserRole = 'مدير' | 'مستخدم';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export type TaskStatus = 'مكتملة' | 'قيد التنفيذ' | 'مغلقة';
export type TaskType = 'داخلي' | 'خارجي';

export interface Task {
  id: string; // TASK-00001
  department: string;
  title: string;
  description: string;
  type: TaskType;
  date: string; // YYYY-MM-DD
  progress: number; // 0-100
  status: TaskStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MeetingType = 'حضوري' | 'عن بعد';
export type MeetingClassification = 'داخلي' | 'خارجي' | 'إداري';

export interface Meeting {
  id: string; // MEET-00001
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type: MeetingType;
  classification: MeetingClassification;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectType = 'مبادرة' | 'برنامج' | 'مشروع' | 'شراكة';
export type ProjectStatus = 'لم تبدأ' | 'قيد التنفيذ' | 'مكتملة';

export interface Project {
  id: string; // PROJ-00001
  department: string;
  name: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type: ProjectType;
  status: ProjectStatus;
  progress: number; // 0-100
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface LookupCategory {
  departments: string[];
  taskTypes: TaskType[];
  taskStatuses: TaskStatus[];
  meetingTypes: MeetingType[];
  meetingClassifications: MeetingClassification[];
  projectTypes: ProjectType[];
  projectStatuses: ProjectStatus[];
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  rememberMe: boolean;
}

export interface Session {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  expiresAt: number; // epoch ms
}

export type PageKey =
  | 'dashboard'
  | 'tasks'
  | 'meetings'
  | 'projects'
  | 'analytics'
  | 'reports'
  | 'settings';

// ===== Backup payload =====
export interface BackupPayload {
  version: number;
  exportedAt: string;
  users: User[];
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  lookups: LookupCategory;
  settings: Settings;
}
