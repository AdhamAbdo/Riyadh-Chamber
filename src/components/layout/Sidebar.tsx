import { classNames } from '@/utils/id';
import type { PageKey } from '@/types';
import {
  LayoutDashboard,
  ClipboardList,
  CalendarDays,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FileText,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import type { Session } from '@/types';

interface SidebarProps {
  current: PageKey;
  onNavigate: (page: PageKey) => void;
  session: Session;
  onLogout: () => void;
  open: boolean;
  onClose: () => void;
}

const NAV: { key: PageKey; label: string; icon: React.ReactNode }[] = [
  { key: 'dashboard', label: 'لوحة المعلومات', icon: <LayoutDashboard className="w-5 h-5" /> },
  { key: 'tasks', label: 'المهام', icon: <ClipboardList className="w-5 h-5" /> },
  { key: 'meetings', label: 'الاجتماعات', icon: <CalendarDays className="w-5 h-5" /> },
  { key: 'projects', label: 'المشاريع', icon: <BriefcaseBusiness className="w-5 h-5" /> },
  { key: 'analytics', label: 'التحليلات', icon: <ChartNoAxesCombined className="w-5 h-5" /> },
  { key: 'reports', label: 'التقارير', icon: <FileText className="w-5 h-5" /> },
  { key: 'settings', label: 'الإعدادات', icon: <Settings className="w-5 h-5" /> },
];

export function Sidebar({ current, onNavigate, session, onLogout, open, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-sm lg:hidden no-print"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={classNames(
          'fixed inset-y-0 right-0 z-40 flex w-64 flex-col border-l border-slate-200 bg-white transition-transform duration-300 dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 no-print',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="شعار غرفة الرياض" className="h-10 w-10" />
            <div>
              <p className="text-sm font-bold text-brand-800 dark:text-brand-300">غرفة الرياض</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">الإدارة التنفيذية لدعم الأعمال</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="إغلاق القائمة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {NAV.map((item) => (
              <li key={item.key}>
                <button
                  onClick={() => {
                    onNavigate(item.key);
                    onClose();
                  }}
                  className={classNames(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    current === item.key
                      ? 'bg-brand-800 text-white shadow-card'
                      : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                  )}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* User */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{session.name}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{session.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <LogOut className="w-5 h-5" />
            تسجيل الخروج
          </button>
        </div>
      </aside>
    </>
  );
}
