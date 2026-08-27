import { ChevronRight, ChevronLeft } from 'lucide-react';
import { classNames } from '@/utils/id';

interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

const PAGE_SIZES = [10, 25, 50];

export function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 dark:border-slate-800 sm:flex-row">
      <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
        <span>
          عرض {from}–{to} من {total}
        </span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="input !w-auto !py-1 text-xs"
          aria-label="عدد السجلات في الصفحة"
        >
          {PAGE_SIZES.map((s) => (
            <option key={s} value={s}>
              {s} لكل صفحة
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="الصفحة السابقة"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        {Array.from({ length: Math.min(pageCount, 7) }).map((_, i) => {
          let p = i + 1;
          if (pageCount > 7) {
            if (page > 4) p = page - 3 + i;
            if (p > pageCount) p = pageCount - (6 - i);
          }
          if (p < 1) p = 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={classNames(
                'h-8 w-8 rounded-lg text-sm transition-colors',
                p === page
                  ? 'bg-brand-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="الصفحة التالية"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
