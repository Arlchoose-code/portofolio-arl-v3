'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Video,
  ShieldCheck,
  Binary,
  KeyRound,
  QrCode,
  Sparkles,
  ArrowRight,
  Search,
  Layers,
  Flame,
  X,
} from 'lucide-react';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { toolSettingsApi } from '@/lib/api';
import { ToolSetting } from '@/types';

interface ToolItem {
  slug: string;
  name: string;
  category: 'all' | 'gaming' | 'media' | 'security' | 'developer' | 'financial';
  categoryLabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge: string;
  badgeColor: string;
  accentGradient: string;
  isPopular?: boolean;
}

const ALL_TOOLS: ToolItem[] = [
  {
    slug: 'qris-manipulator',
    name: 'QRIS Data & Price Manipulator',
    category: 'financial',
    categoryLabel: 'Financial Tools',
    description:
      'Injeksi nominal kustom dan biaya layanan ke QRIS statis menjadi QRIS dinamis otomatis standar EMVCo.',
    icon: QrCode,
    href: '/tools/qris-manipulator',
    badge: 'EMVCo Dynamic',
    badgeColor: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    accentGradient: 'from-rose-500 to-red-600',
    isPopular: true,
  },
  {
    slug: 'game-checker',
    name: 'Cek Nickname Game Online',
    category: 'gaming',
    categoryLabel: 'Gaming Tools',
    description:
      'Pemeriksaan nickname dan verifikasi ID akun game online secara instan.',
    icon: Gamepad2,
    href: '/tools/game-checker',
    badge: '30 Game Resmi',
    badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    accentGradient: 'from-emerald-500 to-teal-600',
    isPopular: true,
  },
  {
    slug: 'youtube-downloader',
    name: 'YouTube Video & Audio Downloader',
    category: 'media',
    categoryLabel: 'Media Tools',
    description:
      'Unduh video YouTube resolusi tinggi (MP4) atau ekstraksi audio (MP3) secara instan tanpa iklan.',
    icon: Video,
    href: '/tools/youtube-downloader',
    badge: 'MP4 / MP3 HD',
    badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    accentGradient: 'from-red-500 to-pink-600',
    isPopular: true,
  },
  {
    slug: '2fa-generator',
    name: '2FA Authenticator & TOTP Generator',
    category: 'security',
    categoryLabel: 'Security Tools',
    description:
      'Generator kode Two-Factor Authentication 6-digit real-time dengan live circular countdown timer 30 detik.',
    icon: ShieldCheck,
    href: '/tools/2fa-generator',
    badge: 'RFC 6238 TOTP',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    accentGradient: 'from-blue-500 to-indigo-600',
  },
  {
    slug: 'base64',
    name: 'Base64 Encoder & Decoder',
    category: 'developer',
    categoryLabel: 'Developer Tools',
    description:
      'Konverter teks dan berkas ke format Base64 dan sebaliknya secara instan.',
    icon: Binary,
    href: '/tools/base64',
    badge: 'Text & File',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    accentGradient: 'from-cyan-500 to-teal-600',
  },
  {
    slug: 'password-generator',
    name: 'Password Generator & Strength Meter',
    category: 'security',
    categoryLabel: 'Security Tools',
    description:
      'Generator kata sandi acak dengan pengaturan panjang, simbol, angka, dan live entropy strength meter.',
    icon: KeyRound,
    href: '/tools/password-generator',
    badge: 'Secure Crypto',
    badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    accentGradient: 'from-amber-500 to-orange-600',
  },
];

interface ToolsHubClientProps {
  seoTitle?: string;
  seoDescription?: string;
  initialToolSettings?: ToolSetting[];
}

export function ToolsHubClient({
  seoTitle,
  seoDescription,
  initialToolSettings = [],
}: ToolsHubClientProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toolSettings, setToolSettings] = useState<ToolSetting[]>(initialToolSettings);
  const [loading, setLoading] = useState(initialToolSettings.length === 0);

  // Fetch latest settings from client side as backup
  useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await toolSettingsApi.getPublicToolSettings();
        if (isMounted && res.status && res.data) {
          setToolSettings(res.data);
        }
      } catch (err) {
        console.error('Failed to load tool settings:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (initialToolSettings.length === 0) {
      loadSettings();
    }
    return () => {
      isMounted = false;
    };
  }, [initialToolSettings]);

  // Map settings by tool_type / slug
  const settingsMap = useMemo(() => {
    const map: Record<string, ToolSetting> = {};
    toolSettings.forEach((setting) => {
      if (setting.tool_type) map[setting.tool_type] = setting;
      if (setting.slug) map[setting.slug] = setting;
    });
    return map;
  }, [toolSettings]);

  // Filter & merge tools by live database settings
  const allMergedTools = useMemo(() => {
    return ALL_TOOLS.map((baseTool) => {
      const live =
        toolSettings.find((s) => s.tool_type === baseTool.slug || s.slug === baseTool.slug) ||
        settingsMap[baseTool.slug];

      if (!live) return baseTool;
      const currentSlug = live.slug || baseTool.slug;

      return {
        ...baseTool,
        slug: currentSlug,
        href: `/tools/${currentSlug}`,
        name: live.name || baseTool.name,
        description: live.description || baseTool.description,
        categoryLabel: live.category || baseTool.categoryLabel,
        isPopular: live.is_popular !== undefined ? live.is_popular : baseTool.isPopular,
        badge: live.badge && live.badge.trim() ? live.badge : baseTool.badge,
        badgeColor: live.badge_color && live.badge_color.trim() ? live.badge_color : baseTool.badgeColor,
      };
    }).filter((tool) => {
      const live =
        toolSettings.find((s) => s.slug === tool.slug || s.tool_type === tool.slug) ||
        settingsMap[tool.slug];
      return live ? live.is_enabled : true;
    });
  }, [toolSettings, settingsMap]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allMergedTools.length };
    allMergedTools.forEach((t) => {
      const catKey = t.categoryLabel.toLowerCase().replace(/\s+/g, '-');
      counts[catKey] = (counts[catKey] || 0) + 1;
    });
    return counts;
  }, [allMergedTools]);

  // Available categories with live items
  const availableCategories = useMemo(() => {
    const unique = new Map<string, string>();
    unique.set('all', 'Semua Tools');

    allMergedTools.forEach((t) => {
      const catKey = t.categoryLabel.toLowerCase().replace(/\s+/g, '-');
      unique.set(catKey, t.categoryLabel);
    });

    return Array.from(unique.entries()).map(([id, label]) => ({
      id,
      label,
      count: categoryCounts[id] || 0,
    }));
  }, [allMergedTools, categoryCounts]);

  // Filtered tools
  const visibleTools = useMemo(() => {
    return allMergedTools.filter((tool) => {
      // 1. Category filter
      if (activeCategory !== 'all') {
        const catKey = tool.categoryLabel.toLowerCase().replace(/\s+/g, '-');
        if (catKey !== activeCategory) return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tool.name.toLowerCase().includes(q) ||
          tool.description.toLowerCase().includes(q) ||
          tool.categoryLabel.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [allMergedTools, activeCategory, searchQuery]);

  // Clean title for H1 (strip "| Syahril Haryono" if present in SEO title)
  const cleanTitle = useMemo(() => {
    if (seoTitle) {
      return seoTitle.split('|')[0].trim();
    }
    return 'Web Tools & Utilities';
  }, [seoTitle]);

  const displaySubtitle =
    seoDescription ||
    'Kumpulan perkakas daring gratis yang cepat, aman, dan tanpa iklan: QRIS Price Manipulator, Cek Nickname Game Online, YouTube Downloader, 2FA Authenticator, Base64 Converter, dan Password Generator.';

  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      {/* Breadcrumb */}
      <BreadcrumbWithJsonLD
        items={[
          { name: 'Tools', url: '/tools' },
        ]}
      />

      {/* Hero Header with Animated Entrance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Utilitas & Pengembang Online</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          {cleanTitle}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          {displaySubtitle}
        </p>
      </motion.div>

      {/* Filter Tabs & Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 pt-2"
      >
        {/* Category Pills with Smooth Motion Tab Bubble and clean responsive wrapping */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar flex-1 min-w-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {availableCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 z-10 ${
                  isActive
                    ? 'text-white dark:text-[#0a0a0a]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeToolCategory"
                    className="absolute inset-0 bg-lime-600 dark:bg-brand rounded-2xl -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive
                      ? 'bg-black/20 text-white dark:bg-black/20 dark:text-[#0a0a0a]'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                  }`}
                >
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari perkakas..."
            className="w-full pl-9 pr-8 py-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-lime-500/50 shadow-2xs transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>

      {/* Animated Tools Cards Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {visibleTools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.slug}
                layout
                initial={{ opacity: 0, y: 25, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                className="group"
              >
                <Link
                  href={tool.href}
                  className="flex flex-col justify-between h-full p-6 sm:p-7 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-lime-500/40 dark:hover:border-brand/40 shadow-2xs hover:shadow-xl hover:shadow-lime-500/5 dark:hover:shadow-brand/5 transition-all duration-300 relative overflow-hidden"
                >
                  {/* Subtle Background Glow */}
                  <div className="absolute -right-12 -top-12 w-32 h-32 bg-lime-500/5 dark:bg-brand/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500 pointer-events-none" />

                  {/* Top Badge & Icon */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-5">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${tool.accentGradient} text-white flex items-center justify-center shadow-md shadow-black/10 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tool.isPopular && (
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold border border-rose-500/20">
                            <Flame className="w-3 h-3" />
                            Populer
                          </span>
                        )}
                        {tool.badge && (
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${tool.badgeColor}`}
                          >
                            {tool.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors duration-200">
                      {tool.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 leading-relaxed line-clamp-3">
                      {tool.description}
                    </p>
                  </div>

                  {/* Footer Action */}
                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs font-bold text-[var(--text-secondary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                    <span>Buka Tool</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {visibleTools.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)]"
        >
          <Layers className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Tidak Ada Perkakas Ditemukan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Tidak ada perkakas yang cocok dengan filter kategori atau kata kunci pencarian Anda.
          </p>
        </motion.div>
      )}
    </div>
  );
}

export default ToolsHubClient;
