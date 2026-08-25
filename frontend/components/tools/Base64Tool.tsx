'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Binary, ArrowRightLeft, Copy, Check, UploadCloud, FileCode, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ToolSetting } from '@/types';

interface Base64ToolProps {
  toolSetting?: ToolSetting | null;
}

export function Base64Tool({ toolSetting }: Base64ToolProps = {}) {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (mode === 'encode') {
        const bytes = new TextEncoder().encode(input);
        const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join('');
        setOutput(btoa(binString));
      } else {
        const binString = atob(input.trim());
        const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
        setOutput(new TextDecoder().decode(bytes));
      }
    } catch {
      setOutput('Error: Format string tidak valid untuk operasi ini.');
    }
  }, [input, mode]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setFileBase64(b64);
      setInput(b64);
      toast.success(`Berkas ${file.name} berhasil diubah ke Base64 Data URL`);
    };
    reader.readAsDataURL(file);
  };

  const handleSwap = () => {
    setInput(output);
    setMode(mode === 'encode' ? 'decode' : 'encode');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success('Hasil Base64 berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-xl relative overflow-hidden"
      >
        {/* Ambient Glow */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-cyan-500/5 dark:bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6 mb-6 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-md">
              <Binary className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-xs font-bold mb-1 border border-cyan-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                UTF-8 & Binary Compatible
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                {toolSetting?.name || 'Base64 Encoder & Decoder'}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                {toolSetting?.description ||
                  'Konversi teks & file ke format Base64 secara instan dengan dukungan UTF-8 penuh.'}
              </p>
            </div>
          </div>

          {/* Mode Switcher with Smooth Motion Bubble */}
          <div className="flex items-center gap-1.5 p-1.5 bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border)]">
            <button
              type="button"
              onClick={() => setMode('encode')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap z-10 ${
                mode === 'encode'
                  ? 'text-white dark:text-[#0a0a0a]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mode === 'encode' && (
                <motion.div
                  layoutId="activeBase64Tab"
                  className="absolute inset-0 bg-lime-600 dark:bg-brand rounded-xl -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>Encode (Teks → Base64)</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('decode')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap z-10 ${
                mode === 'decode'
                  ? 'text-white dark:text-[#0a0a0a]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {mode === 'decode' && (
                <motion.div
                  layoutId="activeBase64Tab"
                  className="absolute inset-0 bg-lime-600 dark:bg-brand rounded-xl -z-10 shadow-xs"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span>Decode (Base64 → Teks)</span>
            </button>
          </div>
        </div>

        {/* Input & Output Boxes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          {/* Input Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {mode === 'encode' ? 'Teks Input (Plaintext)' : 'Input Base64 String'}
              </label>
              <label className="cursor-pointer text-xs text-lime-700 dark:text-brand font-bold hover:underline flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload File</span>
                <input type="file" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <textarea
              rows={8}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={mode === 'encode' ? 'Ketik teks yang ingin di-encode...' : 'Tempel string Base64 di sini...'}
              className="w-full p-4 rounded-2xl font-mono text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all resize-none shadow-2xs"
            />
            {fileName && (
              <p className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <FileCode className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                File dimuat: {fileName}
              </p>
            )}
          </div>

          {/* Output Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                {mode === 'encode' ? 'Hasil Encode (Base64)' : 'Hasil Decode (Plaintext)'}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="text-xs text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand flex items-center gap-1 font-semibold transition-colors"
                  title="Tukar Input & Output"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Tukar</span>
                </button>
              </div>
            </div>
            <textarea
              rows={8}
              readOnly
              value={output}
              className="w-full p-4 rounded-2xl font-mono text-xs bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] resize-none focus:outline-none shadow-2xs"
            />
            <Button
              type="button"
              onClick={handleCopy}
              disabled={!output || output.startsWith('Error')}
              className="w-full py-3 rounded-2xl bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold text-xs shadow-lg shadow-lime-500/20 dark:shadow-brand/20 gap-1.5 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Hasil'}</span>
            </Button>
          </div>
        </div>

        {/* Image Preview if base64 file is an image */}
        {fileBase64 && fileBase64.startsWith('data:image') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-6 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)]"
          >
            <p className="text-xs font-bold text-[var(--text-primary)] mb-2">Pratinjau Gambar:</p>
            <img
              src={fileBase64}
              alt="Base64 Preview"
              className="max-h-48 rounded-xl object-contain border border-[var(--border)]"
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Base64Tool;
