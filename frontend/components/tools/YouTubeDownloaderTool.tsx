'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video,
  Music,
  Download,
  Link as LinkIcon,
  RefreshCw,
  Check,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Play,
  Film,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { youtubeToolApi } from '@/lib/api';
import { YouTubeConvertResult, ToolSetting } from '@/types';

interface YouTubeDownloaderToolProps {
  toolSetting?: ToolSetting | null;
}

export function YouTubeDownloaderTool({ toolSetting }: YouTubeDownloaderToolProps = {}) {
  const [urlInput, setUrlInput] = useState('');
  const [format, setFormat] = useState<'mp4' | 'mp3'>('mp4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YouTubeConvertResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrlInput(text.trim());
        toast.success('Link berhasil ditempel dari clipboard');
      }
    } catch {
      toast.error('Gagal mengakses clipboard');
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = urlInput.trim();
    if (!cleanUrl) {
      toast.error('Masukkan link video YouTube terlebih dahulu.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setResult(null);

    try {
      const res = await youtubeToolApi.convert(cleanUrl, format);
      if (res.status && res.data) {
        setResult(res.data);
        toast.success('Video berhasil diproses! Siap diunduh.');
      } else {
        setErrorMsg(res.message || 'Gagal memproses video YouTube. Coba lagi.');
      }
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          'Video tidak dapat diproses atau URL tidak valid. Pastikan link video YouTube sudah benar.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUrlInput('');
    setResult(null);
    setErrorMsg(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-3xl mx-auto space-y-8"
    >
      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-rose-500/10 via-red-500/5 to-transparent dark:from-rose-500/15 dark:via-red-500/10 border border-rose-500/20 shadow-2xs"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-red-500/25 flex-shrink-0">
            <Video className="w-7 h-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold mb-1 border border-rose-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              HD Video & Audio Extractor
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {toolSetting?.name || 'YouTube Video & Audio Downloader'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {toolSetting?.description ||
                'Unduh video YouTube resolusi tinggi (MP4) atau ekstrak audio (MP3) secara cepat tanpa iklan.'}
            </p>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleConvert} className="mt-6 space-y-4">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[var(--text-muted)]">
              <LinkIcon className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Tempel link video YouTube (contoh: https://www.youtube.com/watch?v=... atau https://youtu.be/...)"
              className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all shadow-2xs"
              disabled={loading}
            />
            <div className="absolute right-2 flex items-center gap-1.5">
              {!urlInput ? (
                <button
                  type="button"
                  onClick={handlePaste}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border)] transition-colors"
                >
                  Paste
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setUrlInput('')}
                  className="px-2.5 py-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  Hapus
                </button>
              )}
            </div>
          </div>

          {/* Format Selector Pills */}
          <div className="flex items-center justify-between flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-1.5 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setFormat('mp4')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  format === 'mp4'
                    ? 'bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Film className="w-4 h-4" />
                Video (MP4)
              </button>
              <button
                type="button"
                onClick={() => setFormat('mp3')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  format === 'mp3'
                    ? 'bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] shadow-xs'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Music className="w-4 h-4" />
                Audio (MP3)
              </button>
            </div>

            <Button
              type="submit"
              disabled={loading || !urlInput.trim()}
              className="bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold px-6 py-3 rounded-2xl shadow-lg shadow-lime-500/20 dark:shadow-brand/20 transition-all gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memproses Video...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Konversi & Download
                </>
              )}
            </Button>
          </div>
        </form>
      </motion.div>

      {/* Error Banner */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Gagal Memproses Video</p>
              <p className="mt-0.5 text-xs text-red-700/80 dark:text-red-300/80">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Card */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="rounded-3xl p-6 sm:p-8 bg-[var(--bg-surface)] border border-[var(--border)] shadow-xl overflow-hidden relative"
          >
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              {/* Thumbnail */}
              <div className="w-full sm:w-56 h-36 sm:h-32 rounded-2xl overflow-hidden bg-[var(--bg-elevated)] flex-shrink-0 relative shadow-md">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-red-600/90 text-white flex items-center justify-center shadow-lg">
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  </div>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/80 text-white text-[10px] font-bold uppercase tracking-wider">
                  {result.format.toUpperCase()}
                </div>
              </div>

              {/* Info & Action */}
              <div className="flex-1 w-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-lime-500/10 border border-lime-500/20 text-lime-700 dark:text-brand text-xs font-bold mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Siap Diunduh ({result.format.toUpperCase()})
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] leading-snug line-clamp-2">
                    {result.title}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1 font-mono">
                    ID Video: {result.video_id}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <a
                    href={result.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold text-sm shadow-lg shadow-lime-500/20 dark:shadow-brand/20 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Unduh Sekarang ({result.format.toUpperCase()})
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    className="rounded-2xl text-xs"
                  >
                    Download Video Lain
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guide Info */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-2">
        <p className="font-bold text-[var(--text-primary)]">💡 Petunjuk Penggunaan:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Mendukung semua format link YouTube (Desktop URL, Mobile Link `youtu.be`, dan YouTube Shorts).</li>
          <li>Pilih format <strong>MP4</strong> untuk menyimpan video lengkap, atau <strong>MP3</strong> untuk mengekstrak lagu/audio saja.</li>
          <li>Pengunduhan berjalan secara langsung dan aman tanpa dialihkan ke iklan pihak ketiga.</li>
        </ul>
      </div>
    </motion.div>
  );
}

export default YouTubeDownloaderTool;
