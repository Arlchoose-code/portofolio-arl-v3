'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChatBotAvatar } from './ChatBotAvatar';
import { ShieldAlert, ExternalLink, Copy, Check, Search, Sparkles, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ThinkingStep } from '@/types';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
  isRejected?: boolean;
  timestamp?: string;
  isStreaming?: boolean;
  thinkingStep?: ThinkingStep | null;
}

function formatChatTimestamp(raw?: string): string {
  if (!raw) return '';
  if (/^\d{1,2}:\d{2}/.test(raw) && !raw.includes('T') && !raw.includes('-')) {
    return raw;
  }
  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
  } catch {}
  return raw;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
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

export function ChatMessage({
  role,
  content,
  isRejected,
  timestamp,
  isStreaming = false,
  thinkingStep,
}: ChatMessageProps) {
  const isUser = role === 'user';
  const displayTime = formatChatTimestamp(timestamp);

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} w-full my-2 select-text`}
    >
      {!isUser && <ChatBotAvatar size={28} />}

      <div
        className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${
          isUser
            ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] rounded-tr-sm font-medium'
            : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-sm'
        }`}
      >
        {isRejected && (
          <div className="flex items-center gap-1.5 text-xs text-red-400 font-semibold mb-1 pb-1 border-b border-red-500/20">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Topik Dibatasi Guardrail</span>
          </div>
        )}

        <div className="break-words">
          {isUser ? (
            <div className="whitespace-pre-wrap text-[13px]">{content}</div>
          ) : !content ? (
            // Clean Searching / Command Loading State (No duplicate box)
            thinkingStep ? (
              <div className="py-0.5 max-w-full overflow-hidden">
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface)] border border-lime-600/30 dark:border-brand/30 text-[11px] sm:text-xs font-mono text-lime-800 dark:text-brand shadow-xs max-w-full overflow-hidden">
                  {thinkingStep.action === 'command' || thinkingStep.label.startsWith('$') ? (
                    <Terminal className="w-3.5 h-3.5 animate-pulse text-lime-600 dark:text-brand shrink-0" />
                  ) : (
                    <Search className="w-3.5 h-3.5 animate-pulse text-lime-600 dark:text-brand shrink-0" />
                  )}
                  <span className="font-medium truncate min-w-0 flex-1">
                    {thinkingStep.label.startsWith('$') ? 'Menjalankan gateway tool...' : thinkingStep.label}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand animate-ping shrink-0" />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 py-1 px-1">
                <span
                  className="w-2 h-2 rounded-full bg-lime-600 dark:bg-brand animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-lime-600 dark:bg-brand animate-bounce"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="w-2 h-2 rounded-full bg-lime-600 dark:bg-brand animate-bounce"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            )
          ) : (
            <div className="text-[13px] leading-relaxed chat-markdown">
              {/* Completed Search Pill (Only for non-terminal queries to avoid double render) */}
              {thinkingStep && thinkingStep.action !== 'command' && !thinkingStep.label.startsWith('$') && (
                <div className="inline-flex items-center gap-1.5 mb-2 px-2.5 py-0.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-secondary)] max-w-full overflow-hidden">
                  <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                  <span className="truncate min-w-0 flex-1">{thinkingStep.label.replace('...', '')}</span>
                </div>
              )}

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
                  h4: ({ children }) => (
                    <h5 className="text-xs font-bold text-[var(--text-primary)] mt-1.5 mb-0.5">
                      {children}
                    </h5>
                  ),
                  p: ({ children }) => <div className="my-1.5 leading-relaxed">{children}</div>,
                  pre: ({ children }) => <>{children}</>,
                  ul: ({ children }) => <ul className="space-y-1 my-1.5 pl-1 list-none">{children}</ul>,
                  ol: ({ children }) => <ol className="space-y-1 my-1.5 pl-4 list-decimal text-xs font-medium">{children}</ol>,
                  li: ({ children, ...props }) => {
                    if ((props as any).checked !== undefined) {
                      return (
                        <li className="flex items-center gap-2 text-xs leading-relaxed my-0.5">
                          <input
                            type="checkbox"
                            checked={(props as any).checked}
                            readOnly
                            className="rounded accent-lime-600 dark:accent-brand"
                          />
                          <div className="flex-1">{children}</div>
                        </li>
                      );
                    }
                    return (
                      <li className="flex items-start gap-2 text-xs leading-relaxed my-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand mt-1.5 shrink-0" />
                        <div className="flex-1">{children}</div>
                      </li>
                    );
                  },
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
                  img: ({ src, alt }: any) => (
                    <div className="my-2.5 rounded-xl overflow-hidden border border-[var(--border)] bg-black/40 shadow-md">
                      <img
                        src={src}
                        alt={alt || 'Image'}
                        className="w-full h-auto object-cover max-h-44"
                        loading="lazy"
                      />
                    </div>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-bold text-[var(--text-primary)] dark:text-white">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-[var(--text-secondary)]">{children}</em>
                  ),
                  hr: () => <hr className="my-2.5 border-[var(--border)]" />,
                  table: ({ children }) => (
                    <div className="my-3 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-sm">
                      <table className="w-full text-xs text-left border-collapse">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-[var(--bg-elevated)] text-[var(--text-secondary)] uppercase text-[10px] font-mono border-b border-[var(--border)]">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 py-2 font-bold border-r border-[var(--border)] last:border-r-0">
                      {children}
                    </th>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-[var(--border)]">{children}</tbody>
                  ),
                  tr: ({ children }) => (
                    <tr className="hover:bg-lime-500/5 dark:hover:bg-brand/5 transition-colors">
                      {children}
                    </tr>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 py-2 text-xs border-r border-[var(--border)] last:border-r-0 text-[var(--text-primary)]">
                      {children}
                    </td>
                  ),
                  code: ({ className, children, ...props }: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    const strCode = String(children);
                    const isCodeBlock = match || strCode.includes('\n');

                    if (isCodeBlock) {
                      return (
                        <CodeBlock
                          language={match ? match[1] : ''}
                          code={strCode.replace(/\n$/, '')}
                        />
                      );
                    }
                    return (
                      <code
                        className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-xs font-mono text-lime-800 dark:text-brand border border-[var(--border)] font-semibold"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  },
                }}
              >
                {content}
              </ReactMarkdown>

              {isStreaming && (
                <span className="inline-block w-1.5 h-4 ml-1 bg-lime-600 dark:bg-brand animate-pulse align-middle rounded-sm shadow-sm" />
              )}
            </div>
          )}
        </div>

        {displayTime && !isStreaming && (
          <div
            className={`text-[10px] mt-1.5 text-right font-mono ${
              isUser ? 'text-white/70 dark:text-black/60 font-semibold' : 'text-[var(--text-muted)]'
            }`}
          >
            {displayTime}
          </div>
        )}
      </div>
    </motion.div>
  );
}
