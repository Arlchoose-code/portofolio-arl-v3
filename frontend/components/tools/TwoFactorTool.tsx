'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Copy, Check, Info, KeyRound, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { ToolSetting } from '@/types';

interface TwoFactorToolProps {
  toolSetting?: ToolSetting | null;
}

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32ToUint8Array(base32: string): Uint8Array {
  const cleaned = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  const length = cleaned.length;
  let bits = 0;
  let value = 0;
  let index = 0;
  const result = new Uint8Array(Math.floor((length * 5) / 8));

  for (let i = 0; i < length; i++) {
    const val = BASE32_CHARS.indexOf(cleaned.charAt(i));
    if (val === -1) continue;
    value = (value << 5) | val;
    bits += 5;
    if (bits >= 8) {
      result[index++] = (value >>> (bits - 8)) & 255;
      bits -= 8;
    }
  }
  return result;
}

async function generateTOTP(secret: string): Promise<string> {
  try {
    const keyBytes = base32ToUint8Array(secret);
    if (keyBytes.length === 0) return '------';

    const epoch = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(epoch / 30);

    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setUint32(4, timeStep, false);

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );

    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);
    const hmacBytes = new Uint8Array(signature);

    const offset = hmacBytes[hmacBytes.length - 1] & 0x0f;
    const binary =
      ((hmacBytes[offset] & 0x7f) << 24) |
      ((hmacBytes[offset + 1] & 0xff) << 16) |
      ((hmacBytes[offset + 2] & 0xff) << 8) |
      (hmacBytes[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  } catch {
    return '------';
  }
}

export function TwoFactorTool({ toolSetting }: TwoFactorToolProps = {}) {
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('------');
  const [timeLeft, setTimeLeft] = useState(30);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const updateCode = async () => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTimeLeft(remaining);

      if (secret.trim()) {
        const c = await generateTOTP(secret.trim());
        setCode(c);
      } else {
        setCode('------');
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  const handleCopy = (text: string) => {
    if (!text || text === '------') return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Kode 2FA berhasil disalin ke clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  const progress = (timeLeft / 30) * 100;
  const strokeColor = timeLeft <= 5 ? '#ef4444' : timeLeft <= 10 ? '#f59e0b' : '#84cc16';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden"
      >
        {/* Subtle Ambient Light */}
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-indigo-500/5 dark:bg-brand/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-1.5 border border-indigo-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              RFC 6238 TOTP Standard
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] tracking-tight">
              {toolSetting?.name || '2FA Authenticator & TOTP Generator'}
            </h2>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-0.5">
              {toolSetting?.description ||
                'Standar RFC 6238 (Kompatibel dengan Google Auth, Microsoft, GitHub, AWS).'}
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Secret Key Input */}
        <div className="space-y-2 relative z-10">
          <label className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] flex items-center justify-between">
            <span>Secret Key (Base32)</span>
            <span className="font-mono text-[10px] text-[var(--text-muted)]">Karakter A-Z, 2-7</span>
          </label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value.toUpperCase().replace(/\s+/g, ''))}
            placeholder="Masukkan Secret Key (Contoh: JBSWY3DPEHPK3PXP)"
            className="w-full px-4 py-3.5 rounded-2xl text-sm font-mono tracking-widest uppercase bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-lime-500/50 focus:border-lime-500 transition-all shadow-2xs"
          />
        </div>

        {/* Live OTP Display Box with Spring Reveal */}
        <motion.div
          layout
          className="rounded-3xl border border-lime-500/30 dark:border-brand/40 bg-gradient-to-br from-lime-500/10 via-emerald-500/5 to-transparent p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-md"
        >
          <div className="text-center sm:text-left space-y-1">
            <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
              Kode Verifikasi Real-Time
            </span>
            <div className="text-4xl sm:text-5xl font-black font-mono tracking-widest text-[var(--text-primary)]">
              {code.slice(0, 3)} {code.slice(3)}
            </div>
          </div>

          {/* Countdown Circular Timer & Copy Button */}
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-[var(--bg-elevated)]"
                  fill="transparent"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke={strokeColor}
                  strokeWidth="4"
                  strokeDasharray={150.79}
                  strokeDashoffset={150.79 - (150.79 * progress) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-linear"
                  fill="transparent"
                />
              </svg>
              <span className="absolute text-xs font-bold font-mono text-[var(--text-primary)]">
                {timeLeft}s
              </span>
            </div>

            <Button
              type="button"
              onClick={() => handleCopy(code)}
              className="gap-2 h-11 px-5 text-xs font-bold rounded-2xl bg-lime-600 hover:bg-lime-500 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-[#0a0a0a] shadow-lg shadow-lime-500/20 dark:shadow-brand/20 transition-all"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
            </Button>
          </div>
        </motion.div>

        {/* Security Note */}
        <div className="p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)] flex items-start gap-2.5">
          <Info className="w-4 h-4 text-lime-700 dark:text-brand flex-shrink-0 mt-0.5" />
          <span>
            <strong>Keamanan 100% Lokal:</strong> Kode OTP dihitung langsung di peramban Anda menggunakan Web Crypto API. Secret key tidak pernah dikirimkan ke server luar.
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TwoFactorTool;
