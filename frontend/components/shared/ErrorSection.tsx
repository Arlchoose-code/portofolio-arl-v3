'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorSectionProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorSection({ message = 'Gagal memuat bagian ini.', onRetry }: ErrorSectionProps) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center space-y-4 my-6">
      <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 mx-auto flex items-center justify-center">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-[var(--text-primary)]">Terjadi Kesalahan</h4>
        <p className="text-xs text-[var(--text-secondary)]">{message}</p>
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="gap-2">
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Coba Lagi</span>
        </Button>
      )}
    </div>
  );
}
