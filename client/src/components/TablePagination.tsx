import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { m } from '../paraglide/messages.js';

export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const MIN_PAGE_SIZE = 5;
export const MAX_PAGE_SIZE = 50;

interface TablePaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}) => {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const from = total === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(total, currentPage * pageSize);

  return (
    <div className="flex items-center justify-end flex-wrap gap-3 text-xs text-slate-600">
      <label className="flex items-center gap-2">
        <span className="whitespace-nowrap">{m.pager_per_page()}</span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 bg-white border border-slate-300 rounded text-xs focus:ring-2 focus:ring-blue-600 focus:outline-none"
        >
          {PAGE_SIZE_OPTIONS.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
      </label>

      <span className="tabular-nums whitespace-nowrap">
        {m.pager_range({ from, to, total })}
      </span>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={m.pager_prev()}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="min-w-[4.5rem] text-center tabular-nums">
          {currentPage} / {pageCount}
        </span>
        <button
          type="button"
          disabled={currentPage >= pageCount}
          onClick={() => onPageChange(currentPage + 1)}
          className="p-1.5 border border-slate-300 rounded bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={m.pager_next()}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
