'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { educationsApi } from '@/lib/api';
import { Education, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminEducationsPage() {
  const [educations, setEducations] = useState<Education[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 20 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEducations = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await educationsApi.list(p || params);
    if (res.status) {
      setEducations(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEducations(params);

    const onFocus = () => fetchEducations(params);
    const onVisibility = () => {
      if (!document.hidden) fetchEducations(params);
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

    const prevList = [...educations];
    setEducations((prev) => prev.filter((e) => e.id !== deleteId));

    const res = await educationsApi.delete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (res.status) {
      toast.success('Pendidikan/Organisasi berhasil dihapus');
      fetchEducations(params);
    } else {
      setEducations(prevList);
      toast.error('Gagal menghapus');
    }
  };

  const columns: Column<Education>[] = [
    {
      header: 'Institusi / Organisasi',
      sortKey: 'institution',
      accessor: (item) => (
        <div className="space-y-1">
          <div className="font-semibold text-[var(--text-primary)]">{item.institution}</div>
          <div className="text-xs text-[var(--text-secondary)]">
            {item.degree} {item.major && `• ${item.major}`}
          </div>
        </div>
      ),
    },
    {
      header: 'Tipe',
      sortKey: 'type',
      accessor: (item) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${
            item.type === 'education'
              ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
          }`}
        >
          {item.type}
        </span>
      ),
    },
    {
      header: 'Periode',
      sortKey: 'start_year',
      accessor: (item) => (
        <span className="text-xs font-mono text-[var(--text-secondary)]">
          {item.start_year} — {item.is_current ? 'Present' : item.end_year || 'Present'}
        </span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" title="Edit">
            <Link href={`/admin/educations/${item.id}/edit`}>
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
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Manajemen Pendidikan & Organisasi</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Kelola riwayat pendidikan formal dan organisasi kemahasiswaan.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={educations}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        createHref="/admin/educations/new"
        createLabel="Tambah Riwayat"
        searchPlaceholder="Cari institusi atau jurusan..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Data"
        description="Apakah Anda yakin ingin menghapus data pendidikan/organisasi ini?"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
