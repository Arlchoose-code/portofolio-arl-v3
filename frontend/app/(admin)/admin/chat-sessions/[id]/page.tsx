'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { ChatSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, Bot, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ChatSessionDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      aiApi.getChatSession(id).then((res) => {
        if (res.status) setSession(res.data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat transkrip percakapan...</div>;
  if (!session) return <div className="p-8 text-sm text-red-400">Sesi percakapan tidak ditemukan.</div>;

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <Button asChild variant="secondary" size="sm" className="gap-2">
          <Link href="/admin/chat-sessions">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Sesi</span>
          </Link>
        </Button>

        <div className="text-xs font-mono text-[var(--text-muted)]">
          Session: {session.session_key}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--border)] text-xs text-[var(--text-secondary)]">
          <div>IP Address: {session.ip_address || '127.0.0.1'}</div>
          <div>Dibuat: {new Date(session.created_at).toLocaleString('id-ID')}</div>
        </div>

        {/* Message Thread */}
        <div className="space-y-4">
          {session.messages && session.messages.length > 0 ? (
            session.messages.map((msg, idx) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={idx}
                  className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] font-medium shadow-sm'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 text-[11px] opacity-75 font-semibold uppercase">
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      <span>{isUser ? 'Pengunjung' : 'Arl AI'}</span>
                    </div>

                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>

                    {msg.is_rejected && (
                      <div className="mt-2 text-xs font-bold text-red-400">
                        [Guardrail Rejection Triggered]
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-xs text-[var(--text-muted)]">
              Belum ada percakapan dalam sesi ini.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
