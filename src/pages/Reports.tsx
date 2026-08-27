import { useState, useMemo, useRef } from 'react';
import { FileText, FileSpreadsheet, Printer, FileDown } from 'lucide-react';
import type { Task, Meeting, Project, LookupCategory, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { can } from '@/auth/permissions';
import { useToast } from '@/hooks/useToast';
import { formatArabicDate, todayISO } from '@/utils/date';
import { exportExcel, exportPdfFromElement, printElement } from '@/utils/exportUtils';
import { isProjectDelayed } from '@/services/projectService';

interface ReportsProps {
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  lookups: LookupCategory;
  role: UserRole | undefined;
}

type ReportType = 'tasks' | 'meetings' | 'projects' | 'executive';

const REPORT_LABELS: Record<ReportType, string> = {
  tasks: 'تقرير المهام',
  meetings: 'تقرير الاجتماعات',
  projects: 'تقرير المشاريع',
  executive: 'التقرير التنفيذي الشامل',
};

export function Reports({ tasks, meetings, projects, lookups, role }: ReportsProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState<ReportType>('executive');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [fDept, setFDept] = useState('');
  const reportRef = useRef<HTMLDivElement>(null);

  const ft = useMemo(() => tasks.filter((t) => (!fFrom || t.date >= fFrom) && (!fTo || t.date <= fTo) && (!fDept || t.department === fDept)), [tasks, fFrom, fTo, fDept]);
  const fm = useMemo(() => meetings.filter((m) => (!fFrom || m.date >= fFrom) && (!fTo || m.date <= fTo)), [meetings, fFrom, fTo]);
  const fp = useMemo(() => projects.filter((p) => (!fDept || p.department === fDept) && (!fFrom || p.startDate >= fFrom) && (!fTo || p.endDate <= fTo)), [projects, fFrom, fTo, fDept]);

  const filtersDesc = [
    fFrom && `من: ${formatArabicDate(fFrom)}`,
    fTo && `إلى: ${formatArabicDate(fTo)}`,
    fDept && `الإدارة: ${fDept}`,
  ].filter(Boolean).join(' | ') || 'كل البيانات';

  const exportExcelReport = () => {
    if (reportType === 'tasks') {
      exportExcel(ft.map((t, i) => ({ no: i + 1, department: t.department, title: t.title, type: t.type, date: t.date, progress: t.progress, status: t.status })), [{ key: 'no', label: '#' }, { key: 'department', label: 'الإدارة' }, { key: 'title', label: 'العنوان' }, { key: 'type', label: 'النوع' }, { key: 'date', label: 'التاريخ' }, { key: 'progress', label: 'الإنجاز' }, { key: 'status', label: 'الحالة' }], 'تقرير-المهام');
    } else if (reportType === 'meetings') {
      exportExcel(fm.map((m, i) => ({ no: i + 1, title: m.title, date: m.date, time: m.time, type: m.type, classification: m.classification })), [{ key: 'no', label: '#' }, { key: 'title', label: 'العنوان' }, { key: 'date', label: 'التاريخ' }, { key: 'time', label: 'الوقت' }, { key: 'type', label: 'النوع' }, { key: 'classification', label: 'التصنيف' }], 'تقرير-الاجتماعات');
    } else {
      exportExcel(fp.map((p, i) => ({ no: i + 1, department: p.department, name: p.name, startDate: p.startDate, endDate: p.endDate, type: p.type, status: p.status, progress: p.progress })), [{ key: 'no', label: '#' }, { key: 'department', label: 'الإدارة' }, { key: 'name', label: 'المشروع' }, { key: 'startDate', label: 'البداية' }, { key: 'endDate', label: 'النهاية' }, { key: 'type', label: 'النوع' }, { key: 'status', label: 'الحالة' }, { key: 'progress', label: 'الإنجاز' }], 'تقرير-المشاريع');
    }
    toast('تم تصدير ملف Excel بنجاح');
  };

  const exportPdfReport = async () => {
    if (!reportRef.current) return;
    await exportPdfFromElement(reportRef.current, `تقرير-${reportType === 'executive' ? 'شامل' : reportType}`);
    toast('تم تصدير ملف PDF بنجاح');
  };

  const printReport = () => {
    if (!reportRef.current) return;
    printElement(reportRef.current);
  };

  const overallProgress =
    Math.round(
      (ft.reduce((s, t) => s + t.progress, 0) + fp.reduce((s, p) => s + p.progress, 0)) /
        Math.max(1, ft.length + fp.length),
    ) || 0;
  const delayedCount = fp.filter((p) => isProjectDelayed(p)).length;

  return (
    <div className="space-y-4">
      <div className="card p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Field label="نوع التقرير">
            <select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)} className="input">
              <option value="executive">التقرير التنفيذي الشامل</option>
              <option value="tasks">تقرير المهام</option>
              <option value="meetings">تقرير الاجتماعات</option>
              <option value="projects">تقرير المشاريع</option>
            </select>
          </Field>
          <Field label="من تاريخ"><input type="date" value={fFrom} onChange={(e) => setFFrom(e.target.value)} className="input" /></Field>
          <Field label="إلى تاريخ"><input type="date" value={fTo} onChange={(e) => setFTo(e.target.value)} className="input" /></Field>
          <Field label="الإدارة">
            <select value={fDept} onChange={(e) => setFDept(e.target.value)} className="input">
              <option value="">كل الإدارات</option>
              {lookups.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          {can(role, 'excel.export') && <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportExcelReport}>تصدير Excel</Button>}
          {can(role, 'pdf.export') && <Button variant="secondary" size="sm" icon={<FileDown className="h-4 w-4" />} onClick={exportPdfReport}>تصدير PDF</Button>}
          {can(role, 'print') && <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={printReport}>طباعة</Button>}
        </div>
      </div>

      {/* Report preview */}
      <div ref={reportRef} className="card p-8" style={{ fontFamily: 'Tajawal, sans-serif' }}>
        <div className="mb-6 border-b-2 border-brand-800 pb-4 text-center">
          <h1 className="text-xl font-bold text-brand-800">غرفة الرياض</h1>
          <p className="mt-1 text-sm text-slate-500">الإدارة التنفيذية لدعم الأعمال</p>
          <h2 className="mt-3 text-lg font-bold text-slate-800">{REPORT_LABELS[reportType]}</h2>
          <p className="mt-1 text-xs text-slate-400">تاريخ الإنشاء: {formatArabicDate(todayISO())}</p>
          <p className="mt-1 text-xs text-slate-400">الفلاتر: {filtersDesc}</p>
        </div>

        {(reportType === 'tasks' || reportType === 'executive') && (
          <ReportSection title="ملخص المهام">
            <SummaryRow items={[
              { label: 'إجمالي المهام', value: ft.length },
              { label: 'مكتملة', value: ft.filter((t) => t.status === 'مكتملة').length },
              { label: 'قيد التنفيذ', value: ft.filter((t) => t.status === 'قيد التنفيذ').length },
              { label: 'مغلقة', value: ft.filter((t) => t.status === 'مغلقة').length },
              { label: 'متوسط الإنجاز', value: `${ft.length ? Math.round(ft.reduce((s, t) => s + t.progress, 0) / ft.length) : 0}%` },
            ]} />
            <ReportTable headers={['#', 'الإدارة', 'العنوان', 'النوع', 'التاريخ', 'الإنجاز', 'الحالة']}
              rows={ft.map((t, i) => [String(i + 1), t.department, t.title, t.type, t.date, `${t.progress}%`, t.status])} />
          </ReportSection>
        )}

        {(reportType === 'meetings' || reportType === 'executive') && (
          <ReportSection title="ملخص الاجتماعات">
            <SummaryRow items={[
              { label: 'إجمالي الاجتماعات', value: fm.length },
              { label: 'حضوري', value: fm.filter((m) => m.type === 'حضوري').length },
              { label: 'عن بعد', value: fm.filter((m) => m.type === 'عن بعد').length },
            ]} />
            <ReportTable headers={['#', 'العنوان', 'التاريخ', 'الوقت', 'النوع', 'التصنيف']}
              rows={fm.map((m, i) => [String(i + 1), m.title, m.date, m.time, m.type, m.classification])} />
          </ReportSection>
        )}

        {(reportType === 'projects' || reportType === 'executive') && (
          <ReportSection title="ملخص المشاريع">
            <SummaryRow items={[
              { label: 'إجمالي المشاريع', value: fp.length },
              { label: 'لم تبدأ', value: fp.filter((p) => p.status === 'لم تبدأ').length },
              { label: 'قيد التنفيذ', value: fp.filter((p) => p.status === 'قيد التنفيذ').length },
              { label: 'مكتملة', value: fp.filter((p) => p.status === 'مكتملة').length },
              { label: 'متأخرة', value: fp.filter((p) => isProjectDelayed(p)).length },
              { label: 'متوسط التقدم', value: `${fp.length ? Math.round(fp.reduce((s, p) => s + p.progress, 0) / fp.length) : 0}%` },
            ]} />
            <ReportTable headers={['#', 'الإدارة', 'المشروع', 'البداية', 'النهاية', 'النوع', 'الحالة', 'الإنجاز']}
              rows={fp.map((p, i) => [String(i + 1), p.department, p.name, p.startDate, p.endDate, p.type, p.status, `${p.progress}%`])} />
          </ReportSection>
        )}

        {reportType === 'executive' && (
          <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm text-slate-600">
            <h3 className="mb-2 font-bold text-slate-700">الملخص التنفيذي</h3>
            <p>يغطي هذا التقرير {ft.length} مهمة، {fm.length} اجتماع، و {fp.length} مشروع. نسبة الإنجاز العامة للمهام والمشاريع تبلغ {overallProgress}%. يوجد {delayedCount} مشروع متأخر يتطلب متابعة.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h3 className="mb-3 text-base font-bold text-brand-800">{title}</h3>
      {children}
    </div>
  );
}

function SummaryRow({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
          <p className="text-xs text-slate-500">{it.label}</p>
          <p className="mt-1 text-lg font-bold text-brand-800">{it.value}</p>
        </div>
      ))}
    </div>
  );
}

function ReportTable({ headers, rows }: { headers: string[]; rows: (string)[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-brand-800 text-white">
            {headers.map((h) => <th key={h} className="border border-slate-300 px-2 py-1.5 text-right">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="border border-slate-200 px-2 py-4 text-center text-slate-400">لا توجد بيانات</td></tr>
          ) : (
            rows.map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                {r.map((c, j) => <td key={j} className="border border-slate-200 px-2 py-1.5 text-right">{c}</td>)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
