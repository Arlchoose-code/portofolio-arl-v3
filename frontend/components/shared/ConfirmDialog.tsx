'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: 'danger' | 'brand' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Konfirmasi Tindakan',
  description = 'Apakah Anda yakin ingin melanjutkan tindakan ini? Data yang dihapus tidak dapat dikembalikan.',
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  isLoading = false,
  variant = 'brand',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overscroll-contain"
        >
          {/* Backdrop click to cancel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 10 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            data-lenis-prevent="true"
            onWheel={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-5"
            role="dialog"
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl shrink-0 ${
                  variant === 'danger'
                    ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                    : 'bg-lime-500/10 text-lime-700 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/30'
                }`}
              >
                {variant === 'danger' ? (
                  <AlertTriangle className="w-6 h-6" />
                ) : (
                  <AlertTriangle className="w-6 h-6" />
                )}
              </div>

              <div className="space-y-1.5 flex-1 pr-6">
                <h3 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{title}</h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">{description}</p>
              </div>

              <button
                type="button"
                onClick={onCancel}
                disabled={isLoading}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                title="Tutup dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[var(--border)]">
              <Button variant="secondary" onClick={onCancel} disabled={isLoading} className="text-xs font-semibold">
                {cancelLabel}
              </Button>
              <Button
                variant={variant === 'danger' ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={isLoading}
                className="text-xs font-bold"
              >
                {isLoading ? 'Memproses...' : confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
