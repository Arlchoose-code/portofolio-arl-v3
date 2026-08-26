'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { aiApi } from '@/lib/api';
import { ChatSession, PaginationParams, ApiMeta } from '@/types';
import { DataTable, Column } from '@/components/shared/DataTable';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Button } from '@/components/ui/Button';
import { MessageSquare, Trash2, Eye, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminChatSessionsPage() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [meta, setMeta] = useState<ApiMeta | undefined>();
  const [loading, setLoading] = useState(true);
  const [params, setParams] = useState<PaginationParams>({ page: 1, per_page: 20 });
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  const fetchSessions = async (p?: PaginationParams) => {
    setLoading(true);
    const res = await aiApi.listChatSessions(p || params);
    if (res.status) {
      setSessions(res.data || []);
      setMeta(res.meta);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions(params);
  }, [params]);

  const handleDelete = async () => {
    if (!deleteId) return;
    const res = await aiApi.deleteChatSession(deleteId);
    if (res.status) {
      toast.success('Sesi chat berhasil dihapus');
      setSessions((prev) => prev.filter((s) => s.id !== deleteId));
      setDeleteId(null);
    } else {
      toast.error('Gagal menghapus sesi');
    }
  };

  const handleClearAll = async () => {
    const res = await aiApi.deleteAllChatSessions();
    if (res.status) {
      toast.success('Seluruh riwayat sesi chat berhasil dibersihkan');
      setSessions([]);
      setClearAllConfirm(false);
    } else {
      toast.error('Gagal membersihkan sesi chat');
    }
  };

  const columns: Column<ChatSession>[] = [
    {
      header: 'Session Key',
      sortKey: 'session_key',
      accessor: (item) => (
        <div className="space-y-1">
          <div className="font-mono text-xs font-semibold text-[var(--text-primary)]">
            {item.session_key}
          </div>
          <div className="text-[10px] text-[var(--text-muted)] font-mono">
            IP: {item.ip_address === '::1' || item.ip_address === '127.0.0.1' ? `${item.ip_address || '::1'} (Localhost)` : (item.ip_address || '127.0.0.1')}
          </div>
        </div>
      ),
    },
    {
      header: 'Aktivitas Terakhir',
      sortKey: 'last_activity_at',
      accessor: (item) => (
        <span className="text-xs text-[var(--text-secondary)]">
          {new Date(item.last_activity_at).toLocaleString('id-ID')}
        </span>
      ),
    },
    {
      header: 'Total Pesan',
      accessor: (item) => (
        <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand px-2 py-0.5 rounded-md bg-lime-500/10 border border-lime-500/20">
          {item.messages ? item.messages.length : (item.messages_this_hour || 1)} Pesan
        </span>
      ),
    },
    {
      header: 'Aksi',
      className: 'text-right',
      accessor: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button asChild size="sm" variant="ghost" title="Lihat Riwayat Percakapan">
            <Link href={`/admin/chat-sessions/${item.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setDeleteId(item.id)}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
            title="Hapus Sesi"
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
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">Riwayat Chat Pengunjung</h2>
          <p className="text-xs text-[var(--text-secondary)]">
            Transkrip percakapan langsung pengunjung dengan asisten AI portofolio.
          </p>
        </div>

        {sessions.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setClearAllConfirm(true)}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Sesi</span>
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={sessions}
        meta={meta}
        isLoading={loading}
        onParamsChange={(newParams) => setParams((prev) => ({ ...prev, ...newParams }))}
        searchPlaceholder="Cari Session Key..."
      />

      <ConfirmDialog
        open={deleteId !== null}
        title="Hapus Sesi Chat"
        description="Apakah Anda yakin ingin menghapus catatan percakapan ini?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmDialog
        open={clearAllConfirm}
        title="Hapus Seluruh Sesi Chat"
        description="PERINGATAN: Semua riwayat percakapan pengunjung akan dihapus secara permanen dari basis data."
        onConfirm={handleClearAll}
        onCancel={() => setClearAllConfirm(false)}
      />
    </div>
  );
}
