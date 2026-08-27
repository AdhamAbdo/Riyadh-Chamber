import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, X, FileSpreadsheet, FileText, Printer, ArrowUpDown, ArrowUp, ArrowDown, ClipboardList } from 'lucide-react';
import type { Task, TaskStatus, TaskType, LookupCategory, UserRole } from '@/types';
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
import { createTask, updateTask, deleteTask } from '@/services/taskService';
import { useToast } from '@/hooks/useToast';
import { formatArabicDate } from '@/utils/date';
import { exportExcel, exportPdfFromElement, printElement } from '@/utils/exportUtils';
import { classNames } from '@/utils/id';

interface TasksProps {
  tasks: Task[];
  lookups: LookupCategory;
  loading: boolean;
  role: UserRole | undefined;
  onRefresh: () => Promise<void>;
}

type SortKey = 'date' | 'progress' | 'status' | 'department';
type SortDir = 'asc' | 'desc';

interface FormState {
  department: string;
  title: string;
  description: string;
  type: TaskType | '';
  date: string;
  progress: number;
  status: TaskStatus | '';
  notes: string;
}

const EMPTY_FORM: FormState = {
  department: '',
  title: '',
  description: '',
  type: '',
  date: '',
  progress: 0,
  status: '',
  notes: '',
};

export function Tasks({ tasks, lookups, loading, role, onRefresh }: TasksProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [fDept, setFDept] = useState('');
  const [fType, setFType] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = tasks.filter((t) => {
      if (q && !`${t.title} ${t.description} ${t.department} ${t.notes}`.toLowerCase().includes(q)) return false;
      if (fDept && t.department !== fDept) return false;
      if (fType && t.type !== fType) return false;
      if (fStatus && t.status !== fStatus) return false;
      if (fFrom && t.date < fFrom) return false;
      if (fTo && t.date > fTo) return false;
      return true;
    });
    r = r.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortKey === 'progress') cmp = a.progress - b.progress;
      else if (sortKey === 'status') cmp = a.status.localeCompare(b.status);
      else if (sortKey === 'department') cmp = a.department.localeCompare(b.department);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [tasks, search, fDept, fType, fStatus, fFrom, fTo, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilters = [fDept, fType, fStatus, fFrom, fTo].some(Boolean);

  const clearFilters = () => {
    setSearch('');
    setFDept('');
    setFType('');
    setFStatus('');
    setFFrom('');
    setFTo('');
    setPage(1);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (t: Task) => {
    setEditing(t);
    setForm({
      department: t.department,
      title: t.title,
      description: t.description,
      type: t.type,
      date: t.date,
      progress: t.progress,
      status: t.status,
      notes: t.notes,
    });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'يرجى إدخال عنوان المهمة';
    if (!form.department) e.department = 'يرجى اختيار الإدارة';
    if (!form.type) e.type = 'يرجى اختيار نوع المهمة';
    if (!form.date) e.date = 'يرجى اختيار التاريخ';
    if (form.progress < 0 || form.progress > 100) e.progress = 'نسبة الإنجاز يجب أن تكون بين 0 و100';
    if (!form.status) e.status = 'يرجى اختيار حالة المهمة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateTask(editing.id, {
          department: form.department,
          title: form.title,
          description: form.description,
          type: form.type as TaskType,
          date: form.date,
          progress: form.progress,
          status: form.status as TaskStatus,
          notes: form.notes,
        });
        toast('تم تحديث المهمة بنجاح');
      } else {
        await createTask({
          department: form.department,
          title: form.title,
          description: form.description,
          type: form.type as TaskType,
          date: form.date,
          progress: form.progress,
          status: form.status as TaskStatus,
          notes: form.notes,
        });
        toast('تمت إضافة المهمة بنجاح');
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
      await deleteTask(deleteTarget.id);
      toast('تم حذف المهمة بنجاح');
      setDeleteTarget(null);
      await onRefresh();
    } catch {
      toast('حدث خطأ أثناء الحذف', 'error');
    }
  };

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportData = () => {
    const rows = filtered.map((t, i) => ({
      no: i + 1,
      department: t.department,
      title: t.title,
      description: t.description,
      type: t.type,
      date: t.date,
      progress: t.progress,
      status: t.status,
      notes: t.notes,
    }));
    exportExcel(rows, [
      { key: 'no', label: '#' },
      { key: 'department', label: 'الإدارة' },
      { key: 'title', label: 'عنوان المهمة' },
      { key: 'description', label: 'الوصف' },
      { key: 'type', label: 'نوع المهمة' },
      { key: 'date', label: 'التاريخ' },
      { key: 'progress', label: 'نسبة الإنجاز (%)' },
      { key: 'status', label: 'الحالة' },
      { key: 'notes', label: 'الملاحظات' },
    ], 'تقرير-المهام');
    toast('تم تصدير ملف Excel بنجاح');
  };

  const exportPdf = async () => {
    const el = buildReportElement(filtered);
    await exportPdfFromElement(el, 'تقرير-المهام');
    toast('تم تصدير ملف PDF بنجاح');
  };

  const doPrint = () => {
    const el = buildReportElement(filtered);
    printElement(el);
  };

  const columns: Column<Task>[] = [
    { key: 'no', header: '#', render: (t) => { const i = filtered.indexOf(t) + 1; return <span className="text-slate-400">{i}</span>; } },
    { key: 'department', header: 'الإدارة', render: (t) => <span className="whitespace-nowrap">{t.department}</span> },
    { key: 'title', header: 'عنوان المهمة', render: (t) => <span className="font-medium">{t.title}</span> },
    { key: 'description', header: 'الوصف', render: (t) => <span className="line-clamp-1 max-w-[200px]">{t.description || '—'}</span> },
    { key: 'type', header: 'النوع', render: (t) => <StatusBadge status={t.type} /> },
    { key: 'date', header: 'التاريخ', render: (t) => <span className="whitespace-nowrap">{formatArabicDate(t.date)}</span> },
    { key: 'progress', header: 'نسبة الإنجاز', render: (t) => <div className="w-28"><ProgressBar value={t.progress} showLabel /></div> },
    { key: 'status', header: 'الحالة', render: (t) => <StatusBadge status={t.status} /> },
    { key: 'notes', header: 'الملاحظات', render: (t) => <span className="line-clamp-1 max-w-[160px]">{t.notes || '—'}</span> },
    {
      key: 'actions',
      header: 'الإجراءات',
      render: (t) => (
        <div className="flex items-center gap-1">
          {can(true, 'task.edit') && (
            <button onClick={() => openEdit(t)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="تعديل">
              <Pencil className="h-4 w-4" />
            </button>
          )}
          {can(true, 'task.delete') && (
            <button onClick={() => setDeleteTarget(t)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="حذف">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">إجمالي المهام: {tasks.length}</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {can(true, 'excel.export') && (
            <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportData}>تصدير Excel</Button>
          )}
          {can(true, 'pdf.export') && (
            <Button variant="secondary" size="sm" icon={<FileText className="h-4 w-4" />} onClick={exportPdf}>تصدير PDF</Button>
          )}
          {can(true, 'print') && (
            <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={doPrint}>طباعة</Button>
          )}
          {can(true, 'task.create') && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة مهمة جديدة</Button>
          )}
        </div>
      </div>

      {/* Filters */}
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
            {lookups.taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fStatus} onChange={(e) => { setFStatus(e.target.value); setPage(1); }} className="input">
            <option value="">كل الحالات</option>
            {lookups.taskStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="flex items-center gap-2">
            <input type="date" value={fFrom} onChange={(e) => { setFFrom(e.target.value); setPage(1); }} className="input" aria-label="من تاريخ" />
            <input type="date" value={fTo} onChange={(e) => { setFTo(e.target.value); setPage(1); }} className="input" aria-label="إلى تاريخ" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['date', 'progress', 'status', 'department'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)} className={classNames('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors', sortKey === k ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400')}>
                {k === 'date' ? 'التاريخ' : k === 'progress' ? 'الإنجاز' : k === 'status' ? 'الحالة' : 'الإدارة'}
                {sortKey === k && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                {sortKey !== k && <ArrowUpDown className="h-3 w-3 opacity-40" />}
              </button>
            ))}
          </div>
          {activeFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600">
              <X className="h-3 w-3" /> مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable cols={10} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<ClipboardList className="h-12 w-12" />}
            title="لا توجد مهام حالياً"
            description="ابدأ بإضافة مهمة جديدة"
            action={can(true, 'task.create') ? <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة سجل جديد</Button> : undefined}
          />
        </div>
      ) : (
        <div>
          <DataTable columns={columns} rows={paged} rowKey={(t) => t.id} minWidth="1100px" />
          <div className="card mt-0 border-t-0">
            <Pagination page={currentPage} pageCount={pageCount} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </div>
        </div>
      )}

      {/* Form modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'تعديل مهمة' : 'إضافة مهمة جديدة'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</Button>
            <Button onClick={submit} loading={saving}>{editing ? 'حفظ التعديلات' : 'إضافة المهمة'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="الإدارة" required error={errors.department}>
            <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} className="input">
              <option value="">اختر الإدارة</option>
              {lookups.departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="عنوان المهمة" required error={errors.title}>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="عنوان المهمة" />
          </Field>
          <Field label="الوصف" className="sm:col-span-2">
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="input min-h-[80px]" placeholder="وصف المهمة" />
          </Field>
          <Field label="نوع المهمة" required error={errors.type}>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TaskType }))} className="input">
              <option value="">اختر النوع</option>
              {lookups.taskTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="التاريخ" required error={errors.date}>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
          </Field>
          <Field label="حالة المهمة" required error={errors.status}>
            <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as TaskStatus }))} className="input">
              <option value="">اختر الحالة</option>
              {lookups.taskStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="نسبة الإنجاز (%)" required error={errors.progress}>
            <input type="number" min={0} max={100} value={form.progress} onChange={(e) => setForm((f) => ({ ...f, progress: Number(e.target.value) }))} className="input" />
          </Field>
          {form.progress > 0 && (
            <div className="sm:col-span-2">
              <ProgressBar value={form.progress} showLabel />
            </div>
          )}
          <Field label="الملاحظات" className="sm:col-span-2">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input min-h-[60px]" placeholder="ملاحظات إضافية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        message="هل أنت متأكد من حذف هذا السجل؟"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// Build a hidden report element for PDF/print export
function buildReportElement(rows: Task[]): HTMLElement {
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
      <h2 style="font-size:16px;margin:8px 0 0">تقرير المهام</h2>
      <p style="font-size:11px;color:#777">تاريخ الإنشاء: ${formatArabicDate(new Date().toISOString().slice(0, 10))}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead>
        <tr style="background:#0F4C81;color:#fff">
          <th style="padding:6px;border:1px solid #ccc">#</th>
          <th style="padding:6px;border:1px solid #ccc">الإدارة</th>
          <th style="padding:6px;border:1px solid #ccc">عنوان المهمة</th>
          <th style="padding:6px;border:1px solid #ccc">النوع</th>
          <th style="padding:6px;border:1px solid #ccc">التاريخ</th>
          <th style="padding:6px;border:1px solid #ccc">الإنجاز</th>
          <th style="padding:6px;border:1px solid #ccc">الحالة</th>
        </tr>
      </thead>
      <tbody>
        ${rows.map((t, i) => `<tr>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:6px;border:1px solid #ddd">${t.department}</td>
          <td style="padding:6px;border:1px solid #ddd">${t.title}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${t.type}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${t.date}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${t.progress}%</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${t.status}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:10px;color:#777;margin-top:12px">إجمالي السجلات: ${rows.length}</p>
  `;
  return wrap;
}
