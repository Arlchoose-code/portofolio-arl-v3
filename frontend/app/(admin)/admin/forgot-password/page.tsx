'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Mail, ArrowLeft, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authResetApi, settingsApi } from '@/lib/api';
import { SiteSetting } from '@/types';
import { TurnstileWidget } from '@/components/shared/TurnstileWidget';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data?.site) {
        setSiteSetting(res.data.site);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Silakan masukkan alamat email Anda.');
      return;
    }

    if (siteSetting?.turnstile_enabled && siteSetting?.turnstile_site_key && !turnstileToken) {
      toast.error('Mohon selesaikan verifikasi keamanan Cloudflare Turnstile.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authResetApi.forgotPassword(email.trim(), turnstileToken);
      if (res.status) {
        setSubmitted(true);
        toast.success('Instruksi reset kata sandi telah dikirim!');
      } else {
        toast.error(res.message || 'Gagal mengirim instruksi reset kata sandi.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)] selection:bg-brand selection:text-black relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 dark:bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 sm:p-10 shadow-2xl relative z-10 space-y-6 backdrop-blur-xl"
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 text-lime-700 dark:text-brand mx-auto flex items-center justify-center border border-lime-500/20 shadow-xs mb-3">
            <Mail className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Lupa Kata Sandi?
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Masukkan alamat email admin Anda yang terdaftar. Kami akan mengirimkan tautan reset kata sandi aman melalui Brevo.
          </p>
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-4 py-4"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand mx-auto flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Periksa Email Anda
            </h3>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Jika alamat <strong className="font-mono text-[var(--text-primary)]">{email}</strong> terdaftar, tautan reset kata sandi telah dikirimkan. Tautan hanya berlaku selama <strong>1 jam</strong>.
            </p>

            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/admin/login" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Halaman Login</span>
              </Link>
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                <span>Alamat Email Admin</span>
              </label>
              <Input
                type="email"
                placeholder="admin@syahril.dev"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                className="text-sm"
              />
            </div>

            {/* Cloudflare Turnstile Smart CAPTCHA */}
            {siteSetting?.turnstile_enabled && siteSetting?.turnstile_site_key && (
              <div className="pt-2">
                <TurnstileWidget
                  siteKey={siteSetting.turnstile_site_key}
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken('')}
                />
              </div>
            )}

            <Button
              type="submit"
              disabled={submitting}
              className="w-full gap-2 font-bold py-2.5 shadow-lg shadow-brand/10"
            >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim Email...</span>
                </>
              ) : (
                <>
                  <span>Kirim Tautan Reset</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </Button>

            <div className="text-center pt-2">
              <Link
                href="/admin/login"
                className="text-xs text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand font-medium inline-flex items-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Kembali ke Halaman Login</span>
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
