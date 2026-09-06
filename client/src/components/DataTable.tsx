import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { DEFAULT_PAGE_SIZE, TablePagination } from './TablePagination';

export type SortDirection = 'asc' | 'desc';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  width: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  defaultSort: { id: string; direction: SortDirection };
  onRowClick?: (row: T) => void;
  toolbarLeft?: React.ReactNode;
  serverPagination?: {
    page: number;
    pageSize: number;
    total: number;
    sortId: string;
    sortDir: SortDirection;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    onSortChange: (id: string, direction: SortDirection) => void;
  };
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  defaultSort,
  onRowClick,
  toolbarLeft,
  serverPagination
}: DataTableProps<T>) {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map(col => [col.id, col.width]))
  );
  const [clientSortId, setClientSortId] = useState(defaultSort.id);
  const [clientSortDir, setClientSortDir] = useState<SortDirection>(defaultSort.direction);
  const [clientPage, setClientPage] = useState(1);
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SIZE);
  const resizeRef = useRef<{ id: string; startX: number; startWidth: number } | null>(null);
  const didResizeRef = useRef(false);

  const sortId = serverPagination?.sortId ?? clientSortId;
  const sortDir = serverPagination?.sortDir ?? clientSortDir;
  const page = serverPagination?.page ?? clientPage;
  const pageSize = serverPagination?.pageSize ?? clientPageSize;
  const total = serverPagination?.total ?? rows.length;

  useEffect(() => {
    if (!serverPagination) setClientPage(1);
  }, [rows, clientSortId, clientSortDir, clientPageSize, serverPagination]);

  const handleSort = (column: DataTableColumn<T>) => {
    if (!column.sortable || didResizeRef.current) return;
    const nextDir: SortDirection = sortId === column.id
      ? (sortDir === 'asc' ? 'desc' : 'asc')
      : (column.id === defaultSort.id ? defaultSort.direction : 'asc');

    if (serverPagination) {
      serverPagination.onSortChange(column.id, nextDir);
      return;
    }
    setClientSortId(column.id);
    setClientSortDir(nextDir);
  };

  const onResizeMove = useCallback((event: MouseEvent) => {
    const active = resizeRef.current;
    if (!active) return;
    didResizeRef.current = true;
    const column = columns.find(col => col.id === active.id);
    const minWidth = column?.minWidth ?? 80;
    const nextWidth = Math.max(minWidth, active.startWidth + (event.clientX - active.startX));
    setWidths(prev => ({ ...prev, [active.id]: nextWidth }));
  }, [columns]);

  const onResizeEnd = useCallback(() => {
    resizeRef.current = null;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeEnd);
    window.setTimeout(() => {
      didResizeRef.current = false;
    }, 0);
  }, [onResizeMove]);

  const startResize = (event: React.MouseEvent, id: string) => {
    event.preventDefault();
    event.stopPropagation();
    resizeRef.current = { id, startX: event.clientX, startWidth: widths[id] };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeEnd);
  };

  const sortedRows = useMemo(() => {
    if (serverPagination) return rows;
    const column = columns.find(col => col.id === sortId);
    if (!column?.sortValue) return rows;
    const factor = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const left = column.sortValue!(a);
      const right = column.sortValue!(b);
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * factor;
      }
      return String(left).localeCompare(String(right), 'ru', { numeric: true, sensitivity: 'base' }) * factor;
    });
  }, [columns, rows, sortId, sortDir, serverPagination]);

  const visibleRows = useMemo(() => {
    if (serverPagination) return sortedRows;
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, page, pageSize, serverPagination]);

  const alignClass = (align?: DataTableColumn<T>['align']) =>
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  const tableMinWidth = columns.reduce((sum, col) => sum + (widths[col.id] ?? col.width), 0);

  return (
    <div>
      <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">{toolbarLeft}</div>
        <TablePagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={serverPagination ? serverPagination.onPageChange : setClientPage}
          onPageSizeChange={serverPagination ? serverPagination.onPageSizeChange : setClientPageSize}
        />
      </div>
      <div className="overflow-x-auto">
        <table
          className="text-left border-collapse text-sm table-fixed"
          style={{ width: tableMinWidth, minWidth: '100%' }}
        >
          <colgroup>
            {columns.map(col => (
              <col key={col.id} style={{ width: widths[col.id] }} />
            ))}
          </colgroup>
          <thead>
            <tr className="bg-slate-900 text-white font-semibold uppercase tracking-wider text-xs">
              {columns.map(col => {
                const active = sortId === col.id;
                return (
                  <th
                    key={col.id}
                    className={`relative py-3 px-4 select-none ${alignClass(col.align)} ${
                      col.sortable ? 'cursor-pointer hover:bg-slate-800' : ''
                    }`}
                    onClick={() => handleSort(col)}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && active && (
                        sortDir === 'desc'
                          ? <ArrowDown className="w-3.5 h-3.5 shrink-0" />
                          : <ArrowUp className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </span>
                    <span
                      role="separator"
                      aria-orientation="vertical"
                      onMouseDown={event => startResize(event, col.id)}
                      onClick={event => event.stopPropagation()}
                      className="absolute right-0 top-0 h-full w-2 cursor-col-resize hover:bg-blue-400/70"
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {visibleRows.map(row => (
              <tr
                key={rowKey(row)}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-blue-50/60 transition group ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td
                    key={col.id}
                    className={`py-3.5 px-4 align-middle overflow-hidden ${alignClass(col.align)}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
