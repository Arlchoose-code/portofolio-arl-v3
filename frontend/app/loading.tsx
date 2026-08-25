import React from 'react';
import { SkeletonCard } from '@/components/shared/SkeletonCard';

export default function Loading() {
  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-12">
      <div className="space-y-4 animate-pulse">
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-32" />
        <div className="h-10 bg-[var(--bg-elevated)] rounded w-72" />
        <div className="h-4 bg-[var(--bg-elevated)] rounded w-96" />
      </div>

      <SkeletonCard count={6} />
    </div>
  );
}
