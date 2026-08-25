'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { gameToolsApi } from '@/lib/api';
import { FormWrapper } from '@/components/admin/FormWrapper';
import { Input } from '@/components/ui/Input';
import { SlugField } from '@/components/shared/SlugField';
import { ServerOptionsEditor } from '@/components/admin/ServerOptionsEditor';
import { toast } from 'sonner';

export default function EditGameToolPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    game_code: '',
    icon_url: '',
    description: '',
    category: 'MOBA',
    user_id_label: 'User ID',
    user_id_placeholder: 'Contoh: 103008540',
    has_zone_id: false,
    zone_id_label: 'Zone ID',
    zone_id_placeholder: 'Contoh: 2527',
    has_server_list: false,
    server_options: '',
    guide_text: '',
    is_active: true,
    sort_order: 0,
  });

  useEffect(() => {
    if (id) {
      gameToolsApi.get(id).then((res) => {
        if (res.status && res.data) {
          setFormData({
            name: res.data.name || '',
            slug: res.data.slug || '',
            game_code: res.data.game_code || '',
            icon_url: res.data.icon_url || '',
            description: res.data.description || '',
            category: res.data.category || 'MOBA',
            user_id_label: res.data.user_id_label || 'User ID',
            user_id_placeholder: res.data.user_id_placeholder || '',
            has_zone_id: Boolean(res.data.has_zone_id),
            zone_id_label: res.data.zone_id_label || 'Zone ID',
            zone_id_placeholder: res.data.zone_id_placeholder || '',
            has_server_list: Boolean(res.data.has_server_list),
            server_options: res.data.server_options || '',
            guide_text: res.data.guide_text || '',
            is_active: Boolean(res.data.is_active),
            sort_order: res.data.sort_order || 0,
          });
        } else {
          toast.error('Game tidak ditemukan');
          router.push('/admin/game-tools');
        }
        setFetching(false);
      });
    }
  }, [id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.game_code.trim()) {
      toast.error('Nama Game dan Kode Game (Tokopedia) wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      const res = await gameToolsApi.update(id, formData);
      if (res.status) {
        toast.success('Konfigurasi game berhasil diperbarui');
        router.push('/admin/game-tools');
      } else {
        toast.error(res.message || 'Gagal memperbarui game');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat data game...</div>;
  }

  return (
    <FormWrapper
      title={`Edit Game: ${formData.name}`}
      backHref="/admin/game-tools"
      onSubmit={handleSubmit}
      isLoading={loading}
      submitLabel="Simpan Perubahan"
    >
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
          Informasi Utama Game
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Nama Game *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Mobile Legends: Bang Bang"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Kode Game Tokopedia *</label>
            <Input
              required
              value={formData.game_code}
              onChange={(e) => setFormData({ ...formData, game_code: e.target.value.toUpperCase() })}
              placeholder="Contoh: MOBILE_LEGENDS atau FREE_FIRE"
            />
            <p className="text-[11px] text-[var(--text-muted)]">Kode game pada endpoint prepare Tokopedia.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SlugField
            value={formData.slug}
            onChange={(slug) => setFormData({ ...formData, slug })}
            sourceValue={formData.name}
            isEditMode={true}
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Urutan Tampil (Sort Order)</label>
            <Input
              type="number"
              value={formData.sort_order}
              onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
            />
          </div>
        </div>

        {/* Category Field with Preset Suggestions */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-[var(--text-primary)]">Kategori Game *</label>
            <span className="text-[11px] text-[var(--text-muted)]">Pilih preset atau ketik kategori baru</span>
          </div>
          <Input
            required
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="Contoh: MOBA, Battle Royale, FPS & Shooter, Sports..."
          />
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            {[
              'MOBA',
              'Battle Royale',
              'FPS & Shooter',
              'RPG & Strategy',
              'Sports',
              'Action & Arcade',
              'MMORPG',
              'General',
            ].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFormData({ ...formData, category: cat })}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all border ${
                  formData.category === cat
                    ? 'bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] border-lime-600 dark:border-brand shadow-2xs'
                    : 'bg-[var(--bg-base)] text-[var(--text-secondary)] border-[var(--border)] hover:border-lime-500/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[var(--text-primary)]">Deskripsi Singkat</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Contoh: Cek nickname akun Mobile Legends via User ID dan Zone ID."
            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-base)] border border-[var(--border)] focus:border-lime-600 dark:focus:border-brand focus:outline-hidden text-[var(--text-primary)]"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <h3 className="text-base font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-3">
          Konfigurasi Parameter ID Pemain
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Label Input User ID</label>
            <Input
              value={formData.user_id_label}
              onChange={(e) => setFormData({ ...formData, user_id_label: e.target.value })}
              placeholder="User ID / Player ID / Riot ID"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--text-primary)]">Placeholder User ID</label>
            <Input
              value={formData.user_id_placeholder}
              onChange={(e) => setFormData({ ...formData, user_id_placeholder: e.target.value })}
              placeholder="Contoh: 103008540"
            />
          </div>
        </div>

        {/* Zone ID Toggle */}
        <div className="space-y-4 pt-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.has_zone_id}
              onChange={(e) => setFormData({ ...formData, has_zone_id: e.target.checked })}
              className="rounded accent-lime-600 dark:accent-brand w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold text-[var(--text-primary)]">
              Game ini membutuhkan Zone ID / Server ID (Contoh: Mobile Legends, Genshin Impact)
            </span>
          </label>

          {formData.has_zone_id && (
            <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-base)] space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Label Zone ID</label>
                  <Input
                    value={formData.zone_id_label}
                    onChange={(e) => setFormData({ ...formData, zone_id_label: e.target.value })}
                    placeholder="Zone ID / Server"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)]">Placeholder Zone ID</label>
                  <Input
                    value={formData.zone_id_placeholder}
                    onChange={(e) => setFormData({ ...formData, zone_id_placeholder: e.target.value })}
                    placeholder="Contoh: 2527"
                  />
                </div>
              </div>

              {/* Server List Dropdown Toggle */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.has_server_list}
                    onChange={(e) => setFormData({ ...formData, has_server_list: e.target.checked })}
                    className="rounded accent-lime-600 dark:accent-brand w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[var(--text-primary)]">
                    Gunakan Pilihan Dropdown Server (Bukan input teks manual)
                  </span>
                </label>

                {formData.has_server_list && (
                  <div className="pt-3 border-t border-[var(--border)] mt-3">
                    <ServerOptionsEditor
                      value={formData.server_options}
                      onChange={(val) => setFormData({ ...formData, server_options: val })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Guide Text */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-[var(--text-primary)]">Panduan Menemukan ID</label>
          <textarea
            rows={2}
            value={formData.guide_text}
            onChange={(e) => setFormData({ ...formData, guide_text: e.target.value })}
            placeholder="Contoh: Buka profil dalam game di pojok kiri atas untuk melihat User ID dan Zone ID Anda."
            className="w-full p-3 rounded-xl text-xs bg-[var(--bg-base)] border border-[var(--border)] focus:border-lime-600 dark:focus:border-brand focus:outline-hidden text-[var(--text-primary)]"
          />
        </div>
      </div>
    </FormWrapper>
  );
}
