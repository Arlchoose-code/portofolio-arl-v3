'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/Input';
import { AlertCircle } from 'lucide-react';

interface SlugFieldProps {
  value: string;
  onChange: (val: string) => void;
  sourceValue?: string;
  isEditMode?: boolean;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function SlugField({ value, onChange, sourceValue = '', isEditMode = false }: SlugFieldProps) {
  const [manualEdit, setManualEdit] = useState(isEditMode);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!isEditMode && !manualEdit && sourceValue) {
      const generated = slugify(sourceValue);
      if (generated !== value) {
        onChangeRef.current(generated);
      }
    }
  }, [sourceValue, isEditMode, manualEdit, value]);

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
        Slug URL
      </label>
      <div className="flex items-center gap-2">
        <span className="text-xs text-[var(--text-muted)] font-mono">/</span>
        <Input
          value={value}
          onChange={(e) => {
            setManualEdit(true);
            const val = slugify(e.target.value);
            if (val !== value) {
              onChangeRef.current(val);
            }
          }}
          placeholder="contoh-url-slug"
          className="font-mono text-sm"
        />
      </div>
      {isEditMode && (
        <div className="flex items-center gap-2 text-xs text-amber-400/90 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>Mengubah slug akan mengubah alamat URL konten ini.</span>
        </div>
      )}
    </div>
  );
}
