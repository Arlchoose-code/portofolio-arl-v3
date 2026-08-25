'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { contactsApi } from '@/lib/api';
import { ContactMessage } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Mail,
  MailOpen,
  Search,
  Trash2,
  CheckCircle,
  Archive,
  Reply,
  ExternalLink,
  Clock,
  User,
  X,
  RefreshCw,
  Eye,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { Pagination } from '@/components/shared/Pagination';

export default function AdminContactsPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read' | 'archived' | 'replied'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  // Selected message for detail modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await contactsApi.list({
        page,
        per_page: 12,
        search: search.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.status && res.data) {
        setMessages(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch {
      toast.error('Gagal memuat pesan masuk.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await contactsApi.getStats();
      if (res.status && res.data) {
        setUnreadCount(res.data.unread_count || 0);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('contact-stats-updated'));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    fetchStats();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchMessages();
  };

  const handleOpenDetail = async (msg: ContactMessage) => {
    setSelectedMessage(msg);

    // If unread, automatically mark as read
    if (!msg.is_read) {
      try {
        await contactsApi.updateStatus(msg.id, { is_read: true, status: 'read' });
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: true, status: 'read' } : m))
        );
        setSelectedMessage({ ...msg, is_read: true, status: 'read' });
        fetchStats();
      } catch {}
    }
  };

  const handleToggleReadStatus = async (msg: ContactMessage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newIsRead = !msg.is_read;
    const newStatus = newIsRead ? 'read' : 'unread';

    try {
      const res = await contactsApi.updateStatus(msg.id, { is_read: newIsRead, status: newStatus });
      if (res.status) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, is_read: newIsRead, status: newStatus } : m))
        );
        if (selectedMessage?.id === msg.id) {
          setSelectedMessage({ ...selectedMessage, is_read: newIsRead, status: newStatus });
        }
        fetchStats();
        toast.success(newIsRead ? 'Pesan ditandai sudah dibaca' : 'Pesan ditandai belum dibaca');
      }
    } catch {
      toast.error('Gagal memperbarui status pesan');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      const res = await contactsApi.updateStatus(id, {
        status: newStatus,
        is_read: newStatus !== 'unread',
      });
      if (res.status) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === id ? { ...m, status: newStatus as any, is_read: newStatus !== 'unread' } : m
          )
        );
        if (selectedMessage?.id === id) {
          setSelectedMessage({
            ...selectedMessage,
            status: newStatus as any,
            is_read: newStatus !== 'unread',
          });
        }
        fetchStats();
        toast.success(`Status diubah menjadi: ${newStatus}`);
      }
    } catch {
      toast.error('Gagal mengubah status');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const res = await contactsApi.delete(deletingId);
      if (res.status) {
        setMessages((prev) => prev.filter((m) => m.id !== deletingId));
        if (selectedMessage?.id === deletingId) {
          setSelectedMessage(null);
        }
        fetchStats();
        toast.success('Pesan berhasil dihapus');
        setConfirmDeleteOpen(false);
      }
    } catch {
      toast.error('Gagal menghapus pesan');
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const handleReplyViaWebmail = async (msg: ContactMessage) => {
    // 1. Update contact status to replied
    try {
      await contactsApi.updateStatus(msg.id, { status: 'replied' });
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, status: 'replied' } : m))
      );
      fetchStats();
    } catch {}

    // 2. Format prefilled quoted context
    const quotedContext = `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nDari: ${msg.name} <${msg.email}>\nTanggal: ${new Date(msg.created_at).toLocaleString('id-ID')}\nSubjek: ${msg.subject || '(Tanpa Subjek)'}\n\n${msg.message}\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // 3. Navigate directly to internal Kotak Surat (Webmail)
    const query = new URLSearchParams({
      compose: 'true',
      to: msg.email,
      toName: msg.name,
      subject: `Re: ${msg.subject || 'Balasan Pesan Portofolio'}`,
      body: `Halo ${msg.name},\n\nTerima kasih telah menghubungi saya.${quotedContext}`,
    });

    router.push(`/admin/mailbox?${query.toString()}`);
  };

  const formatTimestamp = (raw: string) => {
    try {
      const d = new Date(raw);
      return d.toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return raw;
    }
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Pesan Masuk (Inquiries)</h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-lime-500/20 text-lime-800 dark:text-brand border border-lime-500/30">
                {unreadCount} Belum Dibaca
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1">
            Kelola pesan, formulir penawaran proyek, dan pertanyaan langsung dari pengunjung situs.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={() => { fetchMessages(); fetchStats(); }} className="gap-2 self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div
          className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-x-auto no-scrollbar max-w-full"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {(
            [
              { id: 'all', label: 'Semua' },
              { id: 'unread', label: 'Belum Dibaca' },
              { id: 'read', label: 'Sudah Dibaca' },
              { id: 'replied', label: 'Dibalas' },
              { id: 'archived', label: 'Diarsipkan' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all ${
                statusFilter === tab.id
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs font-bold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Cari nama, email, subjek..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </form>
      </div>

      {/* Messages List / Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-[var(--text-muted)] animate-pulse">
          Memuat daftar pesan masuk...
        </div>
      ) : messages.length === 0 ? (
        <div className="p-16 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-surface)]/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-lime-500/10 text-lime-700 dark:text-brand mx-auto flex items-center justify-center">
            <Mail className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--text-primary)]">Tidak Ada Pesan</h3>
          <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
            {statusFilter !== 'all' || search
              ? 'Tidak ditemukan pesan dengan filter atau kata kunci pencarian yang dipilih.'
              : 'Belum ada pesan masuk yang dikirimkan oleh pengunjung.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg) => {
            const isUnread = !msg.is_read;

            return (
              <div
                key={msg.id}
                onClick={() => handleOpenDetail(msg)}
                className={`group p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isUnread
                    ? 'border-lime-500/40 bg-lime-500/5 dark:border-brand/40 dark:bg-brand/5 shadow-xs'
                    : 'border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                }`}
              >
                {/* Left Info: Status Dot, Sender, Subject, Preview */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  {/* Status Indicator Icon */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleReadStatus(msg, e)}
                    title={isUnread ? 'Tandai sudah dibaca' : 'Tandai belum dibaca'}
                    className="mt-1 text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand transition-colors shrink-0"
                  >
                    {isUnread ? (
                      <Mail className="w-5 h-5 text-lime-700 dark:text-brand animate-pulse" />
                    ) : (
                      <MailOpen className="w-5 h-5 text-[var(--text-muted)]" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`text-sm font-bold truncate ${isUnread ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                        {msg.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] truncate">
                        &lt;{msg.email}&gt;
                      </span>

                      {/* Status Tag */}
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full capitalize ${
                          msg.status === 'unread'
                            ? 'bg-lime-500/20 text-lime-800 dark:text-brand border border-lime-500/30'
                            : msg.status === 'replied'
                            ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                            : msg.status === 'archived'
                            ? 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border border-gray-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {msg.status}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                      {msg.subject || '(Tanpa Subjek)'}
                    </div>

                    <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                      {msg.message}
                    </p>
                  </div>
                </div>

                {/* Right Actions & Date */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border)]">
                  <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(msg.created_at)}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetail(msg);
                      }}
                      className="h-8 px-2 text-xs gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Baca</span>
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(msg.id);
                        setConfirmDeleteOpen(true);
                      }}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={12}
          onPageChange={(newPage) => setPage(newPage)}
          itemName="pesan"
        />
      )}

      {/* Detail Message Modal Dialog */}
      <AnimatePresence>
        {selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center border border-lime-500/20">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Detail Pesan Masuk
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--text-muted)]">
                      ID #{selectedMessage.id} • {formatTimestamp(selectedMessage.created_at)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Sender Info Card */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">
                        {selectedMessage.name}
                      </div>
                      <a
                        href={`mailto:${selectedMessage.email}`}
                        className="text-xs font-semibold text-lime-700 dark:text-brand hover:underline inline-flex items-center gap-1"
                      >
                        <span>{selectedMessage.email}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* Status Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">Status:</span>
                      <select
                        value={selectedMessage.status}
                        onChange={(e) => handleUpdateStatus(selectedMessage.id, e.target.value)}
                        className="text-xs font-semibold rounded-lg px-2.5 py-1 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {selectedMessage.ip_address && (
                    <div className="text-[11px] font-mono text-[var(--text-muted)] pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span>IP Pengirim:</span>
                      <span className="font-semibold text-[var(--text-primary)]">
                        {selectedMessage.ip_address === '::1' || selectedMessage.ip_address === '127.0.0.1'
                          ? `${selectedMessage.ip_address} (Localhost / Komputer Lokal)`
                          : selectedMessage.ip_address}
                      </span>
                    </div>
                  )}
                </div>

                {/* Subject & Message Content */}
                <div className="space-y-3">
                  <div className="text-sm font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-2">
                    Subjek: {selectedMessage.subject || '(Tanpa Subjek)'}
                  </div>

                  <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-primary)] select-text">
                    {selectedMessage.message}
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-elevated)]/40">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleReadStatus(selectedMessage)}
                    className="text-xs"
                  >
                    {selectedMessage.is_read ? 'Tandai Belum Dibaca' : 'Tandai Sudah Dibaca'}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDeletingId(selectedMessage.id);
                      setConfirmDeleteOpen(true);
                    }}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    Hapus
                  </Button>
                </div>

                <Button
                  size="sm"
                  className="gap-2 font-bold shadow-sm"
                  onClick={() => handleReplyViaWebmail(selectedMessage)}
                >
                  <Send className="w-4 h-4" />
                  <span>Balas via Kotak Surat (Webmail)</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Hapus Pesan Masuk"
        description="Apakah Anda yakin ingin menghapus pesan ini secara permanen? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Pesan"
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
