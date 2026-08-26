'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { aiApi } from '@/lib/api';
import { ChatSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, User, Bot, Clock, ShieldAlert, Check, Copy, ExternalLink, Terminal } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

function AdminCodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[var(--border)] bg-[#0d1117] text-gray-200 shadow-sm font-mono">
      <div className="flex items-center justify-between px-3 py-1.5 bg-black/40 text-[10px] text-gray-400 border-b border-gray-800">
        <span className="uppercase tracking-wider font-semibold">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Tersalin</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Salin</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 text-[11px] sm:text-xs overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

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
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] font-medium'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-2 text-[11px] opacity-80 font-semibold uppercase tracking-wider">
                      {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                      <span>{isUser ? 'Pengunjung' : 'Arl AI'}</span>
                      {msg.created_at && (
                        <span className="ml-auto opacity-70 text-[10px] font-normal font-mono">
                          {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {msg.is_rejected && (
                      <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-2 pb-1.5 border-b border-red-500/20">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>[Guardrail Rejection Triggered]</span>
                      </div>
                    )}

                    {isUser ? (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    ) : (
                      <div className="text-[13px] leading-relaxed chat-markdown break-words">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            h1: ({ children }) => (
                              <h2 className="text-base font-extrabold text-[var(--text-primary)] mt-3 mb-1.5 tracking-tight border-b border-[var(--border)] pb-1">
                                {children}
                              </h2>
                            ),
                            h2: ({ children }) => (
                              <h3 className="text-sm font-bold text-[var(--text-primary)] mt-2.5 mb-1 tracking-tight">
                                {children}
                              </h3>
                            ),
                            h3: ({ children }) => (
                              <h4 className="text-xs font-bold text-lime-700 dark:text-brand uppercase tracking-wider mt-2.5 mb-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand" />
                                <span>{children}</span>
                              </h4>
                            ),
                            p: ({ children }) => <div className="my-1.5 leading-relaxed">{children}</div>,
                            pre: ({ children }) => <>{children}</>,
                            ul: ({ children }) => <ul className="space-y-1 my-1.5 pl-1 list-none">{children}</ul>,
                            ol: ({ children }) => <ol className="space-y-1 my-1.5 pl-4 list-decimal text-xs font-medium">{children}</ol>,
                            li: ({ children, ...props }) => (
                              <li className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand mt-1.5 shrink-0" />
                                <div className="flex-1">{children}</div>
                              </li>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-lime-600 dark:border-brand pl-3 py-1 italic text-xs text-[var(--text-secondary)] my-2 bg-lime-500/5 dark:bg-brand/5 rounded-r-lg">
                                {children}
                              </blockquote>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-0.5 text-lime-700 dark:text-brand font-semibold underline underline-offset-2 hover:opacity-80 transition-opacity"
                              >
                                <span>{children}</span>
                                <ExternalLink className="w-3 h-3 inline ml-0.5" />
                              </a>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-[var(--text-primary)] dark:text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-[var(--text-secondary)]">{children}</em>
                            ),
                            code: ({ inline, className, children, ...props }: any) => {
                              const match = /language-(\w+)/.exec(className || '');
                              const codeString = String(children).replace(/\n$/, '');
                              if (!inline && (match || codeString.includes('\n'))) {
                                return (
                                  <AdminCodeBlock
                                    language={match ? match[1] : ''}
                                    code={codeString}
                                  />
                                );
                              }
                              return (
                                <code
                                  className="px-1.5 py-0.5 rounded-md bg-[var(--bg-surface)] text-lime-800 dark:text-brand border border-[var(--border)] font-mono text-[11px] font-medium"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            },
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
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
