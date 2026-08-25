'use client';

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  itemsPerPage?: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
  itemName?: string;
  className?: string;
}

export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1
): (number | string)[] {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
  const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

  const shouldShowLeftDots = leftSiblingIndex > 2;
  const shouldShowRightDots = rightSiblingIndex < totalPages - 1;

  // Case 1: On the left (e.g. pages 1, 2, 3) -> [1, 2, 3, 4, '...', totalPages]
  if (!shouldShowLeftDots && shouldShowRightDots) {
    const leftItemCount = Math.min(Math.max(currentPage + siblingCount, 3 + siblingCount), totalPages - 2);
    const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
    return [...leftRange, '...', totalPages];
  }

  // Case 2: On the right (e.g. pages 5, 6, 7) -> [1, '...', 4, 5, 6, 7]
  if (shouldShowLeftDots && !shouldShowRightDots) {
    const rightItemCount = Math.min(Math.max(totalPages - currentPage + 1 + siblingCount, 3 + siblingCount), totalPages - 2);
    const rightRange = Array.from(
      { length: rightItemCount },
      (_, i) => totalPages - rightItemCount + i + 1
    );
    return [1, '...', ...rightRange];
  }

  // Case 3: In the middle (e.g. page 4) -> [1, '...', 3, 4, 5, '...', totalPages]
  if (shouldShowLeftDots && shouldShowRightDots) {
    const middleRange: number[] = [];
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      middleRange.push(i);
    }
    return [1, '...', ...middleRange, '...', totalPages];
  }

  return Array.from({ length: totalPages }, (_, i) => i + 1);
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  siblingCount = 1,
  itemName = 'data',
  className = '',
}: PaginationProps) {
  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, totalPages, siblingCount),
    [currentPage, totalPages, siblingCount]
  );

  if (totalPages <= 1) return null;

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[var(--border)] ${className}`}
    >
      {totalItems !== undefined && itemsPerPage !== undefined ? (
        <div className="text-xs text-[var(--text-muted)] font-mono text-center sm:text-left">
          Menampilkan{' '}
          <span className="font-semibold text-[var(--text-primary)]">
            {(currentPage - 1) * itemsPerPage + 1}
          </span>{' '}
          -{' '}
          <span className="font-semibold text-[var(--text-primary)]">
            {Math.min(currentPage * itemsPerPage, totalItems)}
          </span>{' '}
          dari{' '}
          <span className="font-semibold text-[var(--text-primary)]">{totalItems}</span>{' '}
          {itemName}
        </div>
      ) : (
        <div className="text-xs text-[var(--text-muted)] font-mono">
          Halaman <span className="font-semibold text-[var(--text-primary)]">{currentPage}</span> dari{' '}
          <span className="font-semibold text-[var(--text-primary)]">{totalPages}</span>
        </div>
      )}

      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="gap-1 text-xs px-2 sm:px-2.5 h-8"
          title="Halaman Sebelumnya"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>

        <div className="flex items-center gap-1">
          {paginationRange.map((item, idx) => {
            if (item === '...') {
              return (
                <span
                  key={`dots-${idx}`}
                  className="w-7 h-8 flex items-center justify-center text-xs text-[var(--text-muted)] font-mono select-none"
                >
                  ...
                </span>
              );
            }

            const pageNum = item as number;
            const isCurrent = currentPage === pageNum;

            return (
              <button
                key={pageNum}
                type="button"
                onClick={() => onPageChange(pageNum)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                  isCurrent
                    ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-sm font-bold'
                    : 'border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="gap-1 text-xs px-2 sm:px-2.5 h-8"
          title="Halaman Berikutnya"
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
