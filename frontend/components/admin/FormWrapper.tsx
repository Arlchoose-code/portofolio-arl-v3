'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface FormWrapperProps {
  title: string;
  backHref: string;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
  submitLabel?: string;
  children: React.ReactNode;
}

export function FormWrapper({
  title,
  backHref,
  onSubmit,
  isLoading = false,
  submitLabel = 'Simpan Perubahan',
  children,
}: FormWrapperProps) {
  return (
    <form onSubmit={onSubmit} className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="sm">
            <Link href={backHref}>
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
        </div>

        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Menyimpan...' : submitLabel}</span>
        </Button>
      </div>

      {/* Form Content */}
      <div className="space-y-6">{children}</div>

      {/* Bottom Action */}
      <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
        <Button asChild variant="secondary">
          <Link href={backHref}>Batal</Link>
        </Button>
        <Button type="submit" disabled={isLoading} className="gap-2">
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Menyimpan...' : submitLabel}</span>
        </Button>
      </div>
    </form>
  );
}
