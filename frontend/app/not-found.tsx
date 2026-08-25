'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Compass } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)] text-center relative overflow-hidden">
      {/* Background glowing orb */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-lime-500/5 dark:bg-brand/5 blur-[160px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md space-y-6 relative z-10"
      >
        <div className="w-16 h-16 rounded-2xl bg-lime-500/10 text-lime-700 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/20 mx-auto flex items-center justify-center">
          <Compass className="w-8 h-8 animate-spin-slow" />
        </div>

        <div className="space-y-2">
          <div className="text-7xl font-black tracking-tight text-lime-700 dark:text-brand font-mono">404</div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Halaman Tidak Ditemukan</h1>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tidak pernah ada.
          </p>
        </div>

        <div className="pt-2">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
