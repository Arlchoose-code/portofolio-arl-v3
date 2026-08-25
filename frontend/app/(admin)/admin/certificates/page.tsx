'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { certificatesApi } from '@/lib/api';
import { Certificate, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { Pencil, Trash2, Award, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 10 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCertificates = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await certificatesApi.list(p || params);
    if (res.status) {
      setCertificates(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCertificates(params);

    const onFocus = () => fetchCertificates(params);
    const onVisibility = () => {
      if (!document.hidden) fetchCertificates(params);
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

    const prevList = [...certificates];
    setCertificates((prev) => prev.filter((c) => c.id !== deleteId));

    const res = await certificatesApi.delete(deleteId);
    setIsDeleting(false);
    setDeleteId(null);

    if (res.status) {
      toast.success('Sertifikat berhasil dihapus');
      fetchCertificates(params);
    } else {
      setCertificates(prevList);
      toast.error('Gagal menghapus sertifikat');
    }
  };

  const columns: Column<Certificate>[] = [
    {
      header: 'Nama Sertifikat',
      sortKey: 'name',
      accessor: (item) => (
        <div className="space-y-1">
          <div className="font-semibold text-[var(--text-primary)]">{item.name}</div>
          <div className="text-xs font-mono text-[var(--text-muted)]">{item.credential_id || 'No ID'}</div>
        </div>
      ),
    },
    {
      header: 'Penerbit',
      sortKey: 'issuer',
      accessor: (item) => (
        <span className="text-xs font-semibold text-lime-700 dark:text-brand">{item.issuer}</span>
      ),
    },
    {
      header: 'Tanggal Terbit',
      sortKey: 'issue_date',
      accessor: (item) => (
        <span className="text-xs text-[var(--text-secondary)]">{item.issue_date}</span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {item.credential_url && (
            <Button asChild size="sm" variant="ghost" title="Lihat Kredensial">
              <a href={item.credential_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button asChild size="sm" variant="ghost" title="Edit">
            <Link href={`/admin/certificates/${item.id}/edit`}>
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
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Manajemen Sertifikat</h2>
        <p className="text-xs text-[var(--text-secondary)]">
          Kelola kredensial profesional dan lisensi kompetensi internasional.
        </p>
      </div>

      <DataTable
        columns={columns}
        data={certificates}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        createHref="/admin/certificates/new"
        createLabel="Tambah Sertifikat"
        searchPlaceholder="Cari nama sertifikat atau penerbit..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Sertifikat"
        description="Apakah Anda yakin ingin menghapus data sertifikat ini?"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
