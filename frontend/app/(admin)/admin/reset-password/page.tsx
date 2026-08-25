'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KeyRound, Lock, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { authResetApi } from '@/lib/api';
import { toast } from 'sonner';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Token reset kata sandi tidak ditemukan atau tidak valid.');
      return;
    }

    if (password.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await authResetApi.resetPassword(token, password);
      if (res.status) {
        setResetSuccess(true);
        toast.success('Kata sandi berhasil diatur ulang!');
      } else {
        toast.error(res.message || 'Gagal mengatur ulang kata sandi.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Tautan reset tidak valid atau telah kedaluwarsa.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-14 h-14 rounded-full bg-red-500/10 text-red-500 mx-auto flex items-center justify-center border border-red-500/20">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[var(--text-primary)]">
          Token Reset Tidak Ditemukan
        </h3>
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Tautan yang Anda gunakan tidak memiliki token reset yang valid. Silakan ajukan permintaan reset baru.
        </p>
        <Button asChild className="w-full mt-4">
          <Link href="/admin/forgot-password">
            Minta Tautan Reset Baru
          </Link>
        </Button>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-4 py-4"
      >
        <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand mx-auto flex items-center justify-center border border-emerald-500/20">
          <CheckCircle2 className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Kata Sandi Berhasil Diubah!
        </h3>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Kata sandi akun admin Anda telah berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru Anda.
        </p>

        <Button asChild className="w-full gap-2 font-bold mt-4 shadow-lg shadow-brand/10">
          <Link href="/admin/login">
            <span>Masuk ke Admin Panel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
          <span>Kata Sandi Baru</span>
        </label>
        <Input
          type="password"
          placeholder="Minimal 6 karakter"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={submitting}
          className="text-sm"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
          <KeyRound className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
          <span>Konfirmasi Kata Sandi Baru</span>
        </label>
        <Input
          type="password"
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={submitting}
          className="text-sm"
        />
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full gap-2 font-bold py-2.5 shadow-lg shadow-brand/10"
      >
        {submitting ? (
          <>
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Memperbarui Kata Sandi...</span>
          </>
        ) : (
          <>
            <span>Simpan Kata Sandi Baru</span>
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </Button>

      <div className="text-center pt-2">
        <Link
          href="/admin/login"
          className="text-xs text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand font-medium transition-colors"
        >
          Kembali ke Halaman Login
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--bg-base)] selection:bg-brand selection:text-black relative overflow-hidden">
      {/* Glow background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-lime-500/10 dark:bg-brand/10 blur-[120px] rounded-full pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 sm:p-10 shadow-2xl relative z-10 space-y-6 backdrop-blur-xl"
      >
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-lime-500/10 text-lime-700 dark:text-brand mx-auto flex items-center justify-center border border-lime-500/20 shadow-xs mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">
            Buat Kata Sandi Baru
          </h1>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Masukkan kata sandi baru untuk akun Admin Portal Anda.
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center text-xs text-[var(--text-muted)] animate-pulse">Memuat form reset...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </motion.div>
    </div>
  );
}
