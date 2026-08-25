'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi, settingsApi } from '@/lib/api';
import { SiteSetting } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import { TurnstileWidget } from '@/components/shared/TurnstileWidget';
import { toast } from 'sonner';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [siteSetting, setSiteSetting] = useState<SiteSetting | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data?.site) {
        setSiteSetting(res.data.site);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Email dan password wajib diisi');
      return;
    }

    if (siteSetting?.turnstile_enabled && siteSetting?.turnstile_site_key && !turnstileToken) {
      toast.error('Mohon selesaikan verifikasi keamanan Cloudflare Turnstile.');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.login({
        email,
        password,
        cf_turnstile_token: turnstileToken,
      });
      if (res.status) {
        toast.success('Login berhasil! Mengalihkan ke dashboard...');
        window.location.href = '/admin/dashboard';
      } else {
        toast.error(res.message || 'Email atau password salah');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi ke server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-lime-500/5 dark:bg-brand/5 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 shadow-2xl space-y-6 relative z-10">
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 text-lime-700 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/20 mx-auto flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Admin Authentication</h1>
          <p className="text-xs text-[var(--text-secondary)]">
            Masuk ke panel manajemen portofolio Syahril Haryono
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@syahril.dev"
                required
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Password
              </label>
              <Link
                href="/admin/forgot-password"
                className="text-[11px] text-lime-700 dark:text-brand hover:underline font-medium"
              >
                Lupa kata sandi?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-9"
              />
            </div>
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

          <Button type="submit" disabled={loading} className="w-full gap-2 mt-2 font-bold shadow-lg shadow-brand/10">
            <span>{loading ? 'Memverifikasi...' : 'Masuk ke Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="pt-2 text-center">
          <span className="text-[11px] text-[var(--text-muted)]">
            Protected with HttpOnly session cookies & JWT rotation.
          </span>
        </div>
      </div>
    </div>
  );
}
