'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { skillsApi } from '@/lib/api';
import { SkillCategory } from '@/types';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';

export default function NewSkillPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [sortOrder, setSortOrder] = useState(0);

  useEffect(() => {
    skillsApi.listCategories().then((res) => {
      if (res.status && res.data) {
        setCategories(res.data);
        if (res.data.length > 0) setCategoryId(res.data[0].id);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !categoryId) {
      toast.error('Nama skill dan kategori wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await skillsApi.create({
        name,
        category_id: Number(categoryId),
        level,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Skill berhasil ditambahkan!');
        router.push('/admin/skills');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal menambahkan skill');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper
      title="Tambah Technical Skill"
      backHref="/admin/skills"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Skill"
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
              placeholder="Contoh: Go, Next.js, PyTorch"
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
