'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { pagesApi } from '@/lib/api';
import { Page } from '@/types';
import { Button } from '@/components/ui/Button';
import {
  FileText,
  Pencil,
  ArrowUpRight,
  Globe,
  Plus,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Sparkles,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const loadPages = async () => {
    setLoading(true);
    try {
      const res = await pagesApi.list({ per_page: 50 });
      if (res.status && res.data) {
        setPages(res.data);
      }
    } catch {
      toast.error('Gagal memuat daftar halaman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPages();
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Halaman Konten (Pages)
          </h2>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
            Kelola isi artikel lengkap, teks narasi, dan foto profil untuk halaman statis website Anda.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" asChild size="sm" className="gap-1.5 text-xs">
            <Link href="/admin/settings">
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan SEO Global</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="p-4 rounded-xl border border-lime-600/20 dark:border-brand/20 bg-lime-500/5 dark:bg-brand/5 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-lime-600 dark:text-brand shrink-0 mt-0.5" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed space-y-1">
          <p className="font-semibold text-[var(--text-primary)]">
            Perbedaan Menu &quot;Pages&quot; dan &quot;Pengaturan SEO&quot;:
          </p>
          <p>
            Menu <strong>Halaman (Pages)</strong> ini digunakan untuk mengedit <em>isi tulisan lengkap, artikel, dan foto profil utama</em> (seperti Halaman Tentang Saya, Kebijakan Privasi, dan Syarat Ketentuan). Untuk mengatur <em>judul Google Search &amp; Banner Sosial Media</em> secara keseluruhan, gunakan menu <strong>Pengaturan Situs &rarr; Tab SEO</strong>.
          </p>
        </div>
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 animate-pulse"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)]" />
              <div className="h-6 bg-[var(--bg-elevated)] rounded w-3/4" />
              <div className="h-16 bg-[var(--bg-elevated)] rounded w-full" />
              <div className="h-10 bg-[var(--bg-elevated)] rounded w-full pt-4" />
            </div>
          ))}
        </div>
      ) : pages.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[var(--border)] rounded-2xl p-8 space-y-3">
          <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
          <p className="text-sm font-semibold text-[var(--text-primary)]">Belum ada halaman</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div
              key={page.id}
              className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between space-y-5 hover:border-[var(--border-hover)] hover:shadow-md transition-all group"
            >
              <div className="space-y-4">
                {/* Header & Status */}
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] flex items-center justify-center text-lime-700 dark:text-brand group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    <span className="capitalize">{page.status}</span>
                  </span>
                </div>

                {/* Title & Slug */}
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                    {page.title}
                  </h3>
                  <div className="text-xs font-mono text-lime-700 dark:text-brand flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>/{page.slug}</span>
                  </div>
                </div>

                {/* Featured Photo Badge if available */}
                {page.image_url ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)]">
                    <ImageIcon className="w-3.5 h-3.5 text-lime-600 dark:text-brand shrink-0" />
                    <span className="truncate">Foto Profil / Utama Terpasang</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-[var(--text-muted)] italic">
                    Halaman teks standar (tanpa foto utama)
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center gap-2">
                <Button size="sm" asChild className="flex-1 gap-1.5 text-xs font-semibold">
                  <Link href={`/admin/pages/${page.id}/edit`}>
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Konten & Foto</span>
                  </Link>
                </Button>

                <a
                  href={`/${page.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors shadow-xs"
                  title="Buka Halaman Publik"
                >
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
