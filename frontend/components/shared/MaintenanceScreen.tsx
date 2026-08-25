'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Wrench, Shield, Lock, Mail, ExternalLink, ArrowRight } from 'lucide-react';
import { SiteSetting, SocialLink } from '@/types';

interface MaintenanceScreenProps {
  site?: SiteSetting | null;
  socialLinks?: SocialLink[];
}

export function MaintenanceScreen({ site, socialLinks = [] }: MaintenanceScreenProps) {
  const siteName = site?.site_name || 'Syahril Haryono';
  const tagline = site?.tagline || 'Full Stack Developer & AI Enthusiast';

  return (
    <div className="min-h-screen w-full bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col items-center justify-between p-6 sm:p-12 relative overflow-hidden selection:bg-brand selection:text-black font-sans">
      {/* High-tech ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-lime-500/10 dark:bg-brand/10 blur-[130px] rounded-full pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-lime-500/10 dark:bg-brand/10 border border-lime-500/30 flex items-center justify-center text-lime-700 dark:text-brand font-bold text-sm">
            {siteName.charAt(0)}
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-[var(--text-primary)]">{siteName}</h1>
            <p className="text-[11px] text-[var(--text-secondary)]">{tagline}</p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-mono font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>MAINTENANCE_ACTIVE</span>
        </div>
      </header>

      {/* Center Maintenance Hero */}
      <main className="w-full max-w-xl my-auto text-center z-10 py-12 flex flex-col items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="relative mb-8"
        >
          <div className="w-24 h-24 rounded-3xl bg-[var(--bg-surface)] border-2 border-lime-500/40 dark:border-brand/40 shadow-2xl flex items-center justify-center relative z-10 group">
            <Wrench className="w-10 h-10 text-lime-700 dark:text-brand animate-pulse" />
          </div>
          {/* Animated decorative rings */}
          <div className="absolute -inset-2 rounded-[28px] border border-lime-500/20 animate-spin" style={{ animationDuration: '12s' }} />
          <div className="absolute -inset-4 rounded-[34px] border border-lime-500/10" />
        </motion.div>

        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3"
        >
          Sistem Sedang Dalam Pemeliharaan
        </motion.h2>

        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mb-8"
        >
          Website portofolio sedang dalam proses peningkatan infrastruktur, pembaruan performa, dan sinkronisasi konten berkala. Kami akan segera kembali online!
        </motion.p>

        {/* Status Tracker Box */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 sm:p-5 shadow-sm text-left mb-8 space-y-3 font-mono text-xs"
        >
          <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)] pb-2 border-b border-[var(--border)]">
            <span className="flex items-center gap-1.5 font-bold text-lime-700 dark:text-brand">
              <Shield className="w-3.5 h-3.5" />
              STATUS PEMELIHARAAN
            </span>
            <span className="text-emerald-500 font-semibold">SERVER STABLE</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-[var(--text-secondary)]">
            <div className="flex items-center justify-between">
              <span>Target Operasional:</span>
              <span className="text-[var(--text-primary)] font-semibold">Segera Kembali Online</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Proses:</span>
              <span className="text-lime-700 dark:text-brand font-semibold">Pembaruan & Optimasi Sistem</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Kontak Darurat:</span>
              <a href="mailto:contact@arlab.my.id" className="text-blue-500 hover:underline flex items-center gap-1">
                <Mail className="w-3 h-3" />
                contact@arlab.my.id
              </a>
            </div>
          </div>
        </motion.div>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {socialLinks.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-medium text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:border-lime-500/40 transition-all shadow-xs"
              >
                <span>{s.platform}</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Footer & Admin Bypass Link */}
      <footer className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-secondary)] z-10 pt-4 border-t border-[var(--border)]">
        <p>© {new Date().getFullYear()} {siteName}. Hak Cipta Dilindungi.</p>

        <Link
          href="/admin/login"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors font-mono py-1 px-2.5 rounded-lg hover:bg-lime-500/10"
        >
          <Lock className="w-3 h-3" />
          <span>Login Administrator</span>
          <ArrowRight className="w-3 h-3 ml-0.5 opacity-60" />
        </Link>
      </footer>
    </div>
  );
}
