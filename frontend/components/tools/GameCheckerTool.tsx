'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gamepad2,
  Search,
  CheckCircle2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Info,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Flame,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { gameToolsApi } from '@/lib/api';
import { GameTool, GameCheckResult, GameServerOption, ToolSetting } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface GameCheckerToolProps {
  initialSlug?: string;
  isStandalonePage?: boolean;
  toolSetting?: ToolSetting | null;
}

export function GameCheckerTool({ initialSlug, isStandalonePage = false, toolSetting }: GameCheckerToolProps) {
  const router = useRouter();
  const [games, setGames] = useState<GameTool[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameTool | null>(null);

  // Search and dynamic category filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Form input states
  const [userId, setUserId] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<GameCheckResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch games list
  useEffect(() => {
    let mounted = true;
    const fetchGames = async () => {
      try {
        const res = await gameToolsApi.listPublicGames();
        if (mounted && res.status && res.data) {
          const activeList = res.data.filter((g) => g.is_active);
          setGames(activeList);

          if (initialSlug) {
            const match = activeList.find((g) => g.slug === initialSlug || g.game_code === initialSlug);
            if (match) {
              setSelectedGame(match);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load games', err);
      } finally {
        if (mounted) setLoadingGames(false);
      }
    };
    fetchGames();
    return () => {
      mounted = false;
    };
  }, [initialSlug]);

  // Extract unique categories dynamically from DB games
  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>();
    games.forEach((g) => {
      if (g.category && g.category.trim()) {
        cats.add(g.category.trim());
      }
    });
    return ['all', ...Array.from(cats)];
  }, [games]);

  // Filter games dynamically by search & database-driven category
  const filteredGames = useMemo(() => {
    return games.filter((g) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchQuery =
          g.name.toLowerCase().includes(q) ||
          g.slug.toLowerCase().includes(q) ||
          g.game_code.toLowerCase().includes(q) ||
          (g.user_id_label && g.user_id_label.toLowerCase().includes(q)) ||
          (g.category && g.category.toLowerCase().includes(q));
        if (!matchQuery) return false;
      }

      // 2. Dynamic Category Filter from DB
      if (selectedCategory !== 'all') {
        const itemCategory = (g.category || 'General').toLowerCase();
        if (itemCategory !== selectedCategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [games, searchQuery, selectedCategory]);

  // Parse server options if available
  const parsedServerOptions = useMemo<GameServerOption[]>(() => {
    if (!selectedGame?.has_server_list || !selectedGame.server_options) return [];
    try {
      const raw = JSON.parse(selectedGame.server_options);
      if (Array.isArray(raw)) {
        return raw
          .map((item) => {
            if (typeof item === 'string') {
              return { label: item, value: item.toLowerCase().replace(/\s+/g, '_') };
            }
            if (item && typeof item === 'object') {
              const label = item.label || item.name || item.value || '';
              const value = item.value || item.id || item.label || '';
              return { label: String(label), value: String(value) };
            }
            return null;
          })
          .filter((opt): opt is GameServerOption => opt !== null && (Boolean(opt.label) || Boolean(opt.value)));
      }
    } catch {
      // Fallback for comma-separated or tokenized string
      const tokens = selectedGame.server_options
        .replace(/[\[\]{}"':]/g, ' ')
        .split(/[\n,]+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0 && t.toLowerCase() !== 'label' && t.toLowerCase() !== 'value');

      return tokens.map((token) => ({
        label: token,
        value: token.toLowerCase().replace(/\s+/g, '_'),
      }));
    }
    return [];
  }, [selectedGame]);

  const mainToolUrl = `/tools/${toolSetting?.slug || 'game-checker'}`;

  const handleSelectGame = (game: GameTool) => {
    setSelectedGame(game);
    setUserId('');
    setZoneId(game.has_server_list && parsedServerOptions.length > 0 ? parsedServerOptions[0].value : '');
    setResult(null);
    setErrorMsg(null);
    router.push(`${mainToolUrl}/${game.slug}`);
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame) return;

    if (!userId.trim()) {
      toast.error(`Masukkan ${selectedGame.user_id_label} akun Anda.`);
      return;
    }

    if (selectedGame.has_zone_id && !zoneId.trim()) {
      toast.error(`Masukkan ${selectedGame.zone_id_label || 'Zone ID'} akun Anda.`);
      return;
    }

    setChecking(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await gameToolsApi.checkNickname(selectedGame.game_code, userId.trim(), zoneId.trim());
      if (res.status && res.data) {
        setResult(res.data);
        toast.success(`Akun ditemukan: ${res.data.nickname}`);
      } else {
        setErrorMsg(res.message || 'Akun tidak ditemukan. Periksa kembali ID Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Akun tidak ditemukan. Periksa kembali parameter ID Anda.');
    } finally {
      setChecking(false);
    }
  };

  const handleCopyNickname = () => {
    if (!result?.nickname) return;
    navigator.clipboard.writeText(result.nickname);
    setCopied(true);
    toast.success('Nickname berhasil disalin ke clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loadingGames) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-lime-600 dark:text-brand" />
      </div>
    );
  }

  // =========================================================================
  // VIEW A: DEDICATED GAME DETAIL / CHECKER CARD (When a specific game is active)
  // =========================================================================
  if (selectedGame) {
    // Other popular games excluding the active one
    const otherGames = games.filter((g) => g.id !== selectedGame.id).slice(0, 6);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto space-y-10"
      >
        {/* Back Link */}
        <div>
          <Link
            href={mainToolUrl}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs font-bold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:border-lime-500/40 shadow-2xs transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Katalog Semua Game</span>
          </Link>
        </div>

        {/* Main Checker Hero Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-3xl p-6 sm:p-10 bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl relative overflow-hidden"
        >
          {/* Subtle Ambient Light */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-lime-500/5 dark:bg-brand/5 rounded-full blur-3xl pointer-events-none" />

          {/* Header with Game Logo */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 pb-8 border-b border-[var(--border)] relative z-10">
            {/* Game Logo Image */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)] flex-shrink-0 shadow-lg relative group"
            >
              {selectedGame.icon_url ? (
                <img
                  src={selectedGame.icon_url}
                  alt={selectedGame.name}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                  <Gamepad2 className="w-12 h-12" />
                </div>
              )}
            </motion.div>

            {/* Game Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  {selectedGame.category || 'Game Resmi'}
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--bg-elevated)] text-[var(--text-muted)] text-xs font-semibold">
                  {selectedGame.has_zone_id ? (selectedGame.zone_id_label ? `Memerlukan ID + ${selectedGame.zone_id_label}` : 'ID + Zone ID') : (selectedGame.user_id_label || 'User ID Saja')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight">
                {selectedGame.name}
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
                {selectedGame.description || `Periksa nama akun / nickname resmi pemain ${selectedGame.name} secara instan.`}
              </p>
            </div>
          </div>

          {/* Form Input Section */}
          <form onSubmit={handleCheck} className="mt-8 space-y-6 relative z-10">
            <div className={selectedGame.has_zone_id ? 'grid grid-cols-1 sm:grid-cols-12 gap-5' : 'space-y-4'}>
              {/* User ID Field */}
              <div className={selectedGame.has_zone_id ? 'sm:col-span-7' : 'w-full'}>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                  {selectedGame.user_id_label} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={selectedGame.user_id_placeholder || 'Contoh: 123456789'}
                  className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all font-mono shadow-2xs"
                  disabled={checking}
                />
              </div>

              {/* Zone ID / Server Field */}
              {selectedGame.has_zone_id && (
                <div className="sm:col-span-5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-2">
                    {selectedGame.zone_id_label || 'Zone ID'} <span className="text-red-500">*</span>
                  </label>
                  {selectedGame.has_server_list && parsedServerOptions.length > 0 ? (
                    <select
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all shadow-2xs"
                      disabled={checking}
                    >
                      {parsedServerOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      placeholder={selectedGame.zone_id_placeholder || 'Contoh: 2527'}
                      className="w-full px-4 py-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all font-mono shadow-2xs"
                      disabled={checking}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Guide Info Banner */}
            {selectedGame.guide_text && (
              <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-3">
                <Info className="w-4 h-4 text-lime-700 dark:text-brand flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{selectedGame.guide_text}</span>
              </div>
            )}

            {/* Submit Button (Unified Lime Brand) */}
            <Button
              type="submit"
              disabled={checking || !userId.trim()}
              className="w-full py-4 bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold rounded-2xl shadow-lg shadow-lime-500/20 dark:shadow-brand/20 transition-all text-sm gap-2"
            >
              {checking ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memeriksa Nickname Akun...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Cek Nickname Sekarang
                </>
              )}
            </Button>
          </form>

          {/* Error Alert */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pemeriksaan Akun Gagal</p>
                  <p className="mt-0.5 text-red-700/80 dark:text-red-300/80 leading-relaxed">{errorMsg}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Result Card with Spring Animation */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="mt-8 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-lime-500/15 via-emerald-500/10 to-transparent border border-lime-500/30 dark:border-brand/40 relative overflow-hidden shadow-lg"
              >
                <div className="flex items-center justify-between gap-4 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    Akun Berhasil Diverifikasi
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyNickname}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-surface)] text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] shadow-2xs transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-lime-700 dark:text-brand" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Tersalin!' : 'Salin Nickname'}
                  </button>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-[var(--text-muted)] font-medium">Nickname Akun:</p>
                  <h4 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] tracking-tight mt-1 break-all">
                    {result.nickname}
                  </h4>
                </div>

                <div className="mt-6 pt-4 border-t border-lime-500/20 dark:border-brand/20 flex flex-wrap items-center gap-6 text-xs text-[var(--text-secondary)]">
                  <span>ID: <strong className="text-[var(--text-primary)] font-mono">{result.user_id}</strong></span>
                  {result.zone_id && (
                    <span>Zone/Server: <strong className="text-[var(--text-primary)] font-mono">{result.zone_id}</strong></span>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Other Games Section */}
        {otherGames.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4 pt-6 border-t border-[var(--border)]"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Game Populer Lainnya
              </h3>
              <Link
                href={mainToolUrl}
                className="text-xs font-bold text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
              >
                Lihat Semua ({games.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {otherGames.map((g, idx) => (
                <motion.div
                  key={g.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  whileHover={{ y: -5 }}
                >
                  <Link
                    href={`${mainToolUrl}/${g.slug}`}
                    className="group p-3 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-lime-500/40 shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center h-full"
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-[var(--bg-elevated)] mb-2.5 relative flex-shrink-0 shadow-2xs group-hover:scale-108 transition-transform">
                      {g.icon_url ? (
                        <img src={g.icon_url} alt={g.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-lime-600 text-white">
                          <Gamepad2 className="w-7 h-7" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-bold text-[var(--text-primary)] line-clamp-1 group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                      {g.name}
                    </p>
                    <span className="text-[10px] text-[var(--text-muted)] mt-0.5">
                      {g.category || (g.has_zone_id ? 'ID + Zone' : 'ID Saja')}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // =========================================================================
  // VIEW B: MAIN CATALOG OF GAMES (Dynamic Category Tabs from DB & Live Search)
  // =========================================================================
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-8"
    >
      {/* Header Info */}
      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Validasi Akun Multi-Game</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Pilih Game untuk Cek Nickname
        </h2>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl leading-relaxed">
          Pemeriksaan nickname resmi dan verifikasi ID pemain secara real-time untuk berbagai game online populer.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 pt-2"
      >
        {/* Dynamic Category Tabs from DB with clean wrapping on desktop and swipe on mobile */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar flex-1 min-w-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {dynamicCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count =
              cat === 'all'
                ? games.length
                : games.filter((g) => (g.category || 'General').toLowerCase() === cat.toLowerCase()).length;
            const label = cat === 'all' ? `Semua Game (${count})` : `${cat} (${count})`;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`relative px-3.5 py-1.5 rounded-2xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 z-10 ${
                  isActive
                    ? 'text-white dark:text-[#0a0a0a]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeGameFilterTab"
                    className="absolute inset-0 bg-lime-600 dark:bg-brand rounded-2xl -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative w-full md:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama game atau genre..."
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

      {/* Grid of Game Cards */}
      <motion.div
        layout
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredGames.map((game, idx) => (
            <motion.div
              key={game.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                duration: 0.35,
                delay: idx * 0.03,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <Link
                href={`${mainToolUrl}/${game.slug}`}
                className="flex flex-col h-full p-4 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)] hover:border-lime-500/40 shadow-2xs hover:shadow-xl hover:shadow-lime-500/5 dark:hover:shadow-brand/5 transition-all duration-300 relative overflow-hidden"
              >
                {/* Game Thumbnail Logo */}
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[var(--bg-elevated)] relative mb-3 shadow-inner">
                  {game.icon_url ? (
                    <img
                      src={game.icon_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
                      <Gamepad2 className="w-10 h-10" />
                    </div>
                  )}

                  {/* Dynamic Category Badge Overlay */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                    <span className="px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-xs text-[9px] font-bold text-white uppercase tracking-wider">
                      {game.category || (game.has_zone_id ? 'ID + Zone' : 'ID Saja')}
                    </span>
                  </div>
                </div>

                {/* Game Title & Parameter Info */}
                <div className="flex-1 flex flex-col justify-between space-y-1">
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors line-clamp-1 leading-snug">
                      {game.name}
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 mt-0.5">
                      {game.user_id_label}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] font-bold text-[var(--text-secondary)] group-hover:text-lime-700 dark:group-hover:text-brand">
                    <span>Cek Akun</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredGames.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16 p-8 rounded-3xl bg-[var(--bg-surface)] border border-[var(--border)]"
        >
          <Gamepad2 className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <h3 className="text-lg font-bold text-[var(--text-primary)]">Game Tidak Ditemukan</h3>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
            Tidak ada game yang sesuai dengan kriteria filter saat ini.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

export default GameCheckerTool;
