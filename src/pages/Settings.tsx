import { useState, useRef } from 'react';
import { Sun, Moon, Monitor, Download, Upload, RotateCcw, Database, User as UserIcon, Palette } from 'lucide-react';
import type { Session, Settings as SettingsType, Task, Meeting, Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { can } from '@/auth/permissions';
import { useToast } from '@/hooks/useToast';
import { buildBackup, downloadJson, importBackup, validateBackup } from '@/services/backupService';
import { supabase } from '@/services/supabaseClient';
import { SEED_TASKS, SEED_MEETINGS, SEED_PROJECTS, SEED_LOOKUPS } from '@/data/seedData';
import { formatArabicDate, todayISO } from '@/utils/date';
import { classNames } from '@/utils/id';

interface SettingsProps {
  session: Session;
  settings: SettingsType;
  onSetTheme: (t: SettingsType['theme']) => void;
  tasks: Task[];
  meetings: Meeting[];
  projects: Project[];
  onRefresh: () => Promise<void>;
}

export function SettingsPage({ session, settings, onSetTheme, tasks, meetings, projects, onRefresh }: SettingsProps) {
  const { toast } = useToast();
  const [resetOpen, setResetOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<unknown>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const payload = buildBackup(settings, tasks, meetings, projects, {
        departments: [],
        taskTypes: [],
        taskStatuses: [],
        meetingTypes: [],
        meetingClassifications: [],
        projectTypes: [],
        projectStatuses: [],
      });
      downloadJson(payload, `riyadh-chamber-backup-${todayISO()}.json`);
      toast('تم تصدير النسخة الاحتياطية بنجاح');
    } catch {
      toast('حدث خطأ أثناء التصدير', 'error');
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!validateBackup(data)) {
          toast('ملف النسخة الاحتياطية غير صالح', 'error');
          return;
        }
        setPendingImport(data);
        setImportOpen(true);
      } catch {
        toast('تعذر قراءة الملف', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    try {
      await importBackup(pendingImport as Parameters<typeof importBackup>[0]);
      toast('تم استيراد النسخة الاحتياطية بنجاح');
      setImportOpen(false);
      setPendingImport(null);
      await onRefresh();
    } catch {
      toast('حدث خطأ أثناء الاستيراد', 'error');
    }
  };

  const confirmReset = async () => {
    try {
      await supabase.from('tasks').delete().neq('task_id', '');
      await supabase.from('meetings').delete().neq('meeting_id', '');
      await supabase.from('projects').delete().neq('project_id', '');
      await supabase.from('tasks').insert(SEED_TASKS.map((t) => ({
        task_id: t.id, department: t.department, title: t.title, description: t.description,
        type: t.type, date: t.date, progress: t.progress, status: t.status, notes: t.notes,
        created_at: t.createdAt, updated_at: t.updatedAt,
      })));
      await supabase.from('meetings').insert(SEED_MEETINGS.map((m) => ({
        meeting_id: m.id, title: m.title, date: m.date, time: m.time, type: m.type,
        classification: m.classification, notes: m.notes,
        created_at: m.createdAt, updated_at: m.updatedAt,
      })));
      await supabase.from('projects').insert(SEED_PROJECTS.map((p) => ({
        project_id: p.id, department: p.department, name: p.name, description: p.description,
        start_date: p.startDate, end_date: p.endDate, type: p.type, status: p.status,
        progress: p.progress, notes: p.notes, created_at: p.createdAt, updated_at: p.updatedAt,
      })));
      await supabase.from('lookups').upsert({ id: 1, data: SEED_LOOKUPS });
      toast('تمت إعادة ضبط البيانات التجريبية بنجاح');
      setResetOpen(false);
      await onRefresh();
    } catch {
      toast('حدث خطأ أثناء إعادة الضبط', 'error');
    }
  };

  const themeOptions: { value: SettingsType['theme']; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'فاتح', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'داكن', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'النظام', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Section title="المظهر" icon={<Palette className="h-5 w-5" />}>
        <div className="flex flex-wrap gap-2">
          {themeOptions.map((opt) => (
            <button key={opt.value} onClick={() => onSetTheme(opt.value)}
              className={classNames('flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all',
                settings.theme === opt.value ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300' : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800')}>
              {opt.icon}{opt.label}
            </button>
          ))}
        </div>
      </Section>

      {/* User info */}
      <Section title="معلومات المستخدم" icon={<UserIcon className="h-5 w-5" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoItem label="الاسم" value={session.name} />
          <InfoItem label="البريد الإلكتروني" value={session.email} />
          <InfoItem label="الدور" value={session.role} />
        </div>
      </Section>

      {/* App data */}
      <Section title="بيانات التطبيق" icon={<Database className="h-5 w-5" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoItem label="عدد المهام" value={String(tasks.length)} />
          <InfoItem label="عدد الاجتماعات" value={String(meetings.length)} />
          <InfoItem label="عدد المشاريع" value={String(projects.length)} />
        </div>
      </Section>

      {/* Local database */}
      <Section title="قاعدة البيانات المحلية" icon={<Database className="h-5 w-5" />}>
        <div className="flex flex-wrap gap-3">
          {can(session.role, 'settings.backup') && (
            <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={handleExport}>تصدير نسخة احتياطية</Button>
          )}
          {can(session.role, 'settings.restore') && (
            <>
              <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>استيراد نسخة احتياطية</Button>
              <input ref={fileRef} type="file" accept="application/json" onChange={handleFile} className="hidden" />
            </>
          )}
          {can(session.role, 'settings.resetData') && (
            <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} onClick={() => setResetOpen(true)}>إعادة ضبط البيانات التجريبية</Button>
          )}
        </div>
        <p className="mt-3 text-xs text-slate-400">تاريخ اليوم: {formatArabicDate(todayISO())}</p>
      </Section>

      <ConfirmDialog
        open={resetOpen}
        title="إعادة ضبط البيانات"
        message="سيؤدي هذا الإجراء إلى حذف البيانات الحالية وإعادة تحميل البيانات التجريبية. هل أنت متأكد؟"
        confirmLabel="إعادة الضبط"
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />

      <ConfirmDialog
        open={importOpen}
        title="استيراد نسخة احتياطية"
        message="سيتم استبدال البيانات الحالية بالبيانات المستوردة. هل أنت متأكد؟"
        confirmLabel="استيراد"
        onConfirm={confirmImport}
        onCancel={() => { setImportOpen(false); setPendingImport(null); }}
      />
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-brand-700 dark:text-brand-300">{icon}</span>
        <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}
