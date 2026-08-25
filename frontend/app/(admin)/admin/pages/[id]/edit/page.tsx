'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { pagesApi, settingsApi } from '@/lib/api';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { RichEditor } from '@/components/shared/RichEditor';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { Globe, ArrowUpRight, Sparkles, Search, RefreshCw, Wand2 } from 'lucide-react';
import { extractExcerptFromHtml, cleanMetaTitle } from '@/lib/seo-utils';
import { toast } from 'sonner';

export default function EditPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [imageUrl, setImageUrl] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDesc, setMetaDesc] = useState('');
  const [ogImageUrl, setOgImageUrl] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  // Global site branding info for live preview
  const [siteName, setSiteName] = useState('Syahril Haryono');
  const [titleSeparator, setTitleSeparator] = useState('|');
  const [globalDesc, setGlobalDesc] = useState('');

  useEffect(() => {
    settingsApi.getSiteSetting().then((res) => {
      if (res.status && res.data) {
        const s = res.data as any;
        if (s.site_name) setSiteName(s.site_name);
        if (s.title_separator) setTitleSeparator(s.title_separator);
        if (s.description) setGlobalDesc(s.description);
      }
    });

    if (id) {
      Promise.all([pagesApi.get(id), settingsApi.getSeoSettings()]).then(
        ([pageRes, seoRes]) => {
          if (pageRes.status && pageRes.data) {
            const p = pageRes.data;
            setTitle(p.title);
            setSlug(p.slug);
            setContent(p.content || '');
            setImageUrl(p.image_url || '');
            setStatus(p.status || 'published');

            // Two-way sync: Check if there is an active SEO setting for this path
            const seoList = (seoRes.status && seoRes.data) ? seoRes.data : [];
            const matchedSeo = seoList.find((s: any) => s.path === `/${p.slug}`);

            const effectiveMetaTitle = matchedSeo?.meta_title || p.meta_title || '';
            const effectiveMetaDesc = matchedSeo?.meta_description || p.meta_description || '';
            const effectiveOgImage = matchedSeo?.og_image_url || p.og_image_url || '';

            // Clean title to prevent repeated suffix stacking
            setMetaTitle(cleanMetaTitle(effectiveMetaTitle, siteName, titleSeparator));
            setMetaDesc(effectiveMetaDesc);
            setOgImageUrl(effectiveOgImage);
            setSortOrder(p.sort_order || 0);
          }
          setFetching(false);
        }
      );
    }
  }, [id, siteName, titleSeparator]);

  const handleAutoExtractDesc = () => {
    const excerpt = extractExcerptFromHtml(content, 155);
    if (excerpt) {
      setMetaDesc(excerpt);
      toast.success('Meta Description berhasil dibuat otomatis dari isi konten!');
    } else {
      toast.error('Konten halaman masih kosong. Tulis isi konten terlebih dahulu.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Judul halaman wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const sanitizedMetaTitle = cleanMetaTitle(metaTitle || title, siteName, titleSeparator);
      const fullMetaTitle = `${sanitizedMetaTitle} ${titleSeparator} ${siteName}`;

      // If metaDesc is empty, automatically use clean excerpt from content!
      const effectiveMetaDesc = metaDesc.trim() || extractExcerptFromHtml(content, 155) || globalDesc;

      const res = await pagesApi.update(id, {
        title,
        slug,
        content,
        image_url: imageUrl,
        status: 'published',
        meta_title: fullMetaTitle,
        meta_description: effectiveMetaDesc,
        og_image_url: ogImageUrl,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        // Also sync to SeoSetting for path `/${slug}`
        await settingsApi.upsertSeoSetting({
          path: `/${slug}`,
          meta_title: fullMetaTitle,
          meta_description: effectiveMetaDesc,
          og_title: fullMetaTitle,
          og_description: effectiveMetaDesc,
          og_image_url: ogImageUrl || undefined,
          canonical: `/${slug}`,
        });

        toast.success('Konten & SEO halaman berhasil disimpan!');
        router.push('/admin/pages');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal memperbarui');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat data halaman...</div>;
  }

  const cleanPreviewHeading = cleanMetaTitle(metaTitle || title, siteName, titleSeparator);
  const computedPreviewTitle = `${cleanPreviewHeading || 'Halaman'} ${titleSeparator} ${siteName}`;
  const autoExtractedExcerpt = extractExcerptFromHtml(content, 155);
  const computedPreviewDesc = metaDesc || autoExtractedExcerpt || globalDesc || 'Deskripsi halaman untuk mesin pencari...';

  return (
    <FormWrapper
      title={`Edit Konten & SEO: ${title}`}
      backHref="/admin/pages"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Konten & SEO"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 sm:p-8 space-y-8 shadow-sm">
        {/* Page Header & Live Link */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
          <div className="space-y-0.5">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold">
              Target URL Halaman
            </span>
            <div className="text-sm font-mono font-bold text-lime-700 dark:text-brand flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              <span>/{slug}</span>
            </div>
          </div>

          <a
            href={`/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors w-fit shadow-sm"
          >
            <span>Buka Halaman Publik</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* 1. Page Content Section */}
        <div className="space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[var(--text-primary)]">1. Konten Halaman</h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Edit judul tampilan dan isi artikel lengkap halaman ini.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Judul Halaman *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="text-base font-semibold"
            />
          </div>

          <div className="space-y-2">
            <ImageUploadField
              label="Foto / Gambar Utama Halaman (Tampil di Halaman Profil / Tentang Saya)"
              value={imageUrl}
              onChange={setImageUrl}
            />
            <p className="text-[11px] text-[var(--text-muted)]">
              Foto portrait ini akan otomatis ditampilkan di kartu profil utama pada halaman Tentang Saya (/about).
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Isi / Konten Halaman *
              </label>
              <span className="text-[11px] text-[var(--text-muted)]">
                Format teks kaya &amp; gambar
              </span>
            </div>
            <RichEditor
              value={content}
              onChange={setContent}
            />
          </div>
        </div>

        {/* 2. Integrated SEO Section */}
        <div className="border-t border-[var(--border)] pt-8 space-y-6">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Search className="w-4 h-4 text-lime-700 dark:text-brand" />
                <span>2. Pengaturan SEO &amp; Otomatisasi Cuplikan</span>
              </h3>

              <button
                type="button"
                onClick={handleAutoExtractDesc}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border border-lime-500/30 bg-lime-500/10 dark:bg-brand/10 text-xs font-bold text-lime-700 dark:text-brand hover:bg-lime-500/20 transition-colors shadow-2xs"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>Otomatisasi Deskripsi dari Konten</span>
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Metadata Google Search dan banner sosial media. Deskripsi otomatis diambil dari isi konten jika dikosongkan.
            </p>
          </div>

          {/* SERP Preview Box */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-1.5 shadow-2xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--text-muted)] font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-lime-700 dark:text-brand" />
              <span>Google Search Snippet Preview</span>
            </span>
            <div className="space-y-1">
              <div className="text-xs font-mono text-emerald-700 dark:text-emerald-400 truncate">
                https://arlab.my.id/{slug}
              </div>
              <div className="text-sm font-semibold text-sky-700 dark:text-sky-400 hover:underline cursor-pointer truncate">
                {computedPreviewTitle}
              </div>
              <div className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
                {computedPreviewDesc}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Judul Khusus SEO
                </label>
                <span className="text-[11px] font-mono text-[var(--text-muted)]">
                  Otomatis: <span className="font-semibold">{titleSeparator} {siteName}</span>
                </span>
              </div>
              <Input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={title}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                  Meta Description
                </label>
                <span className={`text-[11px] font-mono ${metaDesc.length > 160 ? 'text-amber-500 font-bold' : 'text-[var(--text-muted)]'}`}>
                  {metaDesc.length}/160 karakter
                </span>
              </div>
              <Textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={3}
                placeholder={autoExtractedExcerpt || globalDesc || 'Otomatis diambil dari isi konten halaman...'}
              />
              <p className="text-[11px] text-[var(--text-muted)] flex items-center justify-between">
                <span>Kosongkan untuk otomatis mengambil 160 karakter pertama dari isi konten.</span>
                {content && !metaDesc && (
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                    [Auto-Active dari Konten]
                  </span>
                )}
              </p>
            </div>
          </div>

          <ImageUploadField
            label="Gambar OpenGraph Khusus Halaman (Social Share Banner)"
            value={ogImageUrl}
            onChange={setOgImageUrl}
          />
        </div>
      </div>
    </FormWrapper>
  );
}
