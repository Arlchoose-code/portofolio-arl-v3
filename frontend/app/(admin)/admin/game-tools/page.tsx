'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { gameToolsApi, toolSettingsApi } from '@/lib/api';
import { GameTool, ToolSetting, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import {
  Gamepad2,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  KeyRound,
  Binary,
  Layers,
  Settings2,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

// Preset Metadata & Badges
const DEFAULT_TOOL_META: Record<string, { badge: string; badge_color: string }> = {
  'qris-manipulator': {
    badge: 'EMVCo Dynamic',
    badge_color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
  },
  'game-checker': {
    badge: '30 Game Resmi',
    badge_color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  'youtube-downloader': {
    badge: 'MP4 / MP3 HD',
    badge_color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
  '2fa-generator': {
    badge: 'RFC 6238 TOTP',
    badge_color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
  },
  base64: {
    badge: 'Text & File',
    badge_color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
  },
  'password-generator': {
    badge: 'Secure Crypto',
    badge_color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
};

const BADGE_PRESETS = [
  { label: '✨ Baru', value: 'Baru', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { label: '🔥 Hot / Populer', value: 'Populer', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
  { label: '⚡ Super Cepat', value: 'Super Cepat', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
  { label: '🔒 Aman', value: 'Aman & Enkripsi', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
  { label: '💳 EMVCo Dynamic', value: 'EMVCo Dynamic', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  { label: '🎮 30 Game', value: '30 Game Resmi', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
  { label: '🎬 MP4 / MP3', value: 'MP4 / MP3 HD', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  { label: '🛠️ Gratis', value: '100% Gratis', color: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
];

const COLOR_PRESETS = [
  { name: 'Hijau', value: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-500' },
  { name: 'Merah', value: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', dot: 'bg-rose-500' },
  { name: 'Kuning', value: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', dot: 'bg-amber-500' },
  { name: 'Biru', value: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20', dot: 'bg-indigo-500' },
  { name: 'Cyan', value: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20', dot: 'bg-cyan-500' },
  { name: 'Ungu', value: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', dot: 'bg-purple-500' },
  { name: 'Abu-abu', value: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700', dot: 'bg-slate-500' },
];

export default function AdminGameToolsPage() {
  const [activeTab, setActiveTab] = useState<'games' | 'settings'>('games');
  const [games, setGames] = useState<GameTool[]>([]);
  const [toolSettings, setToolSettings] = useState<ToolSetting[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 20 });
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Tool Settings Editing States
  const [editingTool, setEditingTool] = useState<ToolSetting | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    slug: string;
    tool_type: string;
    description: string;
    category: string;
    badge: string;
    badge_color: string;
    is_popular: boolean;
    is_enabled: boolean;
  }>({
    name: '',
    slug: '',
    tool_type: '',
    description: '',
    category: 'Developer Tools',
    badge: '',
    badge_color: COLOR_PRESETS[0].value,
    is_popular: false,
    is_enabled: true,
  });
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [savingTool, setSavingTool] = useState(false);

  // Extract all existing unique categories
  const existingCategories = useMemo(() => {
    const defaultList = ['Financial Tools', 'Gaming Tools', 'Media Tools', 'Security Tools', 'Developer Tools'];
    const dynamicList = toolSettings.map((s) => s.category).filter(Boolean);
    return Array.from(new Set([...defaultList, ...dynamicList]));
  }, [toolSettings]);

  const fetchGames = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await gameToolsApi.list(p || params);
    if (res.status) {
      setGames(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  const fetchToolSettings = async () => {
    const res = await toolSettingsApi.list();
    if (res.status && res.data) {
      setToolSettings(res.data);
    }
  };

  useEffect(() => {
    fetchGames(params);
    fetchToolSettings();

    const onFocus = () => {
      fetchGames(params);
      fetchToolSettings();
    };
    const onVisibility = () => {
      if (!document.hidden) {
        fetchGames(params);
        fetchToolSettings();
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [params]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await gameToolsApi.delete(deleteId);
    if (res.status) {
      toast.success('Game berhasil dihapus');
      setGames((prev) => prev.filter((g) => g.id !== deleteId));
      setDeleteId(null);
    } else {
      toast.error('Gagal menghapus game');
    }
  };

  const handleToggleGame = async (game: GameTool) => {
    const res = await gameToolsApi.toggleActive(game.id);
    if (res.status) {
      toast.success(`Status ${game.name} berhasil diperbarui`);
      setGames((prev) =>
        prev.map((g) => (g.id === game.id ? { ...g, is_active: !g.is_active } : g))
      );
    } else {
      toast.error('Gagal mengubah status game');
    }
  };

  const handleOpenEdit = (tool: ToolSetting) => {
    setEditingTool(tool);
    const defaultMeta = DEFAULT_TOOL_META[tool.slug] || DEFAULT_TOOL_META[tool.tool_type || ''] || { badge: '', badge_color: COLOR_PRESETS[0].value };
    const currentCategory = tool.category || 'Developer Tools';

    setEditForm({
      name: tool.name || '',
      slug: tool.slug || '',
      tool_type: tool.tool_type || tool.slug || '',
      description: tool.description || '',
      category: currentCategory,
      badge: tool.badge !== undefined && tool.badge !== '' ? tool.badge : (defaultMeta.badge || ''),
      badge_color: tool.badge_color || defaultMeta.badge_color || COLOR_PRESETS[0].value,
      is_popular: Boolean(tool.is_popular),
      is_enabled: tool.is_enabled !== false,
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTool) return;

    if (!editForm.name.trim()) {
      toast.error('Nama tool tidak boleh kosong!');
      return;
    }

    const finalCategory = isCustomCategory && customCategoryInput.trim()
      ? customCategoryInput.trim()
      : editForm.category.trim() || 'Developer Tools';

    const cleanSlug = editForm.slug.trim() ? slugify(editForm.slug) : slugify(editForm.name);

    const payload = {
      ...editForm,
      slug: cleanSlug,
      category: finalCategory,
    };

    setSavingTool(true);
    try {
      const res = await toolSettingsApi.update(editingTool.slug, payload);
      if (res.status && res.data) {
        toast.success(`Konfigurasi tool "${payload.name}" berhasil disimpan.`);
        setToolSettings((prev) =>
          prev.map((s) => (s.id === editingTool.id || s.slug === editingTool.slug ? { ...s, ...res.data } : s))
        );
        setEditingTool(null);
      } else {
        toast.error(res.message || 'Gagal menyimpan perubahan tool.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSavingTool(false);
    }
  };

  const handleToggleToolPopular = async (setting: ToolSetting) => {
    const nextPopular = !setting.is_popular;
    // Optimistic update
    setToolSettings((prev) =>
      prev.map((s) => (s.slug === setting.slug ? { ...s, is_popular: nextPopular } : s))
    );

    const res = await toolSettingsApi.togglePopular(setting.slug);
    if (res.status) {
      toast.success(
        `Tool "${setting.name}" ${nextPopular ? 'ditandai sebagai POPULER ⭐' : 'dihapus dari status populer'}`
      );
    } else {
      toast.error('Gagal mengubah status populer');
      fetchToolSettings();
    }
  };

  const handleToggleToolSetting = async (setting: ToolSetting) => {
    const nextEnabled = !setting.is_enabled;
    setToolSettings((prev) =>
      prev.map((s) => (s.slug === setting.slug ? { ...s, is_enabled: nextEnabled } : s))
    );

    const res = await toolSettingsApi.toggle(setting.slug);
    if (res.status) {
      toast.success(`Tool "${setting.name}" berhasil ${nextEnabled ? 'diaktifkan' : 'dinonaktifkan'}`);
    } else {
      toast.error('Gagal mengubah status tool');
      fetchToolSettings();
    }
  };

  const columns: Column<GameTool>[] = [
    {
      header: 'Nama Game & Kode',
      accessor: (game) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center font-bold text-xs shrink-0">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-[var(--text-primary)]">{game.name}</div>
            <div className="font-mono text-[11px] text-[var(--text-muted)]">{game.game_code}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Parameter ID',
      accessor: (game) => (
        <div className="text-xs space-y-0.5">
          <div className="text-[var(--text-primary)] font-medium">
            User ID: <span className="text-[var(--text-secondary)]">{game.user_id_label || 'User ID'}</span>
          </div>
          {game.has_zone_id && (
            <div className="text-lime-700 dark:text-brand font-mono text-[11px]">
              + {game.has_server_list ? 'Server Dropdown' : (game.zone_id_label || 'Zone ID')}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (game) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)]">
          {game.category || 'General'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: (game) => (
        <button
          type="button"
          onClick={() => handleToggleGame(game)}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all border ${
            game.is_active
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
              : 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
          }`}
          title="Klik untuk mengubah status aktif"
        >
          {game.is_active ? 'Aktif' : 'Nonaktif'}
        </button>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (game) => (
        <div className="flex items-center justify-end gap-2">
          <Button asChild variant="ghost" size="sm" className="h-8 px-2">
            <Link href={`/admin/game-tools/${game.id}/edit`}>
              <Edit className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteId(game.id)}
            className="h-8 px-2 text-red-400 hover:text-red-500 hover:bg-red-500/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Kelola Web Tools & Game</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Kontrol status aktif seluruh tools publik, sesuaikan nama & deskripsi, tambah kategori baru, dan kelola badge populer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="secondary" size="sm">
            <Link href="/tools" target="_blank" className="gap-1.5">
              <span>Buka Halaman Tools</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/admin/game-tools/new" className="gap-1.5">
              <Plus className="w-4 h-4" />
              <span>Tambah Game</span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar sm:flex-wrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'games'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Daftar Game Checker ({games.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
            activeTab === 'settings'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Settings2 className="w-4 h-4" />
          <span>Pengaturan & Saklar Tools Global ({toolSettings.length})</span>
        </button>
      </div>

      {/* Tab 1: Games List */}
      {activeTab === 'games' && (
        <DataTable
          columns={columns}
          data={games}
          meta={meta}
          isLoading={loading}
          onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
          searchPlaceholder="Cari nama game atau kode..."
          createHref="/admin/game-tools/new"
          createLabel="Tambah Game"
        />
      )}

      {/* Tab 2: Global Tool Settings */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
            <span className="text-base">💡</span>
            <div>
              <strong>Panduan Pengaturan Tools:</strong>
              <p className="mt-0.5 opacity-90">
                Klik tombol <strong>⭐ Populer</strong> untuk menampilkan tanda unggulan.
                Klik tombol <strong>✏️ Edit</strong> untuk mengganti Nama, Deskripsi, Kategori (bisa buat kategori baru), atau memilih Badge yang menarik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {toolSettings.map((tool) => {
              const defaultMeta = DEFAULT_TOOL_META[tool.slug] || { badge: '', badge_color: '' };
              const currentBadge = tool.badge || defaultMeta.badge;
              const currentBadgeColor = tool.badge_color || defaultMeta.badge_color || COLOR_PRESETS[0].value;

              return (
                <div
                  key={tool.slug}
                  className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] flex flex-col justify-between gap-4 shadow-sm hover:border-[var(--border-strong)] transition-all"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-[var(--text-primary)]">{tool.name}</span>
                          {tool.is_popular && (
                            <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                              ⭐ Populer
                            </span>
                          )}
                          {currentBadge && (
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${currentBadgeColor}`}>
                              {currentBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-base)] text-[var(--text-muted)] border border-[var(--border)]">
                            /{tool.slug}
                          </span>
                          <span className="text-[11px] text-[var(--text-muted)] font-medium">
                            {tool.category || 'Developer Tools'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleToolSetting(tool)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 transition-all border ${
                          tool.is_enabled
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500/20'
                        }`}
                        title="Klik untuk mengubah status aktif/nonaktif tool"
                      >
                        {tool.is_enabled ? 'Aktif (ON)' : 'Mati (OFF)'}
                      </button>
                    </div>

                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                    <button
                      type="button"
                      onClick={() => handleToggleToolPopular(tool)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        tool.is_popular
                          ? 'bg-amber-500/15 border-amber-500/40 text-amber-700 dark:text-amber-400'
                          : 'bg-[var(--bg-base)] border-[var(--border)] text-[var(--text-secondary)] hover:text-amber-600 hover:border-amber-400'
                      }`}
                    >
                      <span>⭐</span>
                      <span>{tool.is_popular ? 'Tool Populer' : 'Jadikan Populer'}</span>
                    </button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(tool)}
                      className="h-8 gap-1.5 text-xs font-bold"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit Info & Badge</span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Tool Modal */}
      {editingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Sticky Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0 bg-[var(--bg-surface)]">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">Edit Konfigurasi Tool</h3>
                <p className="text-xs text-[var(--text-secondary)] font-mono">/{editingTool.slug}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingTool(null)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-base)] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Live Card Preview Box */}
                <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <span>👁️</span> Pratinjau Tampilan Publik
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      {isCustomCategory && customCategoryInput.trim() ? customCategoryInput.trim() : editForm.category}
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-sm text-[var(--text-primary)] font-bold">
                          {editForm.name || 'Nama Tool'}
                        </strong>
                        {editForm.is_popular && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                            ⭐ Populer
                          </span>
                        )}
                        {editForm.badge && (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${editForm.badge_color}`}>
                            {editForm.badge}
                          </span>
                        )}
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                        {editForm.is_enabled ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {editForm.description || 'Deskripsi tool akan tampil di sini...'}
                    </p>
                  </div>
                </div>

                {/* Tool Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Nama Tool</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setEditForm((prev) => {
                        const isAutoSlug = !prev.slug || prev.slug === slugify(prev.name);
                        return {
                          ...prev,
                          name: newName,
                          slug: isAutoSlug ? slugify(newName) : prev.slug,
                        };
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500"
                  />
                </div>

                {/* Slug URL Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Slug URL Akses</label>
                    <button
                      type="button"
                      onClick={() => setEditForm((prev) => ({ ...prev, slug: slugify(prev.name) }))}
                      className="text-[11px] font-bold text-lime-700 dark:text-brand hover:underline"
                    >
                      🔄 Sinkronkan dengan Nama
                    </button>
                  </div>
                  <div className="flex items-center rounded-xl bg-[var(--bg-base)] border border-[var(--border)] px-3 focus-within:ring-2 focus-within:ring-lime-500">
                    <span className="text-xs font-mono text-[var(--text-muted)] select-none">/tools/</span>
                    <input
                      type="text"
                      required
                      value={editForm.slug}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, slug: slugify(e.target.value) }))}
                      placeholder="contoh-nama-tool"
                      className="w-full py-2.5 bg-transparent border-0 text-xs font-mono font-bold text-[var(--text-primary)] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Category (With Dynamic New Category Addition) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-[var(--text-primary)]">Kategori Tool</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) {
                          setCustomCategoryInput('');
                        }
                      }}
                      className="text-[11px] font-bold text-lime-700 dark:text-brand hover:underline"
                    >
                      {isCustomCategory ? '← Pilih dari Kategori Yang Ada' : '+ Buat Kategori Baru'}
                    </button>
                  </div>

                  {isCustomCategory ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={customCategoryInput}
                        onChange={(e) => setCustomCategoryInput(e.target.value)}
                        placeholder="Ketik nama kategori baru (contoh: AI Tools, Converter, Utilities)..."
                        className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border-2 border-lime-500 text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        Kategori baru ini akan otomatis muncul sebagai tab filter di halaman publik /tools.
                      </span>
                    </div>
                  ) : (
                    <select
                      value={editForm.category}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setIsCustomCategory(true);
                          setCustomCategoryInput('');
                        } else {
                          setEditForm((prev) => ({ ...prev, category: e.target.value }));
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500"
                    >
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="__new__">+ Tambah Kategori Baru...</option>
                    </select>
                  )}
                </div>

                {/* Badge Section with Clear Presets and Helper Note */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)]">
                        Badge / Label Kartu (Opsional)
                      </label>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Label kecil di pojok kartu untuk menarik perhatian pengunjung.
                      </p>
                    </div>
                    {editForm.badge && (
                      <button
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, badge: '' }))}
                        className="text-[10px] font-bold text-red-500 hover:underline"
                      >
                        Hapus Badge
                      </button>
                    )}
                  </div>

                  {/* Badge Preset Chips (One-click fill) */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] mr-1">Pilihan Cepat:</span>
                    {BADGE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            badge: p.value,
                            badge_color: p.color,
                          }))
                        }
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                          editForm.badge === p.value
                            ? 'bg-lime-500/20 text-lime-700 dark:text-brand border-lime-500/40 shadow-xs'
                            : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Badge Input & Color Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1.5">
                    <div className="sm:col-span-7">
                      <input
                        type="text"
                        value={editForm.badge}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, badge: e.target.value }))}
                        placeholder="Atau ketik badge kustom (contoh: ⚡ Cepat)"
                        className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500"
                      />
                    </div>

                    <div className="sm:col-span-5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-[var(--text-muted)] mr-1">Warna:</span>
                      {COLOR_PRESETS.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setEditForm((prev) => ({ ...prev, badge_color: c.value }))}
                          title={`Pilih warna ${c.name}`}
                          className={`w-5 h-5 rounded-full ${c.dot} transition-transform flex items-center justify-center ${
                            editForm.badge_color === c.value
                              ? 'ring-2 ring-offset-2 ring-lime-500 scale-110'
                              : 'opacity-70 hover:opacity-100 hover:scale-105'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-strong)] transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.is_popular}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, is_popular: e.target.checked }))}
                      className="rounded text-amber-500 focus:ring-amber-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">⭐ Tool Populer</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">Tanda bintang emas</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] cursor-pointer hover:border-[var(--border-strong)] transition-all">
                    <input
                      type="checkbox"
                      checked={editForm.is_enabled}
                      onChange={(e) => setEditForm((prev) => ({ ...prev, is_enabled: e.target.checked }))}
                      className="rounded text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-[var(--text-primary)] block">Status Aktif (ON)</span>
                      <span className="text-[10px] text-[var(--text-muted)] block">Dapat diakses publik</span>
                    </div>
                  </label>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Deskripsi Tool</label>
                  <textarea
                    rows={3}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full p-3.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border)] text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500 resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border)] shrink-0 bg-[var(--bg-surface)]">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingTool(null)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingTool}
                  className="bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] font-bold"
                >
                  {savingTool ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Game"
        description="Apakah Anda yakin ingin menghapus konfigurasi game ini? Akun pemain game ini tidak akan dapat diperiksa lagi."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
