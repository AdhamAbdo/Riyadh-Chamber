import { useMemo } from 'react';
import {
  ClipboardList,
  CheckCircle2,
  PlayCircle,
  CircleSlash,
  CalendarDays,
  Video,
  BriefcaseBusiness,
  Clock,
  TrendingUp,
  ArrowLeft,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { Task, Meeting, Project, PageKey } from '@/types';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { SkeletonCard } from '@/components/ui/LoadingState';
import { formatArabicDate, isPast, isToday, isTomorrow, isUpcoming } from '@/utils/date';
import { isProjectDelayed } from '@/services/projectService';

interface DashboardProps {
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  loading: boolean;
  onNavigate: (p: PageKey) => void;
}

const STATUS_COLORS: Record<string, string> = {
  مكتملة: '#16a34a',
  'قيد التنفيذ': '#ea580c',
  مغلقة: '#64748b',
  'لم تبدأ': '#94a3b8',
};

const MEETING_COLORS: Record<string, string> = {
  داخلي: '#0F4C81',
  خارجي: '#D4A017',
  إداري: '#64748b',
};

export function Dashboard({ tasks, meetings, projects, loading, onNavigate }: DashboardProps) {
  const stats = useMemo(() => {
    const tasksCompleted = tasks.filter((t) => t.status === 'مكتملة').length;
    const tasksInProgress = tasks.filter((t) => t.status === 'قيد التنفيذ').length;
    const tasksClosed = tasks.filter((t) => t.status === 'مغلقة').length;
    const meetingsInPerson = meetings.filter((m) => m.type === 'حضوري').length;
    const meetingsRemote = meetings.filter((m) => m.type === 'عن بعد').length;
    const projectsNotStarted = projects.filter((p) => p.status === 'لم تبدأ').length;
    const projectsInProgress = projects.filter((p) => p.status === 'قيد التنفيذ').length;
    const projectsCompleted = projects.filter((p) => p.status === 'مكتملة').length;
    const overallProgress =
      tasks.length + projects.length > 0
        ? Math.round(
            (tasks.reduce((s, t) => s + t.progress, 0) +
              projects.reduce((s, p) => s + p.progress, 0)) /
              (tasks.length + projects.length),
          )
        : 0;

    return {
      tasksCompleted,
      tasksInProgress,
      tasksClosed,
      meetingsInPerson,
      meetingsRemote,
      projectsNotStarted,
      projectsInProgress,
      projectsCompleted,
      overallProgress,
    };
  }, [tasks, meetings, projects]);

  const tasksByDept = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.department, (map.get(t.department) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [tasks]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) map.set(t.status, (map.get(t.status) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [tasks]);

  const projectsProgress = useMemo(
    () =>
      projects
        .map((p) => ({ name: p.name, value: p.progress }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [projects],
  );

  const meetingsByClass = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of meetings) map.set(m.classification, (map.get(m.classification) ?? 0) + 1);
    return Array.from(map, ([name, value]) => ({ name, value }));
  }, [meetings]);

  const recentTasks = useMemo(
    () => [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [tasks],
  );

  const upcomingMeetings = useMemo(
    () =>
      meetings
        .filter((m) => isUpcoming(m.date))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 5),
    [meetings],
  );

  const topProjects = useMemo(
    () => [...projects].sort((a, b) => b.progress - a.progress).slice(0, 5),
    [projects],
  );

  const delayedTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'مكتملة' && t.status !== 'مغلقة' && isPast(t.date)),
    [tasks],
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall progress banner */}
      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-brand-100 p-3 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 dark:text-slate-400">نسبة الإنجاز العامة</p>
            <p className="text-3xl font-bold text-brand-800 dark:text-brand-300">{stats.overallProgress}%</p>
          </div>
        </div>
        <div className="w-full sm:w-64">
          <ProgressBar value={stats.overallProgress} showLabel />
        </div>
      </div>

      {/* KPI grids */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="إجمالي المهام" value={tasks.length} icon={<ClipboardList className="h-6 w-6" />} tone="brand" />
        <KpiCard label="مهام مكتملة" value={stats.tasksCompleted} icon={<CheckCircle2 className="h-6 w-6" />} tone="green" />
        <KpiCard label="قيد التنفيذ" value={stats.tasksInProgress} icon={<PlayCircle className="h-6 w-6" />} tone="orange" />
        <KpiCard label="مغلقة" value={stats.tasksClosed} icon={<CircleSlash className="h-6 w-6" />} tone="slate" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="إجمالي الاجتماعات" value={meetings.length} icon={<CalendarDays className="h-6 w-6" />} tone="brand" />
        <KpiCard label="حضوري" value={stats.meetingsInPerson} icon={<CalendarDays className="h-6 w-6" />} tone="accent" />
        <KpiCard label="عن بعد" value={stats.meetingsRemote} icon={<Video className="h-6 w-6" />} tone="brand" />
        <KpiCard label="إجمالي المشاريع" value={projects.length} icon={<BriefcaseBusiness className="h-6 w-6" />} tone="brand" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard label="مشاريع لم تبدأ" value={stats.projectsNotStarted} icon={<Clock className="h-6 w-6" />} tone="slate" />
        <KpiCard label="مشاريع قيد التنفيذ" value={stats.projectsInProgress} icon={<PlayCircle className="h-6 w-6" />} tone="orange" />
        <KpiCard label="مشاريع مكتملة" value={stats.projectsCompleted} icon={<CheckCircle2 className="h-6 w-6" />} tone="green" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">المهام حسب الإدارة</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={tasksByDept} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:!stroke-slate-700" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} angle={-15} textAnchor="end" height={70} interval={0} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: 'rgba(15,76,129,0.05)' }} />
              <Bar dataKey="value" name="عدد المهام" fill="#0F4C81" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">المهام حسب الحالة</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {tasksByStatus.map((e) => (
                  <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">نسبة إنجاز المشاريع</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={projectsProgress} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:!stroke-slate-700" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fontFamily: 'Tajawal' }} width={120} />
              <Tooltip cursor={{ fill: 'rgba(15,76,129,0.05)' }} />
              <Bar dataKey="value" name="نسبة الإنجاز" fill="#D4A017" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">الاجتماعات حسب التصنيف</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={meetingsByClass} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>
                {meetingsByClass.map((e) => (
                  <Cell key={e.name} fill={MEETING_COLORS[e.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="آخر المهام" onMore={() => onNavigate('tasks')}>
          {recentTasks.length === 0 ? (
            <Empty>لا توجد مهام حالياً</Empty>
          ) : (
            recentTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</p>
                  <p className="text-xs text-slate-400">{t.department}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="الاجتماعات القادمة" onMore={() => onNavigate('meetings')}>
          {upcomingMeetings.length === 0 ? (
            <Empty>لا توجد اجتماعات قادمة</Empty>
          ) : (
            upcomingMeetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{m.title}</p>
                  <p className="text-xs text-slate-400">
                    {formatArabicDate(m.date)} - {m.time}
                  </p>
                </div>
                <MeetingPill date={m.date} />
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="المشاريع الأكثر تقدماً" onMore={() => onNavigate('projects')}>
          {topProjects.length === 0 ? (
            <Empty>لا توجد مشاريع حالياً</Empty>
          ) : (
            topProjects.map((p) => (
              <div key={p.id} className="py-2">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{p.name}</p>
                  <span className="text-xs text-slate-500">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>
            ))
          )}
        </SectionCard>

        <SectionCard title="المهام المتأخرة" onMore={() => onNavigate('tasks')}>
          {delayedTasks.length === 0 ? (
            <Empty>لا توجد مهام متأخرة</Empty>
          ) : (
            delayedTasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{t.title}</p>
                  <p className="text-xs text-red-500">تاريخ: {formatArabicDate(t.date)}</p>
                </div>
                <StatusBadge status="متأخر" />
              </div>
            ))
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({ title, onMore, children }: { title: string; onMore: () => void; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
        <button onClick={onMore} className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400">
          عرض الكل
          <ArrowLeft className="h-3 w-3" />
        </button>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">{children}</div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-slate-400 dark:text-slate-500">{children}</p>;
}

function MeetingPill({ date }: { date: string }) {
  if (isToday(date)) return <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">اليوم</span>;
  if (isTomorrow(date)) return <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">غداً</span>;
  if (isUpcoming(date)) return <span className="badge bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">قادم</span>;
  return <span className="badge bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">منتهي</span>;
}
