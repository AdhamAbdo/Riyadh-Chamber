import { classNames } from '@/utils/id';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
}

export function ProgressBar({ value, className, showLabel }: ProgressBarProps) {
  const v = Math.max(0, Math.min(100, value));
  const color =
    v >= 100
      ? 'bg-green-500'
      : v >= 50
        ? 'bg-brand-500'
        : v > 0
          ? 'bg-accent-500'
          : 'bg-slate-300 dark:bg-slate-700';
  return (
    <div className={classNames('flex items-center gap-2', className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={classNames('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 text-left text-xs font-medium text-slate-600 dark:text-slate-300">
          {v}%
        </span>
      )}
    </div>
  );
}
