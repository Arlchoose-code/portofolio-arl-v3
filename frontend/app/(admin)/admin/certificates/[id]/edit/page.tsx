'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { certificatesApi } from '@/lib/api';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ImageUploadField } from '@/components/shared/ImageUploadField';
import { toast } from 'sonner';

export default function EditCertificatePage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [name, setName] = useState('');
  const [issuer, setIssuer] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [credentialUrl, setCredentialUrl] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    if (id) {
      certificatesApi.get(id).then((res) => {
        if (res.status && res.data) {
          const c = res.data;
          setName(c.name);
          setIssuer(c.issuer);
          setIssueDate(c.issue_date || '');
          setCredentialId(c.credential_id || '');
          setCredentialUrl(c.credential_url || '');
          setDescription(c.description || '');
          setSortOrder(c.sort_order || 0);
          setImageUrl(c.original_url || c.thumbnail_url || '');
        }
        setFetching(false);
      });
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !issuer || !issueDate) {
      toast.error('Nama sertifikat, penerbit, dan tanggal terbit wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await certificatesApi.update(id, {
        name,
        issuer,
        issue_date: issueDate,
        credential_id: credentialId,
        credential_url: credentialUrl,
        original_url: imageUrl,
        description,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Sertifikat berhasil diperbarui!');
        router.push('/admin/certificates');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal memperbarui sertifikat');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat data sertifikat...</div>;
  }

  return (
    <FormWrapper
      title={`Edit Sertifikat: ${name}`}
      backHref="/admin/certificates"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Perubahan"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Sertifikat *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Penerbit (Issuer) *
            </label>
            <Input
              value={issuer}
              onChange={(e) => setIssuer(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tanggal / Tahun Terbit *
            </label>
            <Input
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Credential ID
            </label>
            <Input
              value={credentialId}
              onChange={(e) => setCredentialId(e.target.value)}
            />
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
            URL Verifikasi Kredensial
          </label>
          <Input
            type="url"
            value={credentialUrl}
            onChange={(e) => setCredentialUrl(e.target.value)}
          />
        </div>

        <ImageUploadField
          label="Foto / Dokumen Sertifikat"
          value={imageUrl}
          onChange={setImageUrl}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Deskripsi Keterampilan yang Diuji
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
    </FormWrapper>
  );
}
