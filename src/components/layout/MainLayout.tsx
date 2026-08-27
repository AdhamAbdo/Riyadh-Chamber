import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { PageKey, Session, Settings } from '@/types';

interface MainLayoutProps {
  session: Session;
  settings: Settings;
  current: PageKey;
  onNavigate: (p: PageKey) => void;
  onLogout: () => void;
  onSetTheme: (t: Settings['theme']) => void;
  onRefresh: () => void;
  refreshing: boolean;
  searchQuery: string;
  onSearch: (q: string) => void;
  searchResults: { type: string; label: string; page: PageKey }[];
  children: ReactNode;
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

export function MainLayout({
  session,
  settings,
  current,
  onNavigate,
  onLogout,
  onSetTheme,
  onRefresh,
  refreshing,
  searchQuery,
  onSearch,
  searchResults,
  children,
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        current={current}
        onNavigate={onNavigate}
        session={session}
        onLogout={onLogout}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="lg:pr-64">
        <Header
          title={PAGE_TITLES[current]}
          session={session}
          settings={settings}
          onMenuClick={() => setSidebarOpen(true)}
          onRefresh={onRefresh}
          onSetTheme={onSetTheme}
          onNavigate={onNavigate}
          onLogout={onLogout}
          searchQuery={searchQuery}
          onSearch={onSearch}
          searchResults={searchResults}
          refreshing={refreshing}
        />
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
