'use client';

import React, { useState, useEffect } from 'react';
import { mediaApi } from '@/lib/api';
import { Media } from '@/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { UploadCloud, Trash2, Copy, Check, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl, getAbsoluteMediaUrl } from '@/lib/utils';

export default function AdminMediaPage() {
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    const res = await mediaApi.list({ per_page: 100 });
    if (res.status) {
      setMediaList(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const res = await mediaApi.upload(file);
    setUploading(false);

    if (res.status) {
      toast.success('Media berhasil diunggah!');
      fetchMedia();
    } else {
      toast.error(res.message || 'Gagal mengunggah media');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await mediaApi.delete(deleteId);
    if (res.status) {
      toast.success('Media dihapus');
      setMediaList((prev) => prev.filter((m) => m.id !== deleteId));
      setDeleteId(null);
    } else {
      toast.error('Gagal menghapus');
    }
  };

  const copyUrl = (url: string, id: number, type: string) => {
    const full = getAbsoluteMediaUrl(url);
    navigator.clipboard.writeText(full);
    const key = `${id}-${type}`;
    setCopiedLabel(key);
    toast.success(`URL ${type} disalin`);
    setTimeout(() => setCopiedLabel(null), 2000);
  };

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Media Library & Assets</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Pusat penyimpanan aset gambar terenkripsi multi-tier WebP (Original, Medium 900px, Thumbnail 400px).
        </p>
      </div>

      {/* Upload Box */}
      <div className="rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-lime-600 dark:hover:border-brand p-8 bg-[var(--bg-surface)] text-center transition-colors flex flex-col items-center justify-center gap-3">
        <UploadCloud className="w-12 h-12 text-[var(--text-muted)] animate-bounce" />
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Unggah Berkas Baru</h3>
          <p className="text-xs text-[var(--text-muted)]">Mendukung JPEG, PNG, dan WebP hingga 50MB</p>
        </div>
        <label className="cursor-pointer">
          <Button variant="default" disabled={uploading} asChild className="bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a]">
            <span>{uploading ? 'Mengompres & Mengunggah...' : 'Pilih File'}</span>
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
          ))}
        </div>
      ) : mediaList.length === 0 ? (
        <div className="p-12 text-center text-sm text-[var(--text-muted)] border border-[var(--border)] rounded-2xl bg-[var(--bg-surface)]">
          Belum ada media yang diunggah.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {mediaList.map((media) => (
            <div
              key={media.id}
              className="group rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden space-y-2 p-2 hover:border-[var(--border-hover)] transition-all"
            >
              <div className="aspect-video rounded-lg overflow-hidden bg-[var(--bg-elevated)] relative">
                <img
                  src={getMediaUrl(media.thumbnail_url || media.original_url)}
                  alt={media.original_name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setDeleteId(media.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="px-1 space-y-1">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate" title={media.original_name}>
                  {media.original_name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  {media.width}x{media.height} • {(media.size_bytes / 1024).toFixed(0)} KB
                </div>

                {/* Copy Buttons */}
                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => copyUrl(media.original_url, media.id, 'Orig')}
                    className="flex-1 py-1 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--bg-elevated)] hover:text-lime-700 dark:hover:text-brand transition-colors flex items-center justify-center gap-1 font-semibold"
                  >
                    {copiedLabel === `${media.id}-Orig` ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                    <span>Orig</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyUrl(media.medium_url || media.original_url, media.id, 'Med')}
                    className="flex-1 py-1 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--bg-elevated)] hover:text-lime-700 dark:hover:text-brand transition-colors flex items-center justify-center gap-1 font-semibold"
                  >
                    {copiedLabel === `${media.id}-Med` ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                    <span>Med</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => copyUrl(media.thumbnail_url || media.original_url, media.id, 'Thumb')}
                    className="flex-1 py-1 rounded text-[10px] font-mono border border-[var(--border)] bg-[var(--bg-elevated)] hover:text-lime-700 dark:hover:text-brand transition-colors flex items-center justify-center gap-1 font-semibold"
                  >
                    {copiedLabel === `${media.id}-Thumb` ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                    <span>Thumb</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Media"
        description="Apakah Anda yakin ingin menghapus berkas media ini beserta seluruh versinya (thumbnail/medium)?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
