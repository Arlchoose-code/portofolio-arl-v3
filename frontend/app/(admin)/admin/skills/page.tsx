'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { skillsApi } from '@/lib/api';
import { Skill, SkillCategory, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminSkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 25 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSkills = async (p?: PaginationParams) => {
    setLoading(true);
    const [skillsRes, catsRes] = await Promise.all([
      skillsApi.list(p || params),
      skillsApi.listCategories(),
    ]);

    if (skillsRes.status) {
      setSkills(skillsRes.data || []);
      setMeta(skillsRes.meta);
    }
    if (catsRes.status) {
      setCategories(catsRes.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSkills(params);

    const onFocus = () => fetchSkills(params);
    const onVisibility = () => {
      if (!document.hidden) fetchSkills(params);
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [params]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);

    const prevList = [...skills];
    setSkills((prev) => prev.filter((s) => s.id !== deleteId));

    const res = await skillsApi.delete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (res.status) {
      toast.success('Skill berhasil dihapus');
      fetchSkills(params);
    } else {
      setSkills(prevList);
      toast.error('Gagal menghapus skill');
    }
  };

  const columns: Column<Skill>[] = [
    {
      header: 'Nama Skill',
      sortKey: 'name',
      accessor: (item) => (
        <div className="font-semibold text-[var(--text-primary)]">{item.name}</div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (item) => (
        <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
          {item.category?.name || 'Kategori'}
        </span>
      ),
    },
    {
      header: 'Tingkat Kemahiran',
      sortKey: 'level',
      accessor: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border capitalize ${
            item.level === 'expert'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
              : item.level === 'advanced'
              ? 'bg-lime-500/10 text-lime-800 dark:bg-brand/10 dark:text-brand border-lime-500/30 dark:border-brand/30'
              : item.level === 'intermediate'
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20'
              : 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400 border-zinc-500/20'
          }`}
        >
          {item.level}
        </span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" title="Edit">
            <Link href={`/admin/skills/${item.id}/edit`}>
              <Pencil className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteId(item.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Hapus"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Manajemen Technical Skills</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Kelola bahasa pemrograman, framework, tools, dan pangkalan data.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={skills}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        createHref="/admin/skills/new"
        createLabel="Tambah Skill"
        searchPlaceholder="Cari nama skill..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Skill"
        description="Apakah Anda yakin ingin menghapus data skill ini?"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
