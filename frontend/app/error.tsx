'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isChunkError =
    error?.message?.includes('Loading chunk') ||
    error?.message?.includes('ChunkLoadError') ||
    error?.name === 'ChunkLoadError';

  useEffect(() => {
    // If a chunk hash mismatch occurs after a new build deployment, automatically reload the page once
    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
      }
    } else {
      sessionStorage.removeItem('chunk_reload');
    }
  }, [isChunkError]);

  const handleRetry = () => {
    sessionStorage.removeItem('chunk_reload');
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)] text-center">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {isChunkError ? 'Versi Baru Tersedia' : 'Terjadi Kesalahan Sistem'}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {isChunkError
              ? 'Aplikasi telah diperbarui dengan versi terbaru. Silakan muat ulang halaman untuk melanjutkan.'
              : error?.message || 'Kami mohon maaf atas kendala ini. Silakan coba muat ulang halaman.'}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <Button variant="secondary" onClick={handleRetry} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Muat Ulang Halaman</span>
          </Button>
          <Button asChild variant="default" className="gap-2">
            <Link href="/" onClick={() => (window.location.href = '/')}>
              <Home className="w-4 h-4" />
              <span>Beranda</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
