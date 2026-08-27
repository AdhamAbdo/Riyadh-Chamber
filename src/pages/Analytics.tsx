import { useState, useMemo } from 'react';
import { X, Filter } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts';
import type { Task, Meeting, Project, LookupCategory } from '@/types';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { isProjectDelayed } from '@/services/projectService';
import { todayISO } from '@/utils/date';

interface AnalyticsProps {
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  lookups: LookupCategory;
}

const STATUS_COLORS: Record<string, string> = {
  مكتملة: '#16a34a', 'قيد التنفيذ': '#ea580c', مغلقة: '#64748b', 'لم تبدأ': '#94a3b8',
};
const TYPE_COLORS: Record<string, string> = { داخلي: '#0F4C81', خارجي: '#D4A017' };
const MEETING_COLORS: Record<string, string> = { حضوري: '#0F4C81', 'عن بعد': '#8b5cf6' };
const CLASS_COLORS: Record<string, string> = { داخلي: '#0F4C81', خارجي: '#D4A017', إداري: '#64748b' };

export function Analytics({ tasks, meetings, projects, lookups }: AnalyticsProps) {
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fDept, setFDept] = useState('');

  const inDateRange = (date: string) => {
    if (fFrom && date < fFrom) return false;
    if (fTo && date > fTo) return false;
    return true;
  };

  const ft = useMemo(() => tasks.filter((t) => inDateRange(t.date) && (!fDept || t.department === fDept)), [tasks, fFrom, fTo, fDept]);
  const fm = useMemo(() => meetings.filter((m) => inDateRange(m.date)), [meetings, fFrom, fTo]);
  const fp = useMemo(() => projects.filter((p) => (!fDept || p.department === fDept) && inDateRange(p.startDate)), [projects, fFrom, fTo, fDept]);

  const tasksByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ft) m.set(t.department, (m.get(t.department) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [ft]);

  const tasksByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ft) m.set(t.status, (m.get(t.status) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [ft]);

  const tasksByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of ft) m.set(t.type, (m.get(t.type) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [ft]);

  const avgTaskCompletion = ft.length > 0 ? Math.round(ft.reduce((s, t) => s + t.progress, 0) / ft.length) : 0;

  const completionDist = useMemo(() => {
    const buckets = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-100%': 0 };
    for (const t of ft) {
      if (t.progress <= 25) buckets['0-25%']++;
      else if (t.progress <= 50) buckets['26-50%']++;
      else if (t.progress <= 75) buckets['51-75%']++;
      else buckets['76-100%']++;
    }
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }, [ft]);

  const meetingsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const mt of fm) m.set(mt.type, (m.get(mt.type) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [fm]);

  const meetingsByClass = useMemo(() => {
    const m = new Map<string, number>();
    for (const mt of fm) m.set(mt.classification, (m.get(mt.classification) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [fm]);

  const meetingsByMonth = useMemo(() => {
    const m = new Map<string, number>();
    for (const mt of fm) {
      const month = mt.date.slice(0, 7);
      m.set(month, (m.get(month) ?? 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => a.name.localeCompare(b.name));
  }, [fm]);

  const projectsByDept = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of fp) m.set(p.department, (m.get(p.department) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [fp]);

  const projectsByType = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of fp) m.set(p.type, (m.get(p.type) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [fp]);

  const projectsByStatus = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of fp) m.set(p.status, (m.get(p.status) ?? 0) + 1);
    return Array.from(m, ([name, value]) => ({ name, value }));
  }, [fp]);

  const avgProjectProgress = fp.length > 0 ? Math.round(fp.reduce((s, p) => s + p.progress, 0) / fp.length) : 0;
  const completedProjects = fp.filter((p) => p.status === 'مكتملة').length;
  const delayedProjects = fp.filter((p) => isProjectDelayed(p)).length;

  const activeFilters = [fFrom, fTo, fDept].some(Boolean);
  const clearFilters = () => { setFFrom(''); setFTo(''); setFDept(''); };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300"><Filter className="h-4 w-4" /> الفلاتر</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="input" aria-label="من تاريخ" />
          <input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="input" aria-label="إلى تاريخ" />
          <select value={fDept} onChange={(e) => setFDept(e.target.value)} className="input">
            <option value="">كل الإدارات</option>
            {lookups.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {activeFilters && <button onClick={clearFilters} className="flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-600"><X className="h-3 w-3" /> مسح الفلاتر</button>}
        </div>
      </div>

      {/* Task analytics */}
      <div>
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">تحليل المهام</h2>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="إجمالي المهام" value={ft.length} icon={<span className="text-lg font-bold">∑</span>} tone="brand" />
          <KpiCard label="متوسط الإنجاز" value={`${avgTaskCompletion}%`} icon={<span className="text-lg font-bold">%</span>} tone="accent" />
          <KpiCard label="مكتملة" value={ft.filter((t) => t.status === 'مكتملة').length} icon={<span className="text-lg">✓</span>} tone="green" />
          <KpiCard label="قيد التنفيذ" value={ft.filter((t) => t.status === 'قيد التنفيذ').length} icon={<span className="text-lg">▶</span>} tone="orange" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="المهام حسب الإدارة">
            <BarChart data={tasksByDept}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Tajawal' }} angle={-15} textAnchor="end" height={70} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="عدد المهام" fill="#0F4C81" radius={[6, 6, 0, 0]} /></BarChart>
          </ChartCard>
          <ChartCard title="المهام حسب الحالة">
            <PieChart><Pie data={tasksByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>{tasksByStatus.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="المهام حسب النوع">
            <PieChart><Pie data={tasksByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>{tasksByType.map((e) => <Cell key={e.name} fill={TYPE_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="توزيع نسب الإنجاز">
            <BarChart data={completionDist}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Tajawal' }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="عدد المهام" fill="#D4A017" radius={[6, 6, 0, 0]} /></BarChart>
          </ChartCard>
        </div>
      </div>

      {/* Meeting analytics */}
      <div>
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">تحليل الاجتماعات</h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <ChartCard title="الاجتماعات حسب النوع">
            <PieChart><Pie data={meetingsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>{meetingsByType.map((e) => <Cell key={e.name} fill={MEETING_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="الاجتماعات حسب التصنيف">
            <PieChart><Pie data={meetingsByClass} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} paddingAngle={2}>{meetingsByClass.map((e) => <Cell key={e.name} fill={CLASS_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="الاجتماعات حسب الشهر">
            <LineChart data={meetingsByMonth}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="value" name="عدد الاجتماعات" stroke="#0F4C81" strokeWidth={2} dot={{ r: 4 }} /></LineChart>
          </ChartCard>
        </div>
      </div>

      {/* Project analytics */}
      <div>
        <h2 className="mb-3 text-base font-bold text-slate-800 dark:text-slate-100">تحليل المشاريع</h2>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="إجمالي المشاريع" value={fp.length} icon={<span className="text-lg font-bold">∑</span>} tone="brand" />
          <KpiCard label="متوسط التقدم" value={`${avgProjectProgress}%`} icon={<span className="text-lg">%</span>} tone="accent" />
          <KpiCard label="مكتملة" value={completedProjects} icon={<span className="text-lg">✓</span>} tone="green" />
          <KpiCard label="متأخرة" value={delayedProjects} icon={<span className="text-lg">!</span>} tone="red" />
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <ChartCard title="المشاريع حسب الإدارة">
            <BarChart data={projectsByDept}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'Tajawal' }} angle={-15} textAnchor="end" height={70} interval={0} /><YAxis allowDecimals={false} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="value" name="عدد المشاريع" fill="#0F4C81" radius={[6, 6, 0, 0]} /></BarChart>
          </ChartCard>
          <ChartCard title="المشاريع حسب النوع">
            <PieChart><Pie data={projectsByType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>{projectsByType.map((e) => <Cell key={e.name} fill={TYPE_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="المشاريع حسب الحالة">
            <PieChart><Pie data={projectsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} paddingAngle={2}>{projectsByStatus.map((e) => <Cell key={e.name} fill={STATUS_COLORS[e.name] ?? '#94a3b8'} />)}</Pie><Tooltip /><Legend wrapperStyle={{ fontFamily: 'Tajawal', fontSize: 12 }} /></PieChart>
          </ChartCard>
          <ChartCard title="نسب إنجاز المشاريع">
            <BarChart data={fp.map((p) => ({ name: p.name, value: p.progress }))} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} /><YAxis type="category" dataKey="name" tick={{ fontSize: 9, fontFamily: 'Tajawal' }} width={130} /><Tooltip cursor={{ fill: 'rgba(15,76,129,0.05)' }} /><Bar dataKey="value" name="نسبة الإنجاز" fill="#D4A017" radius={[0, 6, 6, 0]} /></BarChart>
          </ChartCard>
        </div>
      </div>

      <p className="text-center text-xs text-slate-400">البيانات محسوبة بتاريخ {todayISO()}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>{children as React.ReactElement}</ResponsiveContainer>
    </div>
  );
}
