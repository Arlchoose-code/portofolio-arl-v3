import React from 'react';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'published' | 'draft' | 'archived' | string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    draft: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    archived: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  };

  const style = styles[status] || 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize',
        style,
        className
      )}
    >
      {status}
    </span>
  );
}
