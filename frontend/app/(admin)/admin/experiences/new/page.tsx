'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { experiencesApi } from '@/lib/api';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { toast } from 'sonner';

export default function NewExperiencePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState('');
  const [position, setPosition] = useState('');
  const [type, setType] = useState<'full-time' | 'freelance' | 'contract' | 'internship' | 'self-employed' | 'part-time'>('full-time');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'remote' | 'on-site' | 'hybrid'>('remote');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isCurrent, setIsCurrent] = useState(false);
  const [techStackInput, setTechStackInput] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !position || !startDate) {
      toast.error('Perusahaan, posisi, dan tanggal mulai wajib diisi');
      return;
    }

    setLoading(true);
    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await experiencesApi.create({
        company,
        position,
        type,
        location,
        work_mode: workMode,
        start_date: startDate,
        end_date: isCurrent ? null : endDate || null,
        is_current: isCurrent,
        tech_stack: techStack,
        description,
        sort_order: Number(sortOrder),
      });

      if (res.status) {
        toast.success('Pengalaman baru berhasil disimpan!');
        router.push('/admin/experiences');
        router.refresh();
      } else {
        toast.error(res.message || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormWrapper
      title="Tambah Pengalaman Kerja"
      backHref="/admin/experiences"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Pengalaman"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Nama Perusahaan / Organisasi *
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Contoh: PT Teknologi Inovasi"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Posisi / Jabatan *
            </label>
            <Input
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="Contoh: Senior Full Stack Developer"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tipe Pekerjaan
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="full-time">Full-time</option>
              <option value="freelance">Freelance</option>
              <option value="contract">Contract</option>
              <option value="internship">Internship</option>
              <option value="self-employed">Self-employed</option>
              <option value="part-time">Part-time</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Moda Kerja
            </label>
            <select
              value={workMode}
              onChange={(e) => setWorkMode(e.target.value as any)}
              className="flex h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:outline-none focus:border-lime-600 dark:focus:border-brand"
            >
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on-site">On-site</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Lokasi (Kota / Negara)
            </label>
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Jakarta, Indonesia"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tanggal / Bulan Mulai *
            </label>
            <Input
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="Jan 2024"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              Tanggal / Bulan Selesai
            </label>
            <Input
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="Present atau Des 2025"
              disabled={isCurrent}
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isCurrent"
            checked={isCurrent}
            onChange={(e) => setIsCurrent(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border)] text-lime-700 dark:text-brand focus:ring-lime-600 dark:focus:ring-brand"
          />
          <label htmlFor="isCurrent" className="text-sm font-medium text-[var(--text-primary)] cursor-pointer">
            Pekerjaan Saat Ini (Masih Berlangsung)
          </label>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Tech Stack (Pisahkan dengan koma)
          </label>
          <Input
            value={techStackInput}
            onChange={(e) => setTechStackInput(e.target.value)}
            placeholder="Go, Docker, Next.js, MySQL"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Deskripsi Tanggung Jawab & Dampak
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Menjelaskan peran, arsitektur yang dibangun, serta metrik hasil..."
            rows={4}
          />
        </div>
      </div>
    </FormWrapper>
  );
}
