'use client';

import React, { useState, useEffect } from 'react';
import { ApiMeta, PaginationParams } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, ArrowUpDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { Pagination } from '@/components/shared/Pagination';

export interface Column<T> {
  header: string;
  accessor?: keyof T | ((item: T) => React.ReactNode);
  sortKey?: string;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  meta?: ApiMeta;
  isLoading?: boolean;
  onParamsChange?: (params: PaginationParams) => void;
  createHref?: string;
  createLabel?: string;
  searchPlaceholder?: string;
}

export function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  meta,
  isLoading = false,
  onParamsChange,
  createHref,
  createLabel = 'Tambah Baru',
  searchPlaceholder = 'Cari data...',
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('DESC');
  const [page, setPage] = useState(1);

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      onParamsChange?.({ search, sort, order, page });
    }, 300);
    return () => clearTimeout(handler);
  }, [search, sort, order, page]);

  const handleSort = (sortKey?: string) => {
    if (!sortKey) return;
    if (sort === sortKey) {
      setOrder(order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSort(sortKey);
      setOrder('ASC');
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            className="pl-9"
          />
        </div>
        {createHref && (
          <Button asChild variant="default" className="w-full sm:w-auto">
            <Link href={createHref} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>{createLabel}</span>
            </Link>
          </Button>
        )}
      </div>

      {/* Table Card */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--bg-base)] text-[var(--text-secondary)]">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider ${col.className || ''}`}
                  >
                    {col.sortKey ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.sortKey)}
                        className="flex items-center gap-1.5 hover:text-[var(--text-primary)] transition-colors"
                      >
                        <span>{col.header}</span>
                        <ArrowUpDown className="w-3 h-3 opacity-60" />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {columns.map((_, cIdx) => (
                      <td key={cIdx} className="px-4 py-3">
                        <div className="h-4 bg-[var(--bg-elevated)] rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-[var(--text-muted)]"
                  >
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                data.map((item, rowIdx) => (
                  <tr
                    key={item.id || rowIdx}
                    className="hover:bg-[var(--bg-elevated)]/50 transition-colors"
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className={`px-4 py-3 ${col.className || ''}`}>
                        {typeof col.accessor === 'function'
                          ? col.accessor(item)
                          : col.accessor
                          ? (item[col.accessor] as any)
                          : null}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {meta && meta.total_pages > 1 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-base)]">
            <Pagination
              currentPage={page}
              totalPages={meta.total_pages}
              totalItems={meta.total}
              itemsPerPage={meta.per_page}
              onPageChange={(newPage) => setPage(newPage)}
              itemName="baris data"
              className="pt-0 border-t-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
