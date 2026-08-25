import React from 'react';

export function SkeletonCard({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 animate-pulse"
        >
          <div className="aspect-video w-full rounded-xl bg-[var(--bg-elevated)]" />
          <div className="space-y-2">
            <div className="h-5 bg-[var(--bg-elevated)] rounded w-3/4" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-full" />
            <div className="h-4 bg-[var(--bg-elevated)] rounded w-2/3" />
          </div>
          <div className="flex gap-2 pt-2">
            <div className="h-6 w-16 bg-[var(--bg-elevated)] rounded-full" />
            <div className="h-6 w-16 bg-[var(--bg-elevated)] rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
