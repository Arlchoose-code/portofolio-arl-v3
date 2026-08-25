'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { experiencesApi } from '@/lib/api';
import { Experience, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Briefcase, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminExperiencesPage() {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 20 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchExperiences = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await experiencesApi.list(p || params);
    if (res.status) {
      setExperiences(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchExperiences(params);

    const onFocus = () => fetchExperiences(params);
    const onVisibility = () => {
      if (!document.hidden) fetchExperiences(params);
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

    const prevList = [...experiences];
    setExperiences((prev) => prev.filter((e) => e.id !== deleteId));

    const res = await experiencesApi.delete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (res.status) {
      toast.success('Pengalaman berhasil dihapus');
      fetchExperiences(params);
    } else {
      setExperiences(prevList);
      toast.error('Gagal menghapus pengalaman');
    }
  };

  const columns: Column<Experience>[] = [
    {
      header: 'Posisi & Perusahaan',
      sortKey: 'position',
      accessor: (item) => (
        <div className="space-y-1">
          <div className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <span>{item.position}</span>
            {item.is_current && (
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-lime-500/10 text-lime-800 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/30 font-semibold">
                Current
              </span>
            )}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">{item.company}</div>
        </div>
      ),
    },
    {
      header: 'Tipe & Moda',
      accessor: (item) => (
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-[var(--text-primary)] capitalize">{item.type}</div>
          <div className="text-[11px] text-[var(--text-muted)] capitalize">{item.work_mode}</div>
        </div>
      ),
    },
    {
      header: 'Periode',
      sortKey: 'start_date',
      accessor: (item) => (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {item.start_date} — {item.is_current ? 'Present' : item.end_date || 'Present'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" title="Edit">
            <Link href={`/admin/experiences/${item.id}/edit`}>
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
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Manajemen Pengalaman Kerja</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Daftar 18 riwayat pengalaman kerja profesional Syahril Haryono.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={experiences}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        createHref="/admin/experiences/new"
        createLabel="Tambah Pengalaman"
        searchPlaceholder="Cari posisi, perusahaan, atau teknologi..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Pengalaman"
        description="Apakah Anda yakin ingin menghapus catatan pengalaman ini?"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
