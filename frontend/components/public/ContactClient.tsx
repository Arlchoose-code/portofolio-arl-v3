'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { MagneticWrapper } from '@/components/shared/MagneticWrapper';
import { SocialIcon } from '@/components/shared/SocialIcon';
import {
  Mail,
  Send,
  MessageSquare,
  User,
  MapPin,
  CheckCircle2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { publicContactApi, settingsApi } from '@/lib/api';
import { SiteSetting, SocialLink } from '@/types';
import { toast } from 'sonner';

import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { TurnstileWidget } from '@/components/shared/TurnstileWidget';
import { cleanMetaTitle } from '@/lib/seo-utils';

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

interface ContactClientProps {
  seoTitle?: string;
  seoDescription?: string;
  initialSite?: SiteSetting | null;
  initialSocials?: SocialLink[];
}

export function ContactClient({
  seoTitle,
  seoDescription,
  initialSite,
  initialSocials = [],
}: ContactClientProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [site, setSite] = useState<SiteSetting | null>(initialSite || null);
  const [socials, setSocials] = useState<SocialLink[]>(initialSocials);

  const fetchSite = () => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data) {
        if (res.data.site) setSite(res.data.site);
        if (res.data.social_links) setSocials(res.data.social_links);
      }
    });
  };

  useEffect(() => {
    fetchSite();

    const onFocus = () => fetchSite();
    const onVisibility = () => {
      if (!document.hidden) fetchSite();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Validation function
  const validateField = (field: string, val: string): string | undefined => {
    const trimmed = val.trim();
    if (field === 'name') {
      if (!trimmed) return 'Nama lengkap wajib diisi.';
      if (trimmed.length < 2) return 'Nama lengkap minimal 2 karakter.';
      if (trimmed.length > 100) return 'Nama lengkap maksimal 100 karakter.';
    }
    if (field === 'email') {
      if (!trimmed) return 'Alamat email wajib diisi.';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmed)) return 'Format email tidak valid (contoh: budi@gmail.com).';
      if (trimmed.length > 150) return 'Alamat email maksimal 150 karakter.';
    }
    if (field === 'subject') {
      if (trimmed.length > 200) return 'Subjek maksimal 200 karakter.';
    }
    if (field === 'message') {
      if (!trimmed) return 'Pesan wajib diisi.';
      if (trimmed.length < 10) {
        return `Pesan terlalu singkat (minimal 10 karakter, saat ini ${trimmed.length} karakter).`;
      }
      if (trimmed.length > 5000) return 'Pesan maksimal 5.000 karakter.';
    }
    return undefined;
  };

  const handleBlur = (field: string, val: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, val);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleInputChange = (field: string, val: string) => {
    if (field === 'name') setName(val);
    if (field === 'email') setEmail(val);
    if (field === 'subject') setSubject(val);
    if (field === 'message') setMessage(val);

    if (touched[field]) {
      const err = validateField(field, val);
      setErrors((prev) => ({ ...prev, [field]: err }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nameErr = validateField('name', name);
    const emailErr = validateField('email', email);
    const subjectErr = validateField('subject', subject);
    const msgErr = validateField('message', message);

    const validationErrors: FormErrors = {
      name: nameErr,
      email: emailErr,
      subject: subjectErr,
      message: msgErr,
    };

    setTouched({ name: true, email: true, subject: true, message: true });
    setErrors(validationErrors);

    if (nameErr || emailErr || subjectErr || msgErr) {
      const firstError = nameErr || emailErr || msgErr || subjectErr;
      toast.error(firstError || 'Mohon lengkapi dan periksa kembali formulir.');
      return;
    }

    if (site?.turnstile_enabled && site?.turnstile_site_key && !turnstileToken) {
      toast.error('Mohon selesaikan verifikasi keamanan Cloudflare Turnstile.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicContactApi.submit({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || 'Pesan Baru dari Website Portofolio',
        message: message.trim(),
        honeypot: honeypot.trim(),
        cf_turnstile_token: turnstileToken,
      } as any);

      if (res.status) {
        setSubmitted(true);
        toast.success('Pesan Anda berhasil dikirim! Terima kasih.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
        setTurnstileToken('');
        setErrors({});
        setTouched({});
      } else {
        toast.error(res.message || 'Gagal mengirimkan pesan. Silakan coba lagi.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kendala saat mengirim pesan.');
    } finally {
      setSubmitting(false);
    }
  };

  const messageTrimLength = message.trim().length;

  const pageHeading =
    cleanMetaTitle(seoTitle, site?.site_name || 'Syahril Haryono', site?.title_separator || '|') || 'Hubungi Saya';
  const pageDescription =
    seoDescription ||
    'Punya tawaran proyek menarik, kesempatan karier, kolaborasi AI & Software Engineering, atau sekadar ingin berdiskusi? Jangan ragu untuk mengirimkan pesan!';

  return (
    <div className="min-h-[90vh] pt-28 pb-24 px-6 max-w-6xl mx-auto space-y-10">
      {/* Breadcrumb */}
      <BreadcrumbWithJsonLD items={[{ name: 'Contact', url: '/contact' }]} />

      {/* Header Section */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-lime-600/20 dark:border-brand/20 bg-lime-500/10 dark:bg-brand/10 text-xs font-mono text-lime-700 dark:text-brand font-semibold"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Mari Terhubung &amp; Berkolaborasi</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl font-black tracking-tight text-[var(--text-primary)]"
        >
          {pageHeading}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed"
        >
          {pageDescription}
        </motion.p>
      </div>

      {/* Main Grid: Info + Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Column: Unified Contact Card */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="lg:col-span-5"
        >
          <div className="p-7 sm:p-8 rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-6">
            {/* Top Badges & Status */}
            <div className="space-y-3 pb-6 border-b border-[var(--border)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>{site?.available_status || 'Available for Work'}</span>
                </div>

                {site?.custom_badge_text && (
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-md bg-lime-500/10 dark:bg-brand/10 text-lime-700 dark:text-brand border border-lime-600/20 dark:border-brand/20 font-bold uppercase tracking-wider">
                    {site.custom_badge_text}
                  </span>
                )}
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                {site?.available_badge_text || 'Open for Engineering & AI Roles'}
              </h3>
            </div>

            {/* Direct Contact Channels */}
            <div className="space-y-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center shrink-0 border border-lime-500/20">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Alamat Email Resmi
                  </div>
                  <a
                    href="mailto:contact@syahril.dev"
                    className="text-sm font-semibold text-[var(--text-primary)] hover:text-lime-700 dark:hover:text-brand transition-colors truncate block"
                  >
                    contact@syahril.dev
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-3 border-t border-[var(--border)]">
                <div className="w-10 h-10 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center shrink-0 border border-lime-500/20">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider font-semibold">
                    Lokasi Domisili
                  </div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">
                    Jakarta, Indonesia
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            {socials.length > 0 && (
              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Jejaring Profesional &amp; Sosial
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 hover:bg-[var(--bg-elevated)] hover:border-lime-600/40 dark:hover:border-brand/40 transition-all flex flex-col items-center justify-center gap-1.5 text-center"
                    >
                      <SocialIcon
                        platform={social.platform}
                        icon={social.icon}
                        className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors"
                      />
                      <span className="text-[11px] font-medium text-[var(--text-primary)] capitalize truncate w-full">
                        {social.platform}
                      </span>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="lg:col-span-7"
        >
          <div className="p-8 sm:p-10 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-lg relative overflow-hidden">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-brand mx-auto flex items-center justify-center border border-emerald-500/20">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-[var(--text-primary)]">
                  Pesan Berhasil Terkirim!
                </h3>
                <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                  Terima kasih telah menghubungi saya. Pesan Anda telah tersimpan dan akan segera saya tanggapi melalui email.
                </p>
                <Button
                  onClick={() => setSubmitted(false)}
                  variant="outline"
                  className="mt-4"
                >
                  Kirim Pesan Lain
                </Button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Invisible Honeypot field for bot trapping */}
                <input
                  type="text"
                  name="_hp_website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">
                    Kirim Pesan Langsung
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Silakan isi formulir di bawah ini. Tanggapan biasanya dikirimkan dalam 1x24 jam.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                      <span>Nama Lengkap *</span>
                    </label>
                    <Input
                      placeholder="Contoh: Budi Santoso"
                      value={name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      onBlur={() => handleBlur('name', name)}
                      disabled={submitting}
                      className={errors.name ? 'border-red-500/60 focus:border-red-500 ring-1 ring-red-500/30' : ''}
                    />
                    {errors.name && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Email Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                      <span>Alamat Email *</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="budi@example.com"
                      value={email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      onBlur={() => handleBlur('email', email)}
                      disabled={submitting}
                      className={errors.email ? 'border-red-500/60 focus:border-red-500 ring-1 ring-red-500/30' : ''}
                    />
                    {errors.email && (
                      <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Subject Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Subjek / Topik Percakapan</span>
                  </label>
                  <Input
                    placeholder="Contoh: Tawaran Proyek Full Stack & AI"
                    value={subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    onBlur={() => handleBlur('subject', subject)}
                    disabled={submitting}
                    className={errors.subject ? 'border-red-500/60 focus:border-red-500 ring-1 ring-red-500/30' : ''}
                  />
                  {errors.subject && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.subject}</span>
                    </p>
                  )}
                </div>

                {/* Message Textarea with Live Character Counter & Minimum Badge */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Pesan Anda *
                    </label>
                    <span
                      className={`text-[11px] font-mono font-medium ${
                        messageTrimLength === 0
                          ? 'text-[var(--text-muted)]'
                          : messageTrimLength < 10
                          ? 'text-amber-500 font-bold'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {messageTrimLength < 10 ? (
                        <span>Minimal 10 karakter ({messageTrimLength}/10)</span>
                      ) : (
                        <span>✓ {messageTrimLength} karakter</span>
                      )}
                    </span>
                  </div>

                  <Textarea
                    placeholder="Tuliskan pesan, deskripsi proyek, pertanyaan, atau detail kolaborasi Anda secara lengkap..."
                    rows={6}
                    value={message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    onBlur={() => handleBlur('message', message)}
                    disabled={submitting}
                    className={errors.message ? 'border-red-500/60 focus:border-red-500 ring-1 ring-red-500/30' : ''}
                  />

                  {errors.message && (
                    <p className="text-[11px] text-red-500 flex items-center gap-1 mt-1 font-medium">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors.message}</span>
                    </p>
                  )}
                </div>

                {/* Cloudflare Turnstile Smart CAPTCHA Widget */}
                {site?.turnstile_enabled && site?.turnstile_site_key && (
                  <div className="pt-2">
                    <TurnstileWidget
                      siteKey={site.turnstile_site_key}
                      onSuccess={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken('')}
                    />
                  </div>
                )}

                <MagneticWrapper>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={submitting}
                    className="w-full gap-2 font-bold shadow-lg shadow-brand/10"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim Pesan...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Pesan Sekarang</span>
                        <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </MagneticWrapper>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
