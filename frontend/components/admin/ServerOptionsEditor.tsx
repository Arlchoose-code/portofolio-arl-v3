'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, FileText, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface ServerOptionItem {
  id: string;
  label: string;
  value: string;
}

interface ServerOptionsEditorProps {
  value: string;
  onChange: (jsonValue: string) => void;
}

// Preset popular game servers for 1-click fill
const POPULAR_PRESETS: { name: string; options: { label: string; value: string }[] }[] = [
  {
    name: 'Nikke / Global MMO',
    options: [
      { label: 'Global', value: 'global' },
      { label: 'SEA', value: 'sea' },
      { label: 'North America (NA)', value: 'na' },
      { label: 'Japan (JP)', value: 'jp' },
      { label: 'Korea (KR)', value: 'kr' },
    ],
  },
  {
    name: 'HoYoverse (Genshin / HSR)',
    options: [
      { label: 'Asia Server', value: 'os_asia' },
      { label: 'America Server', value: 'os_usa' },
      { label: 'Europe Server', value: 'os_euro' },
      { label: 'TW, HK, MO Server', value: 'os_cht' },
    ],
  },
  {
    name: 'Dragon Nest / Ragnarok',
    options: [
      { label: 'Server 1', value: '1' },
      { label: 'Server 2', value: '2' },
      { label: 'Server 3', value: '3' },
      { label: 'Server 4', value: '4' },
    ],
  },
];

// Helper to safely parse raw string into ServerOptionItem array
function parseInitialValue(raw: string): ServerOptionItem[] {
  if (!raw || !raw.trim()) return [];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item, idx) => {
          if (typeof item === 'string') {
            return { id: `item-${idx}-${Date.now()}`, label: item, value: item.toLowerCase().replace(/\s+/g, '_') };
          }
          if (item && typeof item === 'object') {
            const label = item.label || item.name || item.value || '';
            const val = item.value || item.id || item.label || '';
            return {
              id: `item-${idx}-${Date.now()}`,
              label: String(label),
              value: String(val),
            };
          }
          return null;
        })
        .filter((item): item is ServerOptionItem => item !== null && (Boolean(item.label) || Boolean(item.value)));
    }
  } catch {
    // If invalid JSON (e.g. user pasted `[{"label": "SEA", "Global"...}]` or `SEA, Global, NA`), recover intelligently:
    const cleaned = raw.replace(/[\[\]{}"':]/g, ' ');
    const tokens = cleaned
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && t.toLowerCase() !== 'label' && t.toLowerCase() !== 'value');

    return tokens.map((token, idx) => ({
      id: `recovered-${idx}-${Date.now()}`,
      label: token,
      value: token.toLowerCase().replace(/\s+/g, '_'),
    }));
  }

  return [];
}

export function ServerOptionsEditor({ value, onChange }: ServerOptionsEditorProps) {
  const [items, setItems] = useState<ServerOptionItem[]>(() => parseInitialValue(value));
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkText, setBulkText] = useState('');
  const isInternalUpdate = useRef(false);

  // Sync internal state when external value prop changes from outside (e.g. on initial data fetch)
  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    setItems(parseInitialValue(value));
  }, [value]);

  // Update parent with serialized JSON
  const notifyChange = (newItems: ServerOptionItem[]) => {
    isInternalUpdate.current = true;
    setItems(newItems);

    const validOptions = newItems
      .filter((item) => item.label.trim() || item.value.trim())
      .map((item) => ({
        label: item.label.trim() || item.value.trim(),
        value: item.value.trim() || item.label.trim().toLowerCase().replace(/\s+/g, '_'),
      }));

    onChange(validOptions.length > 0 ? JSON.stringify(validOptions) : '');
  };

  const handleAddItem = () => {
    const newItem: ServerOptionItem = {
      id: `new-${Date.now()}`,
      label: '',
      value: '',
    };
    notifyChange([...items, newItem]);
  };

  const handleUpdateItem = (id: string, field: 'label' | 'value', text: string) => {
    const updated = items.map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, [field]: text };

      // Auto-suggest value when typing label if value is still empty or was synced
      if (field === 'label' && (!item.value || item.value === item.label.toLowerCase().replace(/\s+/g, '_'))) {
        next.value = text.toLowerCase().replace(/\s+/g, '_');
      }
      return next;
    });
    notifyChange(updated);
  };

  const handleDeleteItem = (id: string) => {
    const filtered = items.filter((item) => item.id !== id);
    notifyChange(filtered);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === items.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    notifyChange(newItems);
  };

  const handleApplyBulkText = () => {
    if (!bulkText.trim()) return;

    // Split by newline or comma
    const rawTokens = bulkText
      .split(/[\n,]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    const newParsed: ServerOptionItem[] = rawTokens.map((token, idx) => {
      // Check if token format is "Label : value" or "Label = value"
      if (token.includes(':') || token.includes('=')) {
        const parts = token.split(/[:=]/);
        const label = parts[0].trim();
        const val = parts[1].trim();
        return {
          id: `bulk-${idx}-${Date.now()}`,
          label: label || val,
          value: val || label.toLowerCase().replace(/\s+/g, '_'),
        };
      }

      return {
        id: `bulk-${idx}-${Date.now()}`,
        label: token,
        value: token.toLowerCase().replace(/\s+/g, '_'),
      };
    });

    notifyChange(newParsed);
    setBulkText('');
    setShowBulkInput(false);
  };

  const handleApplyPreset = (preset: (typeof POPULAR_PRESETS)[0]) => {
    const newItems: ServerOptionItem[] = preset.options.map((opt, idx) => ({
      id: `preset-${idx}-${Date.now()}`,
      label: opt.label,
      value: opt.value,
    }));
    notifyChange(newItems);
  };

  return (
    <div className="space-y-4 pt-1">
      {/* Header with Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <span>Daftar Pilihan Server / Zone</span>
            <span className="text-[11px] font-normal text-[var(--text-muted)] font-mono">
              ({items.length} pilihan server)
            </span>
          </label>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
            Atur nama server dan kode value yang akan muncul pada dropdown pemain.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowBulkInput(!showBulkInput)}
            className="text-xs gap-1.5 h-8 border-dashed"
          >
            <FileText className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
            <span>{showBulkInput ? 'Tutup Input Cepat' : '⚡ Input Cepat (Koma / Baris)'}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleAddItem}
            className="text-xs gap-1.5 h-8 bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:text-[#0a0a0a] font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Server</span>
          </Button>
        </div>
      </div>

      {/* Quick Bulk Input Box */}
      {showBulkInput && (
        <div className="p-4 rounded-xl border border-lime-500/30 bg-lime-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
              <span>Input Cepat Banyak Server Sekaligus</span>
            </span>
            <span className="text-[11px] text-[var(--text-muted)]">
              Pisahkan nama server dengan tanda koma <code>,</code> atau baris baru (Enter)
            </span>
          </div>
          <textarea
            rows={3}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder="Contoh: SEA, Global, North America, Japan, Korea"
            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border)] focus:border-lime-600 dark:focus:border-brand focus:outline-hidden text-[var(--text-primary)]"
          />
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-[var(--text-muted)]">Gunakan Template:</span>
              {POPULAR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] hover:border-lime-500 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleApplyBulkText}
              disabled={!bulkText.trim()}
              className="text-xs gap-1.5 h-7 bg-lime-600 text-white dark:bg-brand dark:text-[#0a0a0a] font-bold"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan ke Daftar</span>
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Server Rows Table */}
      {items.length === 0 ? (
        <div className="p-6 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)]/50 text-center space-y-3">
          <p className="text-xs text-[var(--text-muted)]">
            Belum ada opsi server yang ditambahkan.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleAddItem}
              className="text-xs gap-1.5 bg-lime-600 text-white dark:bg-brand dark:text-[#0a0a0a] font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Server Pertama</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleApplyPreset(POPULAR_PRESETS[0])}
              className="text-xs gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
              <span>Isi Template Nikke / MMO</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Column Header */}
          <div className="grid grid-cols-12 gap-3 px-3 py-1.5 text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase">
            <div className="col-span-1 text-center">No</div>
            <div className="col-span-6 sm:col-span-6">Nama / Label Tampilan (Contoh: Asia Server)</div>
            <div className="col-span-4 sm:col-span-4">Kode / Value Server (Contoh: os_asia)</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>

          {/* Item Rows */}
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="grid grid-cols-12 gap-3 items-center p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-lime-500/40 transition-colors shadow-2xs"
            >
              {/* Index & Reorder Controls */}
              <div className="col-span-1 flex items-center justify-center gap-1">
                <span className="text-xs font-mono font-bold text-[var(--text-muted)] w-4 text-center">
                  {idx + 1}
                </span>
                <div className="flex flex-col -space-y-1">
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-opacity"
                    title="Pindah ke atas"
                  >
                    <ArrowUp className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveItem(idx, 'down')}
                    disabled={idx === items.length - 1}
                    className="p-0.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-20 transition-opacity"
                    title="Pindah ke bawah"
                  >
                    <ArrowDown className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Label Input */}
              <div className="col-span-6 sm:col-span-6">
                <Input
                  value={item.label}
                  onChange={(e) => handleUpdateItem(item.id, 'label', e.target.value)}
                  placeholder="Contoh: Asia Server atau SEA"
                  className="h-9 text-xs"
                />
              </div>

              {/* Value Input */}
              <div className="col-span-4 sm:col-span-4">
                <Input
                  value={item.value}
                  onChange={(e) => handleUpdateItem(item.id, 'value', e.target.value)}
                  placeholder="Contoh: os_asia atau sea"
                  className="h-9 text-xs font-mono"
                />
              </div>

              {/* Delete Button */}
              <div className="col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                  title="Hapus Opsi Server"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {/* Quick Add Row Button */}
          <button
            type="button"
            onClick={handleAddItem}
            className="w-full py-2.5 rounded-xl border border-dashed border-[var(--border)] hover:border-lime-500/60 bg-[var(--bg-surface)]/30 hover:bg-lime-500/5 text-xs font-bold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Baris Server Lagi</span>
          </button>
        </div>
      )}
    </div>
  );
}
