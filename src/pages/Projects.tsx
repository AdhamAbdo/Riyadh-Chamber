import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, X, FileSpreadsheet, FileText, Printer, ArrowUpDown, ArrowUp, ArrowDown, BriefcaseBusiness } from 'lucide-react';
import type { Project, ProjectType, ProjectStatus, LookupCategory, UserRole } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/LoadingState';
import { can } from '@/auth/permissions';
import { createProject, updateProject, deleteProject, isProjectDelayed } from '@/services/projectService';
import { useToast } from '@/hooks/useToast';
import { formatArabicDate } from '@/utils/date';
import { exportExcel, exportPdfFromElement, printElement } from '@/utils/exportUtils';
import { classNames } from '@/utils/id';

interface ProjectsProps {
  projects: Project[];
  lookups: LookupCategory;
  loading: boolean;
  role: UserRole | undefined;
  onRefresh: () => Promise<void>;
}

type SortKey = 'startDate' | 'endDate' | 'progress' | 'status' | 'department';
type SortDir = 'asc' | 'desc';

interface FormState {
  department: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  type: ProjectType | '';
  status: ProjectStatus | '';
  progress: number;
  notes: string;
}

const EMPTY_FORM: FormState = { department: '', name: '', description: '', startDate: '', endDate: '', type: '', status: '', progress: 0, notes: '' };

export function Projects({ projects, lookups, loading, role, onRefresh }: ProjectsProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const [search, setSearch] = useState('');
  const [fDept, setFDept] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('endDate');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = projects.filter((p) => {
      if (q && !`${p.name} ${p.description} ${p.department} ${p.notes}`.toLowerCase().includes(q)) return false;
      if (fDept && p.department !== fDept) return false;
      if (fType && p.type !== fType) return false;
      if (fStatus && p.status !== fStatus) return false;
      if (fFrom && p.endDate < fFrom) return false;
      if (fTo && p.endDate > fTo) return false;
      return true;
    });
    r = r.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'startDate') cmp = a.startDate.localeCompare(b.startDate);
      else if (sortKey === 'endDate') cmp = a.endDate.localeCompare(b.endDate);
      else if (sortKey === 'progress') cmp = a.progress - b.progress;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'department') cmp = a.department.localeCompare(b.department);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [projects, search, fDept, fType, fStatus, fFrom, fTo, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilters = [fDept, fType, fStatus, fFrom, fTo].some(Boolean);

  const clearFilters = () => { setSearch(''); setFDept(''); setFType(''); setFStatus(''); setFFrom(''); setFTo(''); setPage(1); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (p: Project) => {
    setEditing(p);
    setForm({ department: p.department, name: p.name, description: p.description, startDate: p.startDate, endDate: p.endDate, type: p.type, status: p.status, progress: p.progress, notes: p.notes });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'يرجى إدخال اسم المشروع';
    if (!form.department) e.department = 'يرجى اختيار الإدارة';
    if (!form.startDate) e.startDate = 'يرجى اختيار تاريخ البداية';
    if (!form.endDate) e.endDate = 'يرجى اختيار تاريخ الانتهاء';
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية';
    if (!form.type) e.type = 'يرجى اختيار نوع المشروع';
    if (!form.status) e.status = 'يرجى اختيار حالة المشروع';
    if (form.progress < 0 || form.progress > 100) e.progress = 'نسبة الإنجاز يجب أن تكون بين 0 و100';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateProject(editing.id, {
          department: form.department, name: form.name, description: form.description, startDate: form.startDate, endDate: form.endDate,
          type: form.type as ProjectType, status: form.status as ProjectStatus, progress: form.progress, notes: form.notes,
        });
        toast('تم تحديث المشروع بنجاح');
      } else {
        await createProject({
          department: form.department, name: form.name, description: form.description, startDate: form.startDate, endDate: form.endDate,
          type: form.type as ProjectType, status: form.status as ProjectStatus, progress: form.progress, notes: form.notes,
        });
        toast('تمت إضافة المشروع بنجاح');
      }
      setModalOpen(false);
      await onRefresh();
    } catch {
      toast('حدث خطأ أثناء حفظ البيانات', 'error');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProject(deleteTarget.id);
      toast('تم حذف المشروع بنجاح');
      setDeleteTarget(null);
      await onRefresh();
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const exportData = () => {
    const rows = filtered.map((p, i) => ({
      no: i + 1, department: p.department, name: p.name, description: p.description, startDate: p.startDate, endDate: p.endDate,
      type: p.type, status: p.status, progress: p.progress, notes: p.notes,
    }));
    exportExcel(rows, [
      { key: 'no', label: '#' }, { key: 'department', label: 'الإدارة' }, { key: 'name', label: 'اسم المشروع' },
      { key: 'description', label: 'الوصف' }, { key: 'startDate', label: 'تاريخ البداية' }, { key: 'endDate', label: 'تاريخ الانتهاء' },
      { key: 'type', label: 'النوع' }, { key: 'status', label: 'الحالة' }, { key: 'progress', label: 'نسبة الإنجاز (%)' },
      { key: 'notes', label: 'الملاحظات' },
    ], 'تقرير-المشاريع');
    toast('تم تصدير ملف Excel بنجاح');
  };

  const exportPdf = async () => { await exportPdfFromElement(buildReportElement(filtered), 'تقرير-المشاريع'); toast('تم تصدير ملف PDF بنجاح'); };
  const doPrint = () => { printElement(buildReportElement(filtered)); };

  const columns: Column<Project>[] = [
    { key: 'no', header: '#', render: (p) => <span className="text-slate-400">{filtered.indexOf(p) + 1}</span> },
    { key: 'department', header: 'الإدارة', render: (p) => <span className="whitespace-nowrap">{p.department}</span> },
    { key: 'name', header: 'اسم المشروع', render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'description', header: 'الوصف', render: (p) => <span className="line-clamp-1 max-w-[180px]">{p.description || '—'}</span> },
    { key: 'startDate', header: 'تاريخ البداية', render: (p) => <span className="whitespace-nowrap">{formatArabicDate(p.startDate)}</span> },
    { key: 'endDate', header: 'تاريخ الانتهاء', render: (p) => <span className="whitespace-nowrap">{formatArabicDate(p.endDate)}</span> },
    { key: 'type', header: 'النوع', render: (p) => <StatusBadge status={p.type} /> },
    { key: 'status', header: 'الحالة', render: (p) => <div className="flex items-center gap-1"><StatusBadge status={p.status} />{isProjectDelayed(p) && <StatusBadge status="متأخر" />}</div> },
    { key: 'progress', header: 'نسبة الإنجاز', render: (p) => <div className="w-28"><ProgressBar value={p.progress} showLabel /></div> },
    { key: 'notes', header: 'الملاحظات', render: (p) => <span className="line-clamp-1 max-w-[140px]">{p.notes || '—'}</span> },
    {
      key: 'actions', header: 'الإجراءات',
      render: (p) => (
        <div className="flex items-center gap-1">
          {can(role, 'project.edit') && <button onClick={() => openEdit(p)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="تعديل"><Pencil className="h-4 w-4" /></button>}
          {can(role, 'project.delete') && <button onClick={() => setDeleteTarget(p)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="حذف"><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">إجمالي المشاريع: {projects.length}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {can(role, 'excel.export') && <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportData}>تصدير Excel</Button>}
          {can(role, 'pdf.export') && <Button variant="secondary" size="sm" icon={<FileText className="h-4 w-4" />} onClick={exportPdf}>تصدير PDF</Button>}
          {can(role, 'print') && <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={doPrint}>طباعة</Button>}
          {can(role, 'project.create') && <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة مشروع جديد</Button>}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="input pr-9" />
          </div>
          <select value={fDept} onChange={(e) => { setFDept(e.target.value); setPage(1); }} className="input">
            <option value="">كل الإدارات</option>
            {lookups.departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={fType} onChange={(e) => { setFType(e.target.value); setPage(1); }} className="input">
            <option value="">كل الأنواع</option>
            {lookups.projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }} className="input">
            <option value="">كل الحالات</option>
            {lookups.projectStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fFrom} onChange={(e) => { setFFrom(e.target.value); setPage(1); }} className="input" aria-label="من تاريخ" />
            <input type="date" value={fTo} onChange={(e) => { setFTo(e.target.value); setPage(1); }} className="input" aria-label="إلى تاريخ" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['startDate', 'endDate', 'progress', 'status', 'department'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)} className={classNames('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors', sortKey === k ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400')}>
                {k === 'startDate' ? 'البداية' : k === 'endDate' ? 'النهاية' : k === 'progress' ? 'الإنجاز' : k === 'status' ? 'الحالة' : 'الإدارة'}
                {sortKey === k && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                {sortKey !== k && <ArrowUpDown className="h-3 w-3 opacity-40" />}
              </button>
            ))}
          </div>
          {activeFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"><X className="h-3 w-3" /> مسح الفلاتر</button>}
        </div>
      </div>

      {loading ? (
        <SkeletonTable cols={11} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<BriefcaseBusiness className="h-12 w-12" />} title="لا توجد مشاريع حالياً" description="ابدأ بإضافة مشروع جديد" action={can(role, 'project.create') ? <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة سجل جديد</Button> : undefined} />
        </div>
      ) : (
        <div>
          <DataTable columns={columns} rows={paged} rowKey={(p) => p.id} minWidth="1200px" />
          <div className="card mt-0 border-t-0">
            <Pagination page={currentPage} pageCount={pageCount} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل مشروع' : 'إضافة مشروع جديد'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</Button><Button onClick={submit} loading={saving}>{editing ? 'حفظ التعديلات' : 'إضافة المشروع'}</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الإدارة" required error={errors.department}>
            <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="input">
              <option value="">اختر الإدارة</option>
              {lookups.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="اسم المشروع" required error={errors.name}>
            <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input" placeholder="اسم المشروع" />
          </Field>
          <Field label="الوصف" className="sm:col-span-2">
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" placeholder="وصف المشروع" />
          </Field>
          <Field label="تاريخ البداية" required error={errors.startDate}>
            <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="input" />
          </Field>
          <Field label="تاريخ الانتهاء" required error={errors.endDate}>
            <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="input" />
          </Field>
          <Field label="نوع المشروع" required error={errors.type}>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ProjectType }))} className="input">
              <option value="">اختر النوع</option>
              {lookups.projectTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="الحالة" required error={errors.status}>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))} className="input">
              <option value="">اختر الحالة</option>
              {lookups.projectStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="نسبة الإنجاز (%)" required error={errors.progress}>
            <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))} className="input" />
          </Field>
          {form.progress > 0 && <div className="sm:col-span-2"><ProgressBar value={form.progress} showLabel /></div>}
          <Field label="الملاحظات" className="sm:col-span-2">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input min-h-[60px]" placeholder="ملاحظات إضافية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} message="هل أنت متأكد من حذف هذا السجل؟" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function buildReportElement(rows: Project[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.style.padding = '24px';
  wrap.style.background = '#fff';
  wrap.style.color = '#000';
  wrap.style.fontFamily = 'Tajawal, sans-serif';
  wrap.dir = 'rtl';
  wrap.innerHTML = `
    <div style="text-align:center;margin-bottom:20px;border-bottom:2px solid #0F4C81;padding-bottom:12px">
      <h1 style="font-size:20px;color:#0F4C81;margin:0">غرفة الرياض</h1>
      <p style="font-size:13px;color:#555;margin:4px 0">الإدارة التنفيذية لدعم الأعمال</p>
      <h2 style="font-size:16px;margin:8px 0 0">تقرير المشاريع</h2>
      <p style="font-size:11px;color:#777">تاريخ الإنشاء: ${formatArabicDate(new Date().toISOString().slice(0, 10))}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:#0F4C81;color:#fff">
        <th style="padding:6px;border:1px solid #ccc">#</th><th style="padding:6px;border:1px solid #ccc">الإدارة</th>
        <th style="padding:6px;border:1px solid #ccc">اسم المشروع</th><th style="padding:6px;border:1px solid #ccc">البداية</th>
        <th style="padding:6px;border:1px solid #ccc">النهاية</th><th style="padding:6px;border:1px solid #ccc">النوع</th>
        <th style="padding:6px;border:1px solid #ccc">الحالة</th><th style="padding:6px;border:1px solid #ccc">الإنجاز</th>
      </tr></thead>
      <tbody>
        ${rows.map((p, i) => `<tr>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:6px;border:1px solid #ddd">${p.department}</td>
          <td style="padding:6px;border:1px solid #ddd">${p.name}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.startDate}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.endDate}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.type}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.status}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${p.progress}%</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:10px;color:#777;margin-top:12px">إجمالي السجلات: ${rows.length}</p>
  `;
  return wrap;
}
