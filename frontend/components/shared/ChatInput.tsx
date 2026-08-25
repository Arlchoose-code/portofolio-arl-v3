'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, onClear, disabled = false }: ChatInputProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (disabled || !input.trim()) return;
    onSend(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  return (
    <div className="p-3 border-t border-[var(--border)] bg-[var(--bg-surface)]">
      <div className="flex items-end gap-2 bg-[var(--bg-base)] rounded-xl border border-[var(--border)] p-2 focus-within:border-[var(--brand)] transition-colors">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanya apa saja tentang Syahril..."
          rows={1}
          disabled={disabled}
          className="flex-1 bg-transparent resize-none outline-none text-base md:text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] max-h-28 py-1 px-1"
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onClear}
            disabled={disabled}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-[var(--accent-soft)] transition-colors"
            title="Hapus riwayat chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={disabled || !input.trim()}
            className="p-2 rounded-lg bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:text-[#0a0a0a] dark:hover:bg-[#d8ef37] disabled:opacity-40 transition-colors shadow-sm"
            title="Kirim pesan"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
