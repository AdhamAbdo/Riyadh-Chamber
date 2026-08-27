import { useState, useRef, useEffect } from 'react';
import {
  Menu,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Search,
  ChevronDown,
  LogOut,
  Settings as SettingsIcon,
  User as UserIcon,
} from 'lucide-react';
import type { PageKey, Session, Settings } from '@/types';
import { classNames } from '@/utils/id';

interface HeaderProps {
  title: string;
  session: Session;
  settings: Settings;
  onMenuClick: () => void;
  onRefresh: () => void;
  onSetTheme: (t: Settings['theme']) => void;
  onNavigate: (p: PageKey) => void;
  onLogout: () => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  searchResults: { type: string; label: string; page: PageKey }[];
  refreshing: boolean;
}

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: 'لوحة المعلومات',
  tasks: 'المهام',
  meetings: 'الاجتماعات',
  projects: 'المشاريع',
  analytics: 'التحليلات',
  reports: 'التقارير',
  settings: 'الإعدادات',
};

export function Header({
  title,
  session,
  settings,
  onMenuClick,
  onRefresh,
  onSetTheme,
  onNavigate,
  onLogout,
  searchQuery,
  onSearch,
  searchResults,
  refreshing,
}: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const themeIcon =
    settings.theme === 'light' ? <Sun className="w-4 h-4" /> : settings.theme === 'dark' ? <Moon className="w-4 h-4" /> : <Monitor className="w-4 h-4" />;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80 no-print">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
        aria-label="فتح القائمة"
      >
        <Menu className="w-5 h-5" />
      </button>

      <h1 className="text-base font-bold text-slate-800 dark:text-slate-100 sm:text-lg">{title}</h1>

      {/* Search */}
      <div ref={searchRef} className="relative mx-auto w-full max-w-md">
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              onSearch(e.target.value);
              setSearchOpen(true);
            }}
            onFocus={() => setSearchOpen(true)}
            placeholder="بحث عام في المهام والاجتماعات والمشاريع..."
            className="input !py-1.5 pr-9 text-sm"
            aria-label="بحث عام"
          />
        </div>
        {searchOpen && searchQuery.trim() && searchResults.length > 0 && (
          <div className="absolute mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
            {searchResults.slice(0, 8).map((r, i) => (
              <button
                key={i}
                onClick={() => {
                  onNavigate(r.page);
                  setSearchOpen(false);
                  onSearch('');
                }}
                className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-right text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="text-slate-700 dark:text-slate-200">{r.label}</span>
                <span className="text-xs text-slate-400">{r.type}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onRefresh}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="تحديث البيانات"
          title="تحديث البيانات"
        >
          <RefreshCw className={classNames('w-4 h-4', refreshing && 'animate-spin')} />
        </button>

        {/* Theme cycle */}
        <button
          onClick={() => {
            const order: Settings['theme'][] = ['light', 'dark', 'system'];
            const next = order[(order.indexOf(settings.theme) + 1) % order.length];
            onSetTheme(next);
          }}
          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="تبديل المظهر"
          title={`المظهر: ${settings.theme === 'light' ? 'فاتح' : settings.theme === 'dark' ? 'داكن' : 'النظام'}`}
        >
          {themeIcon}
        </button>

        {/* Profile */}
        <div ref={profileRef} className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="ملف المستخدم"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-800 text-xs font-bold text-white">
              {session.name.charAt(0)}
            </div>
            <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
          </button>
          {profileOpen && (
            <div className="absolute left-0 mt-2 w-56 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-card-hover dark:border-slate-700 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{session.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{session.email}</p>
                <span className="mt-1 inline-block badge bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  {session.role}
                </span>
              </div>
              <button
                onClick={() => {
                  onNavigate('settings');
                  setProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <SettingsIcon className="h-4 w-4" />
                الإعدادات
              </button>
              <button
                onClick={onLogout}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                تسجيل الخروج
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export { PAGE_TITLES };
export type { PageKey };
// silence unused import warning for UserIcon in some builds
void UserIcon;
