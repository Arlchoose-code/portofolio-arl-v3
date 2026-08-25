'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { projectsApi } from '@/lib/api';
import { Project, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Eye, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 10 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProjects = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await projectsApi.list(p || params);
    if (res.status) {
      setProjects(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProjects(params);

    const onFocus = () => fetchProjects(params);
    const onVisibility = () => {
      if (!document.hidden) fetchProjects(params);
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

    // Optimistic UI update
    const prevList = [...projects];
    setProjects((prev) => prev.filter((p) => p.id !== deleteId));

    const res = await projectsApi.delete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (res.status) {
      toast.success('Proyek berhasil dihapus');
      fetchProjects(params);
    } else {
      setProjects(prevList);
      toast.error('Gagal menghapus proyek');
    }
  };

  const columns: Column<Project>[] = [
    {
      header: 'Judul Proyek',
      sortKey: 'title',
      accessor: (item) => (
        <div className="space-y-1">
          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>{item.title}</span>
            {item.is_featured && <Star className="w-3.5 h-3.5 fill-lime-600 text-lime-600 dark:fill-brand dark:text-brand" />}
          </div>
          <div className="text-xs font-mono text-[var(--text-muted)]">/{item.slug}</div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      accessor: (item) => (
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {item.category?.name || '-'}
        </span>
      ),
    },
    {
      header: 'Status',
      sortKey: 'status',
      accessor: (item) => <StatusBadge status={item.status} />,
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" title="Preview">
            <Link href={`/admin/projects/${item.id}/preview`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild size="sm" variant="ghost" title="Edit">
            <Link href={`/admin/projects/${item.id}/edit`}>
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Manajemen Proyek</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Daftar karya aplikasi, repositori GitHub, dan live demo yang ditampilkan.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={projects}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        createHref="/admin/projects/new"
        createLabel="Tambah Proyek"
        searchPlaceholder="Cari nama proyek atau tech stack..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Proyek"
        description="Apakah Anda yakin ingin menghapus proyek ini? Proyek akan dihapus secara permanen dari basis data."
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
