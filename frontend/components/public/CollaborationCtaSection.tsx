'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, Wrench, Sparkles, Terminal, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CollaborationCtaSection() {
  return (
    <section className="py-20 max-w-5xl mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative rounded-3xl border border-lime-500/30 dark:border-brand/30 bg-gradient-to-b from-[var(--bg-surface)] via-[var(--bg-elevated)] to-[var(--bg-surface)] p-8 sm:p-12 overflow-hidden shadow-xl text-center space-y-6"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-lime-500/60 dark:via-brand/60 to-transparent" />
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-lime-500/15 dark:bg-brand/15 rounded-full blur-3xl pointer-events-none" />

        {/* Prompt Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-lime-500/10 dark:bg-brand/10 border border-lime-600/20 dark:border-brand/20 text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
          <Terminal className="w-3.5 h-3.5" />
          <span>// OPEN FOR COLLABORATION &amp; ROLES</span>
        </div>

        {/* Headline */}
        <div className="space-y-3 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-[var(--text-primary)] leading-tight">
            Mari Bangun Solusi Software &amp; Sistem AI Bersama
          </h2>
          <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
            Terbuka untuk peluang posisi Full-Stack / Backend Engineer, pengembangan microservice terdistribusi, integrasi model AI/LLM cerdas, maupun diskusi teknis.
          </p>
        </div>

        {/* Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--text-muted)] pt-2 font-mono">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-brand" />
            <span>High-Performance Architecture</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-brand" />
            <span>Applied LLM &amp; AI Agents</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-lime-600 dark:text-brand" />
            <span>Full-Cycle Development</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            asChild
            className="gap-2 shadow-lg bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] shadow-brand/20 font-bold px-8 w-full sm:w-auto justify-center"
          >
            <Link href="/contact">
              <Mail className="w-4 h-4" />
              <span>Hubungi Saya Sekarang</span>
            </Link>
          </Button>

          <Button
            size="lg"
            variant="outline"
            asChild
            className="gap-2 font-bold px-8 w-full sm:w-auto justify-center"
          >
            <Link href="/tools">
              <Wrench className="w-4 h-4" />
              <span>Jelajahi Pusat Tools</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </motion.div>
    </section>
  );
}

export default CollaborationCtaSection;
