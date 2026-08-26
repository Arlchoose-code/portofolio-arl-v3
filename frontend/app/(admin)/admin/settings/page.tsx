'use client';

import React, { useState, useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { SiteSetting, SocialLink, SeoSetting } from '@/types';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { SocialIcon, availableSocialIcons } from '@/components/shared/SocialIcon';
import { Save, Plus, Trash2, Globe, Share2, Search, Check, Layers, ExternalLink, Sparkles, Image as ImageIcon, Shield } from 'lucide-react';
import { cleanMetaTitle } from '@/lib/seo-utils';
import { toast } from 'sonner';
import { getMediaUrl } from '@/lib/utils';

const publicPagesList = [
  {
    path: '/',
    name: 'Beranda (Home)',
    badge: 'Utama',
    defaultPageTitle: 'Beranda',
  },
  {
    path: '/projects',
    name: 'Proyek (Projects)',
    badge: 'Karya',
    defaultPageTitle: 'Portofolio Proyek',
  },
  {
    path: '/about',
    name: 'Tentang Saya & Kualifikasi (About)',
    badge: 'Profil & Kualifikasi',
    defaultPageTitle: 'Tentang & Kualifikasi Profesional',
  },
  {
    path: '/tools',
    name: 'Pusat Web Tools & Utilitas (Tools)',
    badge: 'Utilitas',
    defaultPageTitle: 'Pusat Tools & Utilitas Praktis',
  },
  {
    path: '/contact',
    name: 'Kontak & Pesan (Contact)',
    badge: 'Komunikasi',
    defaultPageTitle: 'Hubungi Saya',
  },
  {
    path: '/privacy-policy',
    name: 'Kebijakan Privasi (Privacy Policy)',
    badge: 'Legal',
    defaultPageTitle: 'Kebijakan Privasi',
  },
  {
    path: '/terms',
    name: 'Syarat & Ketentuan (Terms)',
    badge: 'Legal',
    defaultPageTitle: 'Syarat & Ketentuan',
  },
];

export default function AdminSettingsPage() {
  const [tab, setTab] = useState<'site' | 'social' | 'seo'>('site');
  const [loading, setLoading] = useState(false);

  // Site Settings
  const [siteName, setSiteName] = useState('');
  const [titleSeparator, setTitleSeparator] = useState('|');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [footerText, setFooterText] = useState('');
  const [availableStatus, setAvailableStatus] = useState('Available for Work');
  const [availableBadgeText, setAvailableBadgeText] = useState('Open for Engineering & AI Roles');
  const [customBadgeText, setCustomBadgeText] = useState('Full Stack • Applied AI');
  const [contactEmail, setContactEmail] = useState('contact@arlab.my.id');
  const [contactLocation, setContactLocation] = useState('Jakarta, Indonesia');
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileSiteKey, setTurnstileSiteKey] = useState('');
  const [turnstileSecretKey, setTurnstileSecretKey] = useState('');
  const [maintenance, setMaintenance] = useState(false);
  const [ogDefaultUrl, setOgDefaultUrl] = useState('');

  // Social Links
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [newPlatform, setNewPlatform] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newIcon, setNewIcon] = useState('github');

  // SEO Settings
  const [seoList, setSeoList] = useState<SeoSetting[]>([]);
  const [selectedPath, setSelectedPath] = useState('/');
  const [pageTitle, setPageTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');

  useEffect(() => {
    settingsApi.getSiteSetting().then((res) => {
      if (res.status && res.data) {
        const s = res.data as any;
        setSiteName(s.site_name || '');
        setTitleSeparator(s.title_separator || '|');
        setTagline(s.tagline || '');
        setDescription(s.description || '');
        setLogoUrl(s.logo_url || '');
        setHeroBackgroundUrl(s.hero_background_url || '');
        setFaviconUrl(s.favicon_url || '');
        setFooterText(s.footer_text || '');
        setAvailableStatus(s.available_status || 'Available for Work');
        setAvailableBadgeText(s.available_badge_text || 'Open for Engineering & AI Roles');
        setCustomBadgeText(s.custom_badge_text || 'Full Stack • Applied AI');
        setContactEmail(s.contact_email || 'contact@arlab.my.id');
        setContactLocation(s.contact_location || 'Jakarta, Indonesia');
        setTurnstileEnabled(Boolean(s.turnstile_enabled));
        setTurnstileSiteKey(s.turnstile_site_key || '');
        setTurnstileSecretKey(s.turnstile_secret_key || '');
        setMaintenance(Boolean(s.maintenance_mode));
        setOgDefaultUrl(s.og_image_default_url || '');
      }
    });

    settingsApi.listSocialLinks().then((res) => {
      if (res.status && res.data) setSocialLinks(res.data);
    });

    settingsApi.getSeoSettings().then((res) => {
      if (res.status && res.data) {
        const list = res.data;
        setSeoList(list);
        loadSeoForPath('/', list);
      }
    });
  }, []);

  const loadSeoForPath = (path: string, list: SeoSetting[] = seoList) => {
    setSelectedPath(path);
    const existing = list.find((s) => s.path === path);
    const pageConfig = publicPagesList.find((p) => p.path === path);

    if (existing && existing.meta_title) {
      const cleanTitle = cleanMetaTitle(existing.meta_title, siteName, titleSeparator);
      setPageTitle(cleanTitle);
      setMetaDesc(existing.meta_description || '');
      setOgImageUrl(existing.og_image_url || '');
    } else if (pageConfig) {
      setPageTitle(pageConfig.defaultPageTitle);
      setMetaDesc(description);
      setOgImageUrl('');
    } else {
      setPageTitle('');
      setMetaDesc('');
      setOgImageUrl('');
    }
  };

  const handleSaveSiteSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await settingsApi.updateSiteSetting({
        site_name: siteName,
        title_separator: titleSeparator,
        tagline,
        description,
        logo_url: logoUrl,
        hero_background_url: heroBackgroundUrl,
        favicon_url: faviconUrl,
        footer_text: footerText,
        available_status: availableStatus,
        available_badge_text: availableBadgeText,
        custom_badge_text: customBadgeText,
        contact_email: contactEmail,
        contact_location: contactLocation,
        turnstile_enabled: turnstileEnabled,
        turnstile_site_key: turnstileSiteKey,
        turnstile_secret_key: turnstileSecretKey,
        maintenance_mode: maintenance,
        og_image_default_url: ogDefaultUrl,
      } as any);

      if (res.status) {
        toast.success('Pengaturan situs & SEO global berhasil disimpan dan disinkronkan!');
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPresetPlatform = (preset: { id: string; label: string }) => {
    setNewPlatform(preset.label);
    setNewIcon(preset.id);
  };

  const handleAddSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlatform || !newUrl) return;

    const res = await settingsApi.createSocialLink({
      platform: newPlatform,
      url: newUrl,
      icon: newIcon || newPlatform.toLowerCase(),
      is_active: true,
      sort_order: socialLinks.length + 1,
    });

    if (res.status && res.data) {
      toast.success(`Tautan sosial "${newPlatform}" berhasil ditambahkan!`);
      setSocialLinks((prev) => [...prev, res.data]);
      setNewPlatform('');
      setNewUrl('');
    }
  };

  const handleDeleteSocial = async (id: number) => {
    const res = await settingsApi.deleteSocialLink(id);
    if (res.status) {
      toast.success('Tautan dihapus');
      setSocialLinks((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleSaveSeo = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const sanitizedTitle = cleanMetaTitle(pageTitle, siteName, titleSeparator);
      const fullMetaTitle =
        selectedPath === '/'
          ? `${siteName} ${titleSeparator} ${tagline}`
          : `${sanitizedTitle} ${titleSeparator} ${siteName}`;

      const res = await settingsApi.upsertSeoSetting({
        path: selectedPath,
        meta_title: fullMetaTitle,
        meta_description: metaDesc || description,
        og_title: fullMetaTitle,
        og_description: metaDesc || description,
        og_image_url: ogImageUrl || undefined,
        canonical: selectedPath,
      });

      if (res.status) {
        toast.success(`SEO halaman "${selectedPath}" berhasil disimpan!`);
        const updated = await settingsApi.getSeoSettings();
        if (updated.status && updated.data) {
          setSeoList(updated.data);
        }
      } else {
        toast.error(res.message || 'Gagal menyimpan SEO');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  const selectedPageConfig = publicPagesList.find((p) => p.path === selectedPath);

  const cleanPreviewHeading = cleanMetaTitle(pageTitle || selectedPageConfig?.defaultPageTitle, siteName, titleSeparator);
  const computedPreviewTitle =
    selectedPath === '/'
      ? `${siteName || 'Syahril Haryono'} ${titleSeparator} ${tagline || 'Full Stack Developer'}`
      : `${cleanPreviewHeading || 'Halaman'} ${titleSeparator} ${siteName || 'Syahril Haryono'}`;

  const effectiveOgImage = ogImageUrl || ogDefaultUrl || faviconUrl;
  const effectiveOgSource = ogImageUrl
    ? 'Banner Khusus Halaman'
    : ogDefaultUrl
    ? 'Default OG Banner'
    : faviconUrl
    ? 'Favicon Website (Fallback Otomatis)'
    : 'Belum Ada';

  return (
    <div className="space-y-8 w-full">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">Pengaturan Situs & SEO</h2>
        <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
          Konfigurasi nama website, pembatas judul, tagline, logo, favicon, dan otomatisasi SEO pintar.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div
        className="flex items-center gap-2 border-b border-[var(--border)] pb-2 overflow-x-auto no-scrollbar sm:flex-wrap"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <button
          type="button"
          onClick={() => setTab('site')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            tab === 'site'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Branding & Informasi Situs</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            tab === 'social'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Social Media Links</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('seo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-colors ${
            tab === 'seo'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-sm'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>Otomatisasi SEO Halaman</span>
        </button>
      </div>

      {/* Tab 1: Site Info & Branding */}
      {tab === 'site' && (
        <form onSubmit={handleSaveSiteSettings} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Nama Website Utama / Brand Name *
              </label>
              <Input
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Syahril Haryono"
                required
              />
              <p className="text-[11px] text-[var(--text-muted)]">
                Tampil di logo navbar, footer, tab browser, dan akhiran judul seluruh SEO.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Pembatas Judul (*Separator*)
              </label>
              <select
                value={titleSeparator}
                onChange={(e) => setTitleSeparator(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
              >
                <option value="|">| (Garis Tegak)</option>
                <option value="-">- (Tanda Hubung)</option>
                <option value="—">— (Em Dash)</option>
                <option value="•">• (Bullet)</option>
                <option value="~">~ (Tilde)</option>
              </select>
              <p className="text-[11px] text-[var(--text-muted)]">
                Contoh: <span className="font-mono font-semibold">Proyek {titleSeparator} {siteName || 'Syahril Haryono'}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tagline / Title Web Suffix *
            </label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Full Stack Developer | AI Systems Engineer"
              required
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Digunakan sebagai judul beranda: <span className="font-mono font-semibold">{siteName || 'Syahril Haryono'} {titleSeparator} {tagline || 'Tagline'}</span>
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Deskripsi Global Website *
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Deskripsi singkat profil untuk snippet pencarian dan metadata global..."
              required
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              SEO seluruh halaman publik otomatis menggunakan deskripsi ini jika tidak diisi khusus.
            </p>
          </div>

          {/* Contact Information Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/30 p-4 sm:p-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Email Kontak Publik (Tampil di Halaman Kontak &amp; Footer)
              </label>
              <Input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="contact@arlab.my.id"
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                Alamat email resmi yang dapat diklik oleh pengunjung pada halaman Hubungi Saya dan footer.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Lokasi Domisili (Halaman Kontak)
              </label>
              <Input
                value={contactLocation}
                onChange={(e) => setContactLocation(e.target.value)}
                placeholder="Jakarta, Indonesia"
              />
              <p className="text-[10px] text-[var(--text-muted)]">
                Lokasi kota &amp; negara tempat tinggal untuk info kontak profesional.
              </p>
            </div>
          </div>

          {/* Work Status & Hero Badges Section */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-4 sm:p-5 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Status Ketersediaan Kerja &amp; Badge Hero</span>
              </h4>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                Atur teks status kerja dan badge keahlian yang tampil di halaman Home dan About.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Status Ketersediaan (Foto Profil)
                </label>
                <Input
                  value={availableStatus}
                  onChange={(e) => setAvailableStatus(e.target.value)}
                  placeholder="Contoh: Available for Work, Available for Remote"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Badge hijau di atas foto profil (Home &amp; About).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Teks Badge Karir (Hero Top)
                </label>
                <Input
                  value={availableBadgeText}
                  onChange={(e) => setAvailableBadgeText(e.target.value)}
                  placeholder="Contoh: Open for Engineering &amp; AI Roles"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Badge status di atas nama pada Hero Section.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Teks Badge Spesialisasi (Hero Top)
                </label>
                <Input
                  value={customBadgeText}
                  onChange={(e) => setCustomBadgeText(e.target.value)}
                  placeholder="Contoh: Full Stack &bull; Applied AI"
                />
                <p className="text-[10px] text-[var(--text-muted)]">
                  Badge spesialisasi di samping status karir.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-[var(--border)]">
            <div className="space-y-1.5">
              <ImageUploadField
                label="Logo Website / Brand Icon (Navbar & Footer)"
                value={logoUrl}
                onChange={setLogoUrl}
              />
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Ikon/logo kecil yang tampil di samping nama brand pada navbar dan footer.
              </p>
            </div>

            <div className="space-y-1.5">
              <ImageUploadField
                label="Favicon Browser Tab"
                value={faviconUrl}
                onChange={setFaviconUrl}
              />
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                Ikon kecil yang muncul di samping judul tab browser pengunjung.
              </p>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Teks Footer Hak Cipta
            </label>
            <Input
              value={footerText}
              onChange={(e) => setFooterText(e.target.value)}
              placeholder={`© 2026 ${siteName || 'Syahril Haryono'}. Built with Go, Next.js & AI.`}
            />
          </div>

          <ImageUploadField
            label="Default OpenGraph Banner (Social Share Image)"
            value={ogDefaultUrl}
            onChange={setOgDefaultUrl}
          />

          {/* Cloudflare Turnstile CAPTCHA Section */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-500" />
                  <span>Keamanan Bot: Cloudflare Turnstile (Smart CAPTCHA)</span>
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Proteksi anti-bot cerdas tanpa teka-teki gambar untuk formulir kontak publik dan login admin.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="turnstile_enabled"
                checked={turnstileEnabled}
                onChange={(e) => setTurnstileEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
              />
              <label htmlFor="turnstile_enabled" className="text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
                Aktifkan Verifikasi Cloudflare Turnstile
              </label>
            </div>

            {turnstileEnabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--border)]">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Turnstile Site Key (Public Key)
                  </label>
                  <Input
                    value={turnstileSiteKey}
                    onChange={(e) => setTurnstileSiteKey(e.target.value)}
                    placeholder="0x4AAAAAA..."
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Didapatkan dari Cloudflare Dashboard &gt; Turnstile.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                    Turnstile Secret Key (Private Key)
                  </label>
                  <Input
                    type="password"
                    value={turnstileSecretKey}
                    onChange={(e) => setTurnstileSecretKey(e.target.value)}
                    placeholder="0x4AAAAAA..."
                  />
                  <p className="text-[10px] text-[var(--text-muted)]">
                    Digunakan backend Go untuk verifikasi server-to-server.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="maintenance"
              checked={maintenance}
              onChange={(e) => setMaintenance(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
            />
            <label htmlFor="maintenance" className="text-xs font-medium text-[var(--text-primary)] cursor-pointer">
              Aktifkan Mode Pemeliharaan (Maintenance Mode)
            </label>
          </div>

          <div className="flex justify-end pt-4 border-t border-[var(--border)]">
            <Button type="submit" disabled={loading} className="gap-2 font-bold">
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan & Sinkronkan SEO'}</span>
            </Button>
          </div>
        </form>
      )}

      {/* Tab 2: Social Media Links */}
      {tab === 'social' && (
        <div className="space-y-6">
          <form onSubmit={handleAddSocial} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Tambah Tautan Sosial Baru</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Pilih ikon platform dan masukkan URL akun sosial media Anda.
              </p>
            </div>

            {/* Quick Preset Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                Pilihan Cepat Platform:
              </span>
              <div className="flex flex-wrap gap-2">
                {availableSocialIcons.map((preset) => {
                  const isSelected = newIcon === preset.id;
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPresetPlatform(preset)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-lime-600 dark:border-brand bg-lime-500/10 dark:bg-brand/10 text-lime-800 dark:text-brand ring-1 ring-lime-500/40 dark:ring-brand/40 shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Nama Platform *
                </label>
                <Input
                  placeholder="GitHub, LinkedIn, X, Instagram..."
                  value={newPlatform}
                  onChange={(e) => setNewPlatform(e.target.value)}
                  required
                />
              </div>

              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Ikon
                </label>
                <div className="flex items-center gap-2">
                  <div className="p-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-lime-700 dark:text-brand">
                    <SocialIcon icon={newIcon} className="w-5 h-5" />
                  </div>
                  <select
                    value={newIcon}
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
                  >
                    {availableSocialIcons.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  URL Akun *
                </label>
                <Input
                  placeholder="https://..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" size="sm" className="gap-2 font-bold">
                <Plus className="w-4 h-4" />
                <span>Tambah Tautan Sosial</span>
              </Button>
            </div>
          </form>

          {/* Social Links List */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] divide-y divide-[var(--border)] overflow-hidden shadow-sm">
            {socialLinks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                Belum ada tautan sosial yang ditambahkan.
              </div>
            ) : (
              socialLinks.map((social) => (
                <div key={social.id} className="p-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-elevated)]/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-lime-700 dark:text-brand shadow-sm">
                      <SocialIcon icon={social.icon} platform={social.platform} className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-[var(--text-primary)]">{social.platform}</div>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-lime-700 dark:text-brand hover:underline font-medium break-all"
                      >
                        {social.url}
                      </a>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteSocial(social.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                    title="Hapus tautan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: SEO Settings per Public Page */}
      {tab === 'seo' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-lime-500/30 dark:border-brand/30 bg-lime-500/10 dark:bg-brand/10 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-lime-700 dark:text-brand shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--text-secondary)] space-y-1">
              <span className="font-bold text-[var(--text-primary)] block">Sistem Otomatisasi SEO Aktif</span>
              <p>
                Judul setiap halaman otomatis dirangkai menjadi format:{' '}
                <span className="font-mono font-bold text-lime-800 dark:text-brand">
                  [Judul Halaman] {titleSeparator} {siteName || 'Nama Website'}
                </span>
                . Jika gambar OG tidak diatur khusus, sistem otomatis menggunakan default banner, logo web, atau favicon.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Public Pages Selector */}
            <div className="lg:col-span-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <Layers className="w-4 h-4 text-lime-700 dark:text-brand" />
                <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
                  Pilih Halaman
                </h3>
              </div>

              <div className="space-y-1.5">
                {publicPagesList.map((page) => {
                  const isSelected = selectedPath === page.path;
                  const hasCustomSeo = seoList.some((s) => s.path === page.path && (s.meta_title || s.meta_description));

                  return (
                    <button
                      key={page.path}
                      type="button"
                      onClick={() => loadSeoForPath(page.path)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-lime-600 dark:border-brand bg-lime-500/10 dark:bg-brand/10 ring-1 ring-lime-500/30 dark:ring-brand/30 shadow-sm'
                          : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="text-xs font-bold text-[var(--text-primary)] truncate">{page.name}</div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">{page.path}</div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {hasCustomSeo && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            Custom
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: SEO Editor Form */}
            <div className="lg:col-span-8 space-y-6">
              <form onSubmit={handleSaveSeo} className="space-y-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span>Pengaturan SEO: {selectedPageConfig?.name || selectedPath}</span>
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono">
                      Target Path: {selectedPath}
                    </p>
                  </div>

                  <Button asChild variant="secondary" size="sm" className="gap-1.5 text-xs">
                    <a href={selectedPath} target="_blank" rel="noopener noreferrer">
                      <span>Buka Halaman</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </Button>
                </div>

                {/* SERP Preview Box */}
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                    Google Search Snippet Preview
                  </span>
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 truncate">
                      https://arlab.my.id{selectedPath}
                    </div>
                    <div className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer truncate">
                      {computedPreviewTitle}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                      {metaDesc || description || 'Deskripsi halaman untuk mesin pencari...'}
                    </div>
                  </div>
                </div>

                {/* Page Specific Title Field */}
                {selectedPath === '/' ? (
                  <div className="space-y-1 p-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] text-xs text-[var(--text-secondary)]">
                    <span>Judul Beranda otomatis dirangkai dari <strong>Nama Website</strong> dan <strong>Tagline</strong> di tab Branding.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                        Judul Khusus Halaman
                      </label>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">
                        Otomatis ditambahkan: <span className="font-semibold">{titleSeparator} {siteName || 'Syahril Haryono'}</span>
                      </span>
                    </div>
                    <Input
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder={selectedPageConfig?.defaultPageTitle}
                    />
                  </div>
                )}

                {/* Meta Description Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      Meta Description (Opsional)
                    </label>
                    <span className={`text-[11px] font-mono ${metaDesc.length > 160 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                      {metaDesc.length}/160 karakter
                    </span>
                  </div>
                  <Textarea
                    value={metaDesc}
                    onChange={(e) => setMetaDesc(e.target.value)}
                    rows={3}
                    placeholder={description}
                  />
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Kosongkan untuk otomatis menggunakan Deskripsi Global Website.
                  </p>
                </div>

                {/* OpenGraph Banner & Cascade Indicator */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                      OpenGraph Banner (Social Share Image)
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-lime-500/10 text-lime-700 dark:text-brand border border-lime-500/20 font-medium">
                      Status: {effectiveOgSource}
                    </span>
                  </div>

                  <ImageUploadField
                    label="Kustomisasi OG Banner Khusus Halaman Ini (Opsional)"
                    value={ogImageUrl}
                    onChange={setOgImageUrl}
                  />

                  {effectiveOgImage && !ogImageUrl && (
                    <div className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
                      <img
                        src={getMediaUrl(effectiveOgImage)}
                        alt="Fallback OG"
                        className="w-12 h-12 object-cover rounded-lg border border-[var(--border)]"
                      />
                      <div className="text-xs text-[var(--text-muted)]">
                        <span className="font-semibold text-[var(--text-primary)] block">Otomatis menggunakan {effectiveOgSource}</span>
                        <span>Tidak perlu mengunggah gambar lagi kecuali ingin gambar yang berbeda.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4 border-t border-[var(--border)]">
                  <Button type="submit" disabled={loading} className="gap-2 font-bold">
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Menyimpan...' : 'Simpan Kustomisasi SEO'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
