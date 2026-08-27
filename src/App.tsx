import { useState, useEffect, useMemo, Component, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Session, PageKey, Settings } from '@/types';
import { currentSession, logout } from '@/auth/authService';
import { useTheme } from '@/hooks/useTheme';
import { useData } from '@/hooks/useData';
import { ToastProvider, useToast } from '@/hooks/useToast';
import { MainLayout } from '@/components/layout/MainLayout';
import { Login } from '@/pages/Login';
import { Dashboard } from '@/pages/Dashboard';
import { Tasks } from '@/pages/Tasks';
import { Meetings } from '@/pages/Meetings';
import { Projects } from '@/pages/Projects';
import { Analytics } from '@/pages/Analytics';
import { Reports } from '@/pages/Reports';
import { SettingsPage } from '@/pages/Settings';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: unknown) { console.error('App error:', error); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-4 dark:bg-slate-950">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">حدث خطأ غير متوقع</h1>
          <button onClick={() => window.location.reload()} className="btn-primary">إعادة المحاولة</button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { settings, setTheme } = useTheme();
  const { toast } = useToast();
  const [session, setSession] = useState<Session | null>(null);
  const [bootReady, setBootReady] = useState(false);
  const [page, setPage] = useState<PageKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const data = useData();

  useEffect(() => {
    (async () => {
      try {
        const s = await currentSession();
        setSession(s);
      } catch (e) {
        console.error('Boot error:', e);
      } finally {
        setBootReady(true);
      }
    })();
  }, []);

  const handleLogin = (s: Session) => {
    setSession(s);
    setPage('dashboard');
  };

  const handleLogout = async () => {
    await logout();
    setSession(null);
    setSearchQuery('');
    toast('تم تسجيل الخروج بنجاح', 'info');
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await data.refresh();
    setRefreshing(false);
    toast('تم تحديث البيانات بنجاح', 'info');
  };

  // Global search across tasks, meetings, projects
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const results: { type: string; label: string; page: PageKey }[] = [];
    for (const t of data.tasks) {
      if (`${t.title} ${t.description} ${t.department}`.toLowerCase().includes(q)) {
        results.push({ type: 'مهمة', label: t.title, page: 'tasks' });
      }
    }
    for (const m of data.meetings) {
      if (`${m.title} ${m.notes}`.toLowerCase().includes(q)) {
        results.push({ type: 'اجتماع', label: m.title, page: 'meetings' });
      }
    }
    for (const p of data.projects) {
      if (`${p.name} ${p.description} ${p.department}`.toLowerCase().includes(q)) {
        results.push({ type: 'مشروع', label: p.name, page: 'projects' });
      }
    }
    return results.slice(0, 10);
  }, [searchQuery, data.tasks, data.meetings, data.projects]);

  if (!bootReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600 dark:border-slate-700 dark:border-t-brand-400" />
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} rememberDefault={settings.rememberMe} />;
  }

  return (
    <MainLayout
      session={session}
      settings={settings}
      current={page}
      onNavigate={setPage}
      onLogout={handleLogout}
      onSetTheme={setTheme}
      onRefresh={handleRefresh}
      refreshing={refreshing}
      searchQuery={searchQuery}
      onSearch={setSearchQuery}
      searchResults={searchResults}
    >
      {page === 'dashboard' && <Dashboard tasks={data.tasks} meetings={data.meetings} projects={data.projects} loading={data.loading} onNavigate={setPage} />}
      {page === 'tasks' && <Tasks tasks={data.tasks} lookups={data.lookups} loading={data.loading} role={session.role} onRefresh={data.refresh} />}
      {page === 'meetings' && <Meetings meetings={data.meetings} lookups={data.lookups} loading={data.loading} role={session.role} onRefresh={data.refresh} />}
      {page === 'projects' && <Projects projects={data.projects} lookups={data.lookups} loading={data.loading} role={session.role} onRefresh={data.refresh} />}
      {page === 'analytics' && <Analytics tasks={data.tasks} meetings={data.meetings} projects={data.projects} lookups={data.lookups} />}
      {page === 'reports' && <Reports tasks={data.tasks} meetings={data.meetings} projects={data.projects} lookups={data.lookups} role={session.role} />}
      {page === 'settings' && <SettingsPage session={session} settings={settings} onSetTheme={setTheme} tasks={data.tasks} meetings={data.meetings} projects={data.projects} onRefresh={data.refresh} />}
    </MainLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}
