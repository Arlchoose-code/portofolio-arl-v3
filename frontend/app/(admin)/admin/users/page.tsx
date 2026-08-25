'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usersApi } from '@/lib/api';
import { User, PaginationParams } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Users,
  UserPlus,
  Search,
  Edit2,
  Trash2,
  Key,
  Shield,
  UserCheck,
  X,
  RefreshCw,
  Mail,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal States
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await usersApi.list({
        page,
        per_page: 15,
        search: search.trim() || undefined,
      });

      if (res.status && res.data) {
        setUsers(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch {
      toast.error('Gagal memuat daftar pengguna.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim()) {
      toast.error('Nama dan email wajib diisi.');
      return;
    }

    if (!editingUser && (!formData.password || formData.password.length < 6)) {
      toast.error('Kata sandi minimal 6 karakter.');
      return;
    }

    if (editingUser && formData.password && formData.password.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter.');
      return;
    }

    setSaving(true);
    try {
      if (editingUser) {
        // Update user
        const payload: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: 'admin',
        };
        if (formData.password) {
          payload.password = formData.password;
        }

        const res = await usersApi.update(editingUser.id, payload);
        if (res.status) {
          toast.success('Data pengguna berhasil diperbarui.');
          setModalOpen(false);
          fetchUsers();
        } else {
          toast.error(res.message || 'Gagal memperbarui pengguna.');
        }
      } else {
        // Create user
        const res = await usersApi.create({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: 'admin',
        });

        if (res.status) {
          toast.success('Pengguna baru berhasil ditambahkan.');
          setModalOpen(false);
          fetchUsers();
        } else {
          toast.error(res.message || 'Gagal menambahkan pengguna.');
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan sistem.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await usersApi.delete(deletingId);
      if (res.status) {
        toast.success('Pengguna berhasil dihapus.');
        setConfirmDeleteOpen(false);
        setDeletingId(null);
        fetchUsers();
      } else {
        toast.error(res.message || 'Gagal menghapus pengguna.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menghapus pengguna.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Kelola Pengguna (Users)</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-500/20 text-lime-800 dark:text-brand border border-lime-500/30">
              {totalCount} Total Pengguna
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Kelola akun pengguna admin, ubah nama, email, dan perbarui kata sandi.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchUsers} className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Segarkan</span>
          </Button>

          <Button size="sm" onClick={handleOpenCreate} className="gap-2 font-bold shadow-sm">
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna</span>
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Cari berdasarkan nama atau email pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </form>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
            Memuat daftar pengguna...
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-lime-500/10 text-lime-700 dark:text-brand mx-auto flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Tidak Ada Pengguna</h3>
            <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
              Tidak ditemukan data pengguna yang cocok dengan kriteria pencarian Anda.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] font-mono border-b border-[var(--border)]">
                <tr>
                  <th className="px-4 py-3 font-bold">Pengguna</th>
                  <th className="px-4 py-3 font-bold">Alamat Email</th>
                  <th className="px-4 py-3 font-bold">Terdaftar Pada</th>
                  <th className="px-4 py-3 font-bold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-[var(--bg-elevated)]/60 transition-colors">
                    {/* Name & Avatar */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-lime-700 text-white dark:bg-brand dark:text-black font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div className="font-bold text-[var(--text-primary)] text-sm">{u.name}</div>
                          <div className="text-[10px] text-[var(--text-muted)] font-mono">ID #{u.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3.5 font-mono text-[var(--text-secondary)]">
                      {u.email}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 text-[var(--text-muted)] font-mono text-[11px]">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : '-'}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenEdit(u)}
                          className="h-8 px-2 text-xs gap-1"
                          title="Edit Pengguna & Password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setDeletingId(u.id);
                            setConfirmDeleteOpen(true);
                          }}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
          <div className="text-xs text-[var(--text-muted)]">
            Halaman {page} dari {totalPages} ({totalCount} total pengguna)
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Berikutnya
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit User Modal Dialog */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center border border-lime-500/20">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">
                    {editingUser ? 'Edit Pengguna & Password' : 'Tambah Pengguna Baru'}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Nama Lengkap *</span>
                  </label>
                  <Input
                    placeholder="Contoh: Administrator Utama"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Alamat Email *</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="admin@syahril.dev"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={saving}
                  />
                </div>

                <div className="space-y-1.5 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                      <span>{editingUser ? 'Ganti Kata Sandi (Opsional)' : 'Kata Sandi *'}</span>
                    </span>
                    {editingUser && (
                      <span className="text-[10px] text-[var(--text-muted)] font-normal">
                        Kosongkan jika tidak ingin diubah
                      </span>
                    )}
                  </label>
                  <Input
                    type="password"
                    placeholder={editingUser ? 'Masukkan kata sandi baru...' : 'Minimal 6 karakter'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!editingUser}
                    disabled={saving}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                    disabled={saving}
                  >
                    Batal
                  </Button>

                  <Button type="submit" disabled={saving} className="gap-2 font-bold">
                    {saving ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>{editingUser ? 'Perbarui Pengguna' : 'Simpan Pengguna'}</span>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Hapus Pengguna"
        description="Apakah Anda yakin ingin menghapus akun pengguna ini? Pengguna tidak akan dapat mengakses panel admin lagi."
        confirmLabel="Hapus Akun"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setDeletingId(null);
        }}
      />
    </div>
  );
}
