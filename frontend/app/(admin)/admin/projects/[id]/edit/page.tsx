'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { ProjectCategory, Project } from '@/types';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { SlugField } from '@/components/shared/SlugField';
import { RichEditor } from '@/components/shared/RichEditor';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { toast } from 'sonner';

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDesc, setShortDesc] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [techStackInput, setTechStackInput] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [sortOrder, setSortOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    async function loadData() {
      const [catsRes, projRes] = await Promise.all([
        projectsApi.listCategories(),
        projectsApi.get(id),
      ]);

      if (catsRes.status) setCategories(catsRes.data || []);
      if (projRes.status && projRes.data) {
        const p = projRes.data;
        setTitle(p.title);
        setSlug(p.slug);
        setShortDesc(p.short_description || '');
        setDescription(p.description || '');
        setCategoryId(p.category_id || null);

        let stack: string[] = [];
        if (Array.isArray(p.tech_stack)) stack = p.tech_stack;
        else if (typeof p.tech_stack === 'string') {
          try {
            stack = JSON.parse(p.tech_stack);
          } catch {
            stack = p.tech_stack ? p.tech_stack.split(',') : [];
          }
        }
        setTechStackInput(stack.join(', '));

        setRepoUrl(p.repo_url || '');
        setDemoUrl(p.demo_url || '');
        setIsFeatured(Boolean(p.is_featured));
        setStatus(p.status || 'published');
        setSortOrder(p.sort_order || 0);

        if (p.images && p.images.length > 0) {
          setImageUrl(p.images[0].original_url || p.images[0].thumbnail_url);
        }
      }
      setFetching(false);
    }

    if (id) loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
      toast.error('Judul project wajib diisi');
      return;
    }

    setLoading(true);
    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await projectsApi.update(id, {
        title,
        slug,
        short_description: shortDesc,
        description,
        category_id: categoryId ? Number(categoryId) : undefined,
        tech_stack: techStack,
        repo_url: repoUrl,
        demo_url: demoUrl,
        is_featured: isFeatured,
        status,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Proyek berhasil diperbarui!');
        router.push('/admin/projects');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal memperbarui proyek');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat data proyek...</div>;
  }

  return (
    <FormWrapper
      title={`Edit Proyek: ${title}`}
      backHref="/admin/projects"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Perubahan"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Judul Proyek *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <SlugField
            value={slug}
            onChange={setSlug}
            sourceValue={title}
            isEditMode={true}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Kategori
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="">Pilih Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Status Publikasi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Urutan (Sort Order)
            </label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Deskripsi Singkat
          </label>
          <Textarea
            value={shortDesc}
            onChange={(e) => setShortDesc(e.target.value)}
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Tech Stack (Pisahkan dengan koma)
          </label>
          <Input
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              URL Repositori GitHub
            </label>
            <Input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              URL Live Demo
            </label>
            <Input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
            />
          </div>
        </div>

        {/* Featured Checkbox */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
            Jadikan Proyek Unggulan (Featured on Homepage)
          </label>
        </div>

        {/* Cover Image Upload */}
        <ImageUploadField
          label="Foto Sampul Proyek"
          value={imageUrl}
          onChange={(url) => setImageUrl(url)}
          onSelectMedia={async (media) => {
            setImageUrl(media.original_url);
            await projectsApi.addImage(id, {
              thumbnail_url: media.thumbnail_url,
              medium_url: media.medium_url,
              original_url: media.original_url,
              caption: title,
              sort_order: 1,
            });
          }}
        />

        {/* Rich Description */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Detail Lengkap & Arsitektur
          </label>
          <RichEditor
            value={description}
            onChange={setDescription}
          />
        </div>
      </div>
    </FormWrapper>
  );
}
