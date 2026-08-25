'use client';

import React, { useEffect, useState } from 'react';
import { mediaApi } from '@/lib/api';
import { Media } from '@/types';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from './ConfirmDialog';
import { Image as ImageIcon, UploadCloud, X, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

interface MediaLibraryProps {
  open: boolean;
  onSelect: (media: Media) => void;
  onClose: () => void;
}

export function MediaLibrary({ open, onSelect, onClose }: MediaLibraryProps) {
  const [tab, setTab] = useState<'library' | 'upload'>('library');
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [deleteMediaId, setDeleteMediaId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMedia = async () => {
    setLoading(true);
    const res = await mediaApi.list({ per_page: 50 });
    if (res.status) {
      setMediaList(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      fetchMedia();
    }
  }, [open]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    try {
      const res = await mediaApi.upload(file);
      if (res.status) {
        toast.success('Media berhasil diunggah!');
        await fetchMedia();
        setTab('library');
      } else {
        toast.error(res.message || 'Gagal mengunggah media');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengunggah media');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const executeDeleteMedia = async () => {
    if (!deleteMediaId) return;
    setIsDeleting(true);

    const res = await mediaApi.delete(deleteMediaId);
    setIsDeleting(false);

    if (res.status) {
      toast.success('Gambar berhasil dihapus dari pustaka');
      setMediaList((prev) => prev.filter((m) => m.id !== deleteMediaId));
      if (selectedMedia?.id === deleteMediaId) setSelectedMedia(null);
      setDeleteMediaId(null);
    } else {
      toast.error('Gagal menghapus gambar');
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="w-full max-w-4xl h-[640px] flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Media Library</h2>
              <div className="flex items-center bg-[var(--bg-base)] p-1 rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setTab('library')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tab === 'library'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Pustaka Media
                </button>
                <button
                  type="button"
                  onClick={() => setTab('upload')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    tab === 'upload'
                      ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  Upload Baru
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {tab === 'upload' ? (
              <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] rounded-2xl p-12 text-center hover:border-[var(--brand)] transition-colors">
                <UploadCloud className="w-16 h-16 text-[var(--text-muted)] mb-4 animate-bounce" />
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
                  Pilih atau seret gambar ke sini
                </h3>
                <p className="text-xs text-[var(--text-muted)] mb-6 max-w-sm">
                  Format yang didukung: JPEG, PNG, WebP, GIF, dan iPhone HEIC/HEIF. Gambar akan otomatis dikompresi dan dikonversi ke WebP multi-tier.
                </p>
                <label className="cursor-pointer">
                  <Button variant="default" disabled={uploading} asChild>
                    <span>{uploading ? 'Mengunggah...' : 'Pilih File Gambar'}</span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*,image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>
            ) : loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-video rounded-xl bg-[var(--bg-elevated)] animate-pulse" />
                ))}
              </div>
            ) : mediaList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-muted)] space-y-3">
                <ImageIcon className="w-12 h-12 stroke-[1.5]" />
                <p className="text-sm">Belum ada media. Silakan upload gambar pertama Anda.</p>
                <Button variant="outline" size="sm" onClick={() => setTab('upload')}>
                  Upload Gambar
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {mediaList.map((media) => {
                  const isSelected = selectedMedia?.id === media.id;
                  return (
                    <div
                      key={media.id}
                      onClick={() => setSelectedMedia(media)}
                      className={`group relative aspect-video rounded-xl overflow-hidden border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-lime-600 dark:border-brand ring-2 ring-lime-500/40 dark:ring-brand/40 shadow-lg'
                          : 'border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <img
                        src={getMediaUrl(media.thumbnail_url || media.original_url)}
                        alt={media.original_name}
                        className="w-full h-full object-cover"
                      />
                      {isSelected && (
                        <div className="absolute top-2 right-2 p-1 rounded-full bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-md">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteMediaId(media.id);
                        }}
                        className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all"
                        title="Hapus media"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent text-[10px] text-zinc-300 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                        {media.original_name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {tab === 'library' && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-surface)]">
              <span className="text-xs text-[var(--text-muted)]">
                {selectedMedia ? `Terpilih: ${selectedMedia.original_name}` : 'Pilih gambar untuk disisipkan'}
              </span>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Batal
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  disabled={!selectedMedia}
                  onClick={() => {
                    if (selectedMedia) {
                      onSelect(selectedMedia);
                      onClose();
                    }
                  }}
                >
                  Pilih Media
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteMediaId !== null}
        title="Hapus Media"
        description="Apakah Anda yakin ingin menghapus gambar ini dari media library?"
        isLoading={isDeleting}
        onConfirm={executeDeleteMedia}
        onCancel={() => setDeleteMediaId(null)}
      />
    </>
  );
}
