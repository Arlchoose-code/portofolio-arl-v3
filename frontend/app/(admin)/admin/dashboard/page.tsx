'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  projectsApi,
  experiencesApi,
  skillsApi,
  certificatesApi,
  aiApi,
  mediaApi,
} from '@/lib/api';
import { Button } from '@/components/ui/Button';
import {
  FolderGit2,
  Briefcase,
  Sparkles,
  Award,
  MessageSquare,
  Image as ImageIcon,
  Plus,
  ArrowUpRight,
  Bot,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    projects: 0,
    experiences: 0,
    skills: 0,
    certificates: 0,
    chatSessions: 0,
    media: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const [p, exp, sk, c, cs, m] = await Promise.all([
          projectsApi.list({ per_page: 1 }),
          experiencesApi.list({ per_page: 1 }),
          skillsApi.list({ per_page: 1 }),
          certificatesApi.list({ per_page: 1 }),
          aiApi.listChatSessions({ per_page: 1 }),
          mediaApi.list({ per_page: 1 }),
        ]);

        setStats({
          projects: p.meta?.total || 0,
          experiences: exp.meta?.total || 0,
          skills: sk.meta?.total || 0,
          certificates: c.meta?.total || 0,
          chatSessions: cs.meta?.total || 0,
          media: m.meta?.total || 0,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    { title: 'Total Projects', count: stats.projects, icon: FolderGit2, href: '/admin/projects', color: 'text-lime-700 dark:text-brand' },
    { title: 'Work Experiences', count: stats.experiences, icon: Briefcase, href: '/admin/experiences', color: 'text-sky-400' },
    { title: 'Technical Skills', count: stats.skills, icon: Sparkles, href: '/admin/skills', color: 'text-amber-400' },
    { title: 'Certifications', count: stats.certificates, icon: Award, href: '/admin/certificates', color: 'text-purple-400' },
    { title: 'Chat Sessions', count: stats.chatSessions, icon: MessageSquare, href: '/admin/chat-sessions', color: 'text-emerald-400' },
    { title: 'Media Assets', count: stats.media, icon: ImageIcon, href: '/admin/media', color: 'text-rose-400' },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Welcome Banner */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
              Selamat datang kembali, Syahril!
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Kelola seluruh data portofolio, media asset, SEO, dan chatbot persona secara real-time.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="default" className="gap-2">
              <Link href="/admin/projects/new">
                <Plus className="w-4 h-4" />
                <span>Tambah Proyek</span>
              </Link>
            </Button>
            <Button asChild variant="secondary" className="gap-2">
              <Link href="/" target="_blank">
                <span>Lihat Web</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* System Status Indicators */}
        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Database MySQL (portofolio_arl): Connected</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
            <span>Ollama Inference (gemma4:31b-cloud): Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
            <span>Revalidation Queue: Running</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="group rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3 hover:border-[var(--border-hover)] hover:shadow-lg transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`p-2.5 rounded-xl bg-[var(--bg-elevated)] ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="text-3xl font-black text-[var(--text-primary)]">
                {loading ? <span className="animate-pulse">--</span> : card.count}
              </div>

              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors pt-2 border-t border-[var(--border)] font-medium">
                <span>Kelola {card.title}</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bot className="w-5 h-5 text-lime-700 dark:text-brand" />
            <span>AI Chatbot Status & Persona</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Asisten AI 'Arl' menggunakan sistem SSE streaming yang terhubung ke Ollama lokal dengan proteksi guardrail otomatis.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/ai-settings">Konfigurasi Persona</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/chat-sessions">Lihat Transkrip Chat</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4">
          <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-sky-400" />
            <span>Kustomisasi Website</span>
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Ubah informasi profil, tautan sosial media, pengaturan SEO canonical, dan robots.txt kapan saja.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/admin/settings">Pengaturan Web</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/media">Pustaka Media</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
