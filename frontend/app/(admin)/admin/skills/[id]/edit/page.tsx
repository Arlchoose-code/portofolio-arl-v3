'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { skillsApi } from '@/lib/api';
import { SkillCategory } from '@/types';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function EditSkillPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    async function loadData() {
      const [catsRes, skillRes] = await Promise.all([
        skillsApi.listCategories(),
        skillsApi.get(id),
      ]);

      if (catsRes.status) setCategories(catsRes.data || []);
      if (skillRes.status && skillRes.data) {
        const s = skillRes.data;
        setName(s.name);
        setCategoryId(s.category_id || (s.category ? s.category.id : null));
        setLevel(s.level || 'intermediate');
        setSortOrder(s.sort_order || 0);
      }
      setFetching(false);
    }

    if (id) loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      toast.error('Nama skill dan kategori wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await skillsApi.update(id, {
        name,
        category_id: Number(categoryId),
        level,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Skill berhasil diperbarui!');
        router.push('/admin/skills');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal memperbarui skill');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat data skill...</div>;
  }

  return (
    <FormWrapper
      title={`Edit Skill: ${name}`}
      backHref="/admin/skills"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Perubahan"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Skill / Teknologi *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Kategori Skill *
            </label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tingkat Kemahiran (Proficiency)
            </label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="beginner">Beginner (Dasar)</option>
              <option value="intermediate">Intermediate (Menengah)</option>
              <option value="advanced">Advanced (Mahir)</option>
              <option value="expert">Expert (Sangat Mahir)</option>
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
      </div>
    </FormWrapper>
  );
}
