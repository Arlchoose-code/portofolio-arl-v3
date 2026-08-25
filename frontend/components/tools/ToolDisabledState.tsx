'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ToolDisabledStateProps {
  toolName?: string;
  message?: string;
}

export function ToolDisabledState({
  toolName = 'Layanan Ini',
  message = 'Layanan tool ini sedang dinonaktifkan oleh administrator untuk sementara waktu.',
}: ToolDisabledStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto my-12 p-8 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 text-center"
    >
      <div className="w-16 h-16 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {toolName} Sedang Dinonaktifkan
      </h2>
      <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6">
        {message}
      </p>
      <Link href="/tools">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda Tools
        </Button>
      </Link>
    </motion.div>
  );
}
