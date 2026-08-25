'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, RefreshCw, Copy, Check, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ToolSetting } from '@/types';

interface PasswordGeneratorToolProps {
  toolSetting?: ToolSetting | null;
}

export function PasswordGeneratorTool({ toolSetting }: PasswordGeneratorToolProps = {}) {
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(false);
  const [password, setPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = () => {
    let chars = '';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const num = '0123456789';
    const sym = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (includeUppercase) chars += upper;
    if (includeLowercase) chars += lower;
    if (includeNumbers) chars += num;
    if (includeSymbols) chars += sym;

    if (avoidAmbiguous) {
      chars = chars.replace(/[il1Lo0O]/g, '');
    }

    if (!chars) {
      toast.error('Pilih setidaknya satu opsi karakter!');
      return;
    }

    let result = '';
    const cryptoArray = new Uint32Array(length);
    window.crypto.getRandomValues(cryptoArray);

    for (let i = 0; i < length; i++) {
      result += chars[cryptoArray[i] % chars.length];
    }

    setPassword(result);
    setHistory((prev) => [result, ...prev.filter((p) => p !== result).slice(0, 4)]);
  };

  useEffect(() => {
    generate();
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols, avoidAmbiguous]);

  const strengthInfo = useMemo(() => {
    let score = 0;
    if (length >= 8) score += 1;
    if (length >= 12) score += 1;
    if (length >= 16) score += 1;
    if (includeUppercase && includeLowercase) score += 1;
    if (includeNumbers) score += 1;
    if (includeSymbols) score += 1;

    if (score <= 2) return { label: 'Sangat Lemah', color: 'bg-red-500', percent: 20 };
    if (score === 3) return { label: 'Lemah', color: 'bg-amber-500', percent: 40 };
    if (score === 4) return { label: 'Cukup Kuat', color: 'bg-yellow-500', percent: 60 };
    if (score === 5) return { label: 'Kuat', color: 'bg-lime-500', percent: 80 };
    return { label: 'Sangat Kuat (Aman)', color: 'bg-emerald-500', percent: 100 };
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  const handleCopy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    setCopied(true);
    toast.success('Password berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Generator Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="lg:col-span-8 space-y-6"
        >
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute -right-16 -top-16 w-48 h-48 bg-amber-500/5 dark:bg-brand/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 relative z-10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold mb-1 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5" />
                  CSPRNG Cryptographic Entropy
                </div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  {toolSetting?.name || 'Password Generator & Strength Meter'}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
                  {toolSetting?.description ||
                    'Buat kata sandi acak dengan kriptografi Web Crypto API yang aman.'}
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
            </div>

            {/* Generated Output Display */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                  Hasil Password Acak
                </span>
                <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                  {length} Karakter
                </span>
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={password}
                  className="w-full pl-4 pr-28 py-3.5 rounded-2xl font-mono text-sm tracking-wider bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none shadow-2xs"
                />
                <div className="absolute right-2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={generate}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors"
                    title="Buat Ulang (Regenerate)"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleCopy(password)}
                    className="gap-1.5 h-9 rounded-xl bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] font-bold text-xs shadow-md shadow-lime-500/20 dark:shadow-brand/20 transition-all"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Tersalin' : 'Salin'}</span>
                  </Button>
                </div>
              </div>

              {/* Strength Meter Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-[var(--text-muted)]">Kekuatan:</span>
                  <span className="font-bold text-[var(--text-primary)]">{strengthInfo.label}</span>
                </div>
                <div className="h-2.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                  <div
                    className={`h-full ${strengthInfo.color} transition-all duration-300 rounded-full`}
                    style={{ width: `${strengthInfo.percent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Customization Options */}
            <div className="pt-4 border-t border-[var(--border)] space-y-6 relative z-10">
              {/* Length Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[var(--text-primary)]">
                  <span>Panjang Password</span>
                  <span className="font-mono px-2.5 py-0.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)]">
                    {length}
                  </span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="48"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  className="w-full accent-lime-600 dark:accent-brand cursor-pointer"
                />
              </div>

              {/* Checkbox Options Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Huruf Besar (A-Z)', checked: includeUppercase, set: setIncludeUppercase },
                  { label: 'Huruf Kecil (a-z)', checked: includeLowercase, set: setIncludeLowercase },
                  { label: 'Angka (0-9)', checked: includeNumbers, set: setIncludeNumbers },
                  { label: 'Simbol Khusus (!@#$%^&*)', checked: includeSymbols, set: setIncludeSymbols },
                  { label: 'Hindari Ambigu (i, l, 1, o, 0)', checked: avoidAmbiguous, set: setAvoidAmbiguous },
                ].map((opt, idx) => (
                  <label
                    key={idx}
                    className="flex items-center gap-2.5 p-3 rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] cursor-pointer hover:border-lime-500/40 transition-colors shadow-2xs"
                  >
                    <input
                      type="checkbox"
                      checked={opt.checked}
                      onChange={(e) => opt.set(e.target.checked)}
                      className="rounded accent-lime-600 dark:accent-brand w-4 h-4 cursor-pointer"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: History Panel */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-4 space-y-4"
        >
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
              <Clock className="w-4 h-4 text-lime-700 dark:text-brand" />
              <span>Riwayat Generasi</span>
            </h3>

            {history.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)] text-center py-6">Belum ada riwayat.</p>
            ) : (
              <div className="space-y-2">
                {history.map((pw, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-mono min-w-0"
                  >
                    <span className="truncate max-w-[180px] text-[var(--text-secondary)]">{pw}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pw)}
                      className="p-1 rounded text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand transition-colors"
                      title="Salin Password Ini"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default PasswordGeneratorTool;
