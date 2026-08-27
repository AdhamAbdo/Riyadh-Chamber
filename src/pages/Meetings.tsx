import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, X, FileSpreadsheet, FileText, Printer, ArrowUpDown, ArrowUp, ArrowDown, CalendarDays } from 'lucide-react';
import type { Meeting, MeetingType, MeetingClassification, LookupCategory, UserRole } from '@/types';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Field } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SkeletonTable } from '@/components/ui/LoadingState';
import { can } from '@/auth/permissions';
import { createMeeting, updateMeeting, deleteMeeting } from '@/services/meetingService';
import { useToast } from '@/hooks/useToast';
import { formatArabicDate, isToday, isTomorrow, isUpcoming, isPast } from '@/utils/date';
import { exportExcel, exportPdfFromElement, printElement } from '@/utils/exportUtils';
import { classNames } from '@/utils/id';

interface MeetingsProps {
  meetings: Meeting[];
  lookups: LookupCategory;
  loading: boolean;
  role: UserRole | undefined;
  onRefresh: () => Promise<void>;
}

type SortKey = 'date' | 'type' | 'classification';
type SortDir = 'asc' | 'desc';

interface FormState {
  title: string;
  date: string;
  time: string;
  type: MeetingType | '';
  classification: MeetingClassification | '';
  notes: string;
}

const EMPTY_FORM: FormState = { title: '', date: '', time: '', type: '', classification: '', notes: '' };

export function Meetings({ meetings, lookups, loading, role, onRefresh }: MeetingsProps) {
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null);

  const [search, setSearch] = useState('');
  const [fType, setFType] = useState('');
  const [fClass, setFClass] = useState('');
  const [fFrom, setFFrom] = useState('');
  const [fTo, setFTo] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = meetings.filter((m) => {
      if (q && !`${m.title} ${m.notes} ${m.classification} ${m.type}`.toLowerCase().includes(q)) return false;
      if (fType && m.type !== fType) return false;
      if (fClass && m.classification !== fClass) return false;
      if (fFrom && m.date < fFrom) return false;
      if (fTo && m.date > fTo) return false;
      return true;
    });
    r = r.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'date') cmp = a.date.localeCompare(b.date) || a.time.localeCompare(b.time);
      else if (sortKey === 'type') cmp = a.type.localeCompare(b.type);
      else if (sortKey === 'classification') cmp = a.classification.localeCompare(b.classification);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return r;
  }, [meetings, search, fType, fClass, fFrom, fTo, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeFilters = [fType, fClass, fFrom, fTo].some(Boolean);

  const clearFilters = () => { setSearch(''); setFType(''); setFClass(''); setFFrom(''); setFTo(''); setPage(1); };

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setErrors({}); setModalOpen(true); };
  const openEdit = (m: Meeting) => {
    setEditing(m);
    setForm({ title: m.title, date: m.date, time: m.time, type: m.type, classification: m.classification, notes: m.notes });
    setErrors({});
    setModalOpen(true);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'يرجى إدخال عنوان الاجتماع';
    if (!form.date) e.date = 'يرجى اختيار التاريخ';
    if (!form.time) e.time = 'يرجى اختيار الوقت';
    if (!form.type) e.type = 'يرجى اختيار نوع الاجتماع';
    if (!form.classification) e.classification = 'يرجى اختيار التصنيف';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateMeeting(editing.id, {
          title: form.title, date: form.date, time: form.time,
          type: form.type as MeetingType, classification: form.classification as MeetingClassification, notes: form.notes,
        });
        toast('تم تحديث الاجتماع بنجاح');
      } else {
        await createMeeting({
          title: form.title, date: form.date, time: form.time,
          type: form.type as MeetingType, classification: form.classification as MeetingClassification, notes: form.notes,
        });
        toast('تمت إضافة الاجتماع بنجاح');
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
      await deleteMeeting(deleteTarget.id);
      toast('تم حذف الاجتماع بنجاح');
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
    const rows = filtered.map((m, i) => ({
      no: i + 1, title: m.title, date: m.date, time: m.time, type: m.type, classification: m.classification, notes: m.notes,
    }));
    exportExcel(rows, [
      { key: 'no', label: '#' }, { key: 'title', label: 'عنوان الاجتماع' }, { key: 'date', label: 'التاريخ' },
      { key: 'time', label: 'الوقت' }, { key: 'type', label: 'النوع' }, { key: 'classification', label: 'التصنيف' },
      { key: 'notes', label: 'الملاحظات' },
    ], 'تقرير-الاجتماعات');
    toast('تم تصدير ملف Excel بنجاح');
  };

  const exportPdf = async () => { await exportPdfFromElement(buildReportElement(filtered), 'تقرير-الاجتماعات'); toast('تم تصدير ملف PDF بنجاح'); };
  const doPrint = () => { printElement(buildReportElement(filtered)); };

  const columns: Column<Meeting>[] = [
    { key: 'no', header: '#', render: (m) => <span className="text-slate-400">{filtered.indexOf(m) + 1}</span> },
    { key: 'title', header: 'عنوان الاجتماع / المكالمة', render: (m) => <div className="flex items-center gap-2"><MeetingPill date={m.date} /><span className="font-medium">{m.title}</span></div> },
    { key: 'date', header: 'التاريخ', render: (m) => <span className="whitespace-nowrap">{formatArabicDate(m.date)}</span> },
    { key: 'time', header: 'الوقت', render: (m) => <span className="whitespace-nowrap">{m.time}</span> },
    { key: 'type', header: 'النوع', render: (m) => <StatusBadge status={m.type} /> },
    { key: 'classification', header: 'التصنيف', render: (m) => <StatusBadge status={m.classification} /> },
    { key: 'notes', header: 'الملاحظات', render: (m) => <span className="line-clamp-1 max-w-[200px]">{m.notes || '—'}</span> },
    {
      key: 'actions', header: 'الإجراءات',
      render: (m) => (
        <div className="flex items-center gap-1">
          {can(role, 'meeting.edit') && <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-brand-600 dark:hover:bg-slate-800" title="تعديل"><Pencil className="h-4 w-4" /></button>}
          {can(role, 'meeting.delete') && <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" title="حذف"><Trash2 className="h-4 w-4" /></button>}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">إجمالي الاجتماعات: {meetings.length}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {can(role, 'excel.export') && <Button variant="secondary" size="sm" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportData}>تصدير Excel</Button>}
          {can(role, 'pdf.export') && <Button variant="secondary" size="sm" icon={<FileText className="h-4 w-4" />} onClick={exportPdf}>تصدير PDF</Button>}
          {can(role, 'print') && <Button variant="secondary" size="sm" icon={<Printer className="h-4 w-4" />} onClick={doPrint}>طباعة</Button>}
          {can(role, 'meeting.create') && <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة اجتماع جديد</Button>}
        </div>
      </div>

      <div className="card p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="بحث..." className="input pr-9" />
          </div>
          <select value={fType} onChange={(e) => { setFType(e.target.value); setPage(1); }} className="input">
            <option value="">كل الأنواع</option>
            {lookups.meetingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={fClass} onChange={(e) => { setFClass(e.target.value); setPage(1); }} className="input">
            <option value="">كل التصنيفات</option>
            {lookups.meetingClassifications.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="date" value={fFrom} onChange={(e) => { setFFrom(e.target.value); setPage(1); }} className="input" aria-label="من تاريخ" />
          <input type="date" value={fTo} onChange={(e) => { setFTo(e.target.value); setPage(1); }} className="input" aria-label="إلى تاريخ" />
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            {(['date', 'type', 'classification'] as SortKey[]).map((k) => (
              <button key={k} onClick={() => toggleSort(k)} className={classNames('flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors', sortKey === k ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400')}>
                {k === 'date' ? 'التاريخ' : k === 'type' ? 'النوع' : 'التصنيف'}
                {sortKey === k && (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
                {sortKey !== k && <ArrowUpDown className="h-3 w-3 opacity-40" />}
              </button>
            ))}
          </div>
          {activeFilters && <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"><X className="h-3 w-3" /> مسح الفلاتر</button>}
        </div>
      </div>

      {loading ? (
        <SkeletonTable cols={8} rows={6} />
      ) : filtered.length === 0 ? (
        <div className="card">
          <EmptyState icon={<CalendarDays className="h-12 w-12" />} title="لا توجد اجتماعات حالياً" description="ابدأ بإضافة اجتماع جديد" action={can(role, 'meeting.create') ? <Button icon={<Plus className="h-4 w-4" />} onClick={openAdd}>إضافة سجل جديد</Button> : undefined} />
        </div>
      ) : (
        <div>
          <DataTable columns={columns} rows={paged} rowKey={(m) => m.id} minWidth="900px" />
          <div className="card mt-0 border-t-0">
            <Pagination page={currentPage} pageCount={pageCount} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'تعديل اجتماع' : 'إضافة اجتماع جديد'} size="lg"
        footer={<><Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>إلغاء</Button><Button onClick={submit} loading={saving}>{editing ? 'حفظ التعديلات' : 'إضافة الاجتماع'}</Button></>}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="عنوان الاجتماع / المكالمة" required error={errors.title} className="sm:col-span-2">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="input" placeholder="عنوان الاجتماع" />
          </Field>
          <Field label="التاريخ" required error={errors.date}>
            <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input" />
          </Field>
          <Field label="الوقت" required error={errors.time}>
            <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className="input" />
          </Field>
          <Field label="نوع الاجتماع" required error={errors.type}>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as MeetingType }))} className="input">
              <option value="">اختر النوع</option>
              {lookups.meetingTypes.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="التصنيف" required error={errors.classification}>
            <select value={form.classification} onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value as MeetingClassification }))} className="input">
              <option value="">اختر التصنيف</option>
              {lookups.meetingClassifications.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="الملاحظات" className="sm:col-span-2">
            <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input min-h-[80px]" placeholder="ملاحظات إضافية" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} message="هل أنت متأكد من حذف هذا السجل؟" onConfirm={confirmDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

function MeetingPill({ date }: { date: string }) {
  if (isToday(date)) return <span className="badge bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">اليوم</span>;
  if (isTomorrow(date)) return <span className="badge bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">غداً</span>;
  if (isUpcoming(date)) return <span className="badge bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">قادم</span>;
  return <span className="badge bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500">منتهي</span>;
}

function buildReportElement(rows: Meeting[]): HTMLElement {
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
      <h2 style="font-size:16px;margin:8px 0 0">تقرير الاجتماعات</h2>
      <p style="font-size:11px;color:#777">تاريخ الإنشاء: ${formatArabicDate(new Date().toISOString().slice(0, 10))}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px">
      <thead><tr style="background:#0F4C81;color:#fff">
        <th style="padding:6px;border:1px solid #ccc">#</th><th style="padding:6px;border:1px solid #ccc">عنوان الاجتماع</th>
        <th style="padding:6px;border:1px solid #ccc">التاريخ</th><th style="padding:6px;border:1px solid #ccc">الوقت</th>
        <th style="padding:6px;border:1px solid #ccc">النوع</th><th style="padding:6px;border:1px solid #ccc">التصنيف</th>
      </tr></thead>
      <tbody>
        ${rows.map((m, i) => `<tr>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${i + 1}</td>
          <td style="padding:6px;border:1px solid #ddd">${m.title}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.date}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.time}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.type}</td>
          <td style="padding:6px;border:1px solid #ddd;text-align:center">${m.classification}</td>
        </tr>`).join('')}
      </tbody>
    </table>
    <p style="font-size:10px;color:#777;margin-top:12px">إجمالي السجلات: ${rows.length}</p>
  `;
  return wrap;
}
