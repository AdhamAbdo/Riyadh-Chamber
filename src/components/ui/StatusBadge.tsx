import { classNames } from '@/utils/id';
import { CheckCircle2, Clock, CircleSlash, PlayCircle, AlarmClock } from 'lucide-react';

type BadgeKind =
  | 'مكتملة'
  | 'قيد التنفيذ'
  | 'مغلقة'
  | 'لم تبدأ'
  | 'متأخر'
  | 'حضوري'
  | 'عن بعد'
  | 'داخلي'
  | 'خارجي'
  | 'إداري';

const STYLES: Record<BadgeKind, { cls: string; icon: React.ReactNode }> = {
  مكتملة: { cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  'قيد التنفيذ': { cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', icon: <PlayCircle className="w-3.5 h-3.5" /> },
  مغلقة: { cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300', icon: <CircleSlash className="w-3.5 h-3.5" /> },
  'لم تبدأ': { cls: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: <Clock className="w-3.5 h-3.5" /> },
  متأخر: { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: <AlarmClock className="w-3.5 h-3.5" /> },
  حضوري: { cls: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300', icon: null },
  'عن بعد': { cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', icon: null },
  داخلي: { cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300', icon: null },
  خارجي: { cls: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300', icon: null },
  إداري: { cls: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300', icon: null },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STYLES[status as BadgeKind] ?? {
    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    icon: null,
  };
  return (
    <span className={classNames('badge', style.cls)}>
      {style.icon}
      {status}
    </span>
  );
}
