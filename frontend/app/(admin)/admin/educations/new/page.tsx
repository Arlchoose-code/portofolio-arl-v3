'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { educationsApi } from '@/lib/api';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';

export default function NewEducationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState('');
  const [major, setMajor] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [gpa, setGpa] = useState('');
  const [type, setType] = useState<'education' | 'organization'>('education');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution || !startYear) {
      toast.error('Nama institusi dan tahun mulai wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const res = await educationsApi.create({
        institution,
        degree,
        major,
        start_year: startYear,
        end_year: isCurrent ? null : endYear || null,
        is_current: isCurrent,
        gpa: gpa || null,
        type,
        description,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Data berhasil ditambahkan!');
        router.push('/admin/educations');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal menambahkan data');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper
      title="Tambah Pendidikan / Organisasi"
      backHref="/admin/educations"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Data"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Institusi / Organisasi *
            </label>
            <Input
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              placeholder="Contoh: Universitas Negeri Jakarta"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tipe Entitas
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="education">Pendidikan Formal</option>
              <option value="organization">Organisasi / Komunitas</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Gelar / Peran
            </label>
            <Input
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              placeholder="Contoh: Sarjana Pendidikan (S.Pd) atau Anggota Divisi"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Program Studi / Jurusan
            </label>
            <Input
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="Contoh: Pendidikan Bahasa Jerman"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tahun Mulai *
            </label>
            <Input
              value={startYear}
              onChange={(e) => setStartYear(e.target.value)}
              placeholder="2022"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tahun Selesai
            </label>
            <Input
              value={endYear}
              onChange={(e) => setEndYear(e.target.value)}
              placeholder="Present atau 2026"
              disabled={isCurrent}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              IPK / GPA
            </label>
            <Input
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              placeholder="Contoh: 3.85 / 4.00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrent"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
          />
          <label htmlFor="isCurrent" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
            Masih Aktif / Berlangsung
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Deskripsi / Catatan Tambahan
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Fokus studi, kegiatan penelitian komputasi linguistik..."
            rows={3}
          />
        </div>
      </div>
    </FormWrapper>
  );
}
