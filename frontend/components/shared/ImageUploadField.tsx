'use client';

import React, { useState } from 'react';
import { Media } from '@/types';
import { MediaLibrary } from './MediaLibrary';
import { Button } from '@/components/ui/Button';
import { Image as ImageIcon, Trash2, Copy, Check, FileText, UploadCloud, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ImageUploadFieldProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  onSelectMedia?: (media: Media) => void;
  thumbnailUrl?: string;
  mediumUrl?: string;
  originalUrl?: string;
  allowPdf?: boolean;
}

export function ImageUploadField({
  label = 'Gambar / Dokumen',
  value = '',
  onChange,
  onSelectMedia,
  thumbnailUrl,
  mediumUrl,
  originalUrl,
  allowPdf = true,
}: ImageUploadFieldProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [directInput, setDirectInput] = useState(false);

  const handleSelect = (media: Media) => {
    onChange(media.original_url || media.thumbnail_url);
    if (onSelectMedia) {
      onSelectMedia(media);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    const full = text.startsWith('http') ? text : `http://localhost:8080${text}`;
    navigator.clipboard.writeText(full);
    setCopiedUrl(label);
    toast.success(`URL ${label} disalin`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const isPdf = Boolean(value && value.toLowerCase().endsWith('.pdf'));
  const previewSrc = value.startsWith('http') ? value : `http://localhost:8080${value}`;

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setDirectInput(!directInput)}
            className="text-[11px] font-mono text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>{directInput ? 'Sembunyikan Input URL' : 'Input URL Manual / PDF'}</span>
          </button>
        </div>
      )}

      {directInput && (
        <div className="flex items-center gap-2 pb-1">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://example.com/certificate.pdf atau /storage/media/..."
            className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand font-mono"
          />
          {value && (
            <Button size="sm" variant="ghost" onClick={() => onChange('')}>
              Reset
            </Button>
          )}
        </div>
      )}

      {value ? (
        <div className="space-y-3">
          <div className="relative aspect-video max-w-sm rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)] group">
            {isPdf ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 p-4 text-center bg-lime-500/10 dark:bg-brand/10">
                <FileText className="w-10 h-10 text-lime-700 dark:text-brand" />
                <span className="text-xs font-mono font-bold text-[var(--text-primary)]">Dokumen PDF Terpilih</span>
                <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[200px]">{value}</span>
              </div>
            ) : (
              <img
                src={previewSrc}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            )}

            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <Button size="sm" variant="secondary" type="button" onClick={() => setModalOpen(true)}>
                Ganti
              </Button>
              <Button
                size="sm"
                variant="destructive"
                type="button"
                onClick={() => onChange('')}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {(thumbnailUrl || mediumUrl || originalUrl) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {thumbnailUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(thumbnailUrl, 'Thumbnail')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {copiedUrl === 'Thumbnail' ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Thumb</span>
                </button>
              )}
              {mediumUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(mediumUrl, 'Medium')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {copiedUrl === 'Medium' ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Medium</span>
                </button>
              )}
              {originalUrl && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(originalUrl, 'Original')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                >
                  {copiedUrl === 'Original' ? <Check className="w-3 h-3 text-lime-700 dark:text-brand" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Original</span>
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 border-dashed border-[var(--border-strong)] hover:border-lime-700 dark:hover:border-brand"
          >
            <UploadCloud className="w-4 h-4 text-lime-700 dark:text-brand" />
            <span>Pilih dari Media Library / Upload File</span>
          </Button>
        </div>
      )}

      <MediaLibrary
        open={modalOpen}
        onSelect={handleSelect}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
