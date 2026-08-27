import type { ReactNode } from 'react';
import { classNames } from '@/utils/id';

interface KpiCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: 'brand' | 'green' | 'orange' | 'red' | 'slate' | 'accent';
}

const TONES = {
  brand: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
  green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  accent: 'bg-accent-100 text-accent-700 dark:bg-accent-900/30 dark:text-accent-300',
};

export function KpiCard({ label, value, icon, tone = 'brand' }: KpiCardProps) {
  return (
    <div className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-card-hover">
      <div className={classNames('rounded-xl p-3', TONES[tone])}>{icon}</div>
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</p>
      </div>
    </div>
  );
}
