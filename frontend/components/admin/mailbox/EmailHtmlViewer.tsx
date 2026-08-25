'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Paperclip,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  ExternalLink,
  BellOff,
  MoreHorizontal,
  Printer,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import { EmailAttachment } from '@/types';

interface EmailHtmlViewerProps {
  html: string;
  text?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, any>;
  headersJson?: string;
  senderName?: string;
  senderEmail?: string;
  subject?: string;
  dateStr?: string;
}

export function EmailHtmlViewer({
  html,
  text,
  attachments = [],
  headersJson,
  senderName,
  senderEmail,
  subject,
  dateStr,
}: EmailHtmlViewerProps) {
  const [showQuoted, setShowQuoted] = useState(false);
  const [parsedUnsubLink, setParsedUnsubLink] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<EmailAttachment | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState('auto');
  const [isDark, setIsDark] = useState(false);

  // Sync theme with parent app
  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();

    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Parse List-Unsubscribe from headers
  useEffect(() => {
    if (headersJson) {
      try {
        const parsed = JSON.parse(headersJson);
        const unsub =
          parsed['List-Unsubscribe'] ||
          parsed['list-unsubscribe'] ||
          parsed['List-Unsubscribe-Post'] ||
          '';

        if (unsub) {
          // Extract http/https link from <https://...> or raw url
          const match = String(unsub).match(/<((https?:\/\/[^>]+))>/i) || String(unsub).match(/(https?:\/\/[^\s,>]+)/i);
          if (match && match[1]) {
            setParsedUnsubLink(match[1]);
          }
        }
      } catch {}
    }
  }, [headersJson]);

  // Split Main Body from Quoted Reply History
  const { mainContent, quotedContent, hasQuote } = React.useMemo(() => {
    const raw = html || (text ? text.replace(/\n/g, '<br>') : '');
    if (!raw) return { mainContent: '', quotedContent: '', hasQuote: false };

    // Check for gmail_quote
    if (raw.includes('class="gmail_quote"') || raw.includes("class='gmail_quote'")) {
      const parts = raw.split(/<div[^>]*class=["']gmail_quote["'][^>]*>/i);
      if (parts.length > 1) {
        return {
          mainContent: parts[0],
          quotedContent: '<div class="gmail_quote"' + parts.slice(1).join('<div class="gmail_quote"'),
          hasQuote: true,
        };
      }
    }

    // Check for blockquote
    if (raw.includes('<blockquote')) {
      const parts = raw.split(/<blockquote/i);
      if (parts.length > 1) {
        return {
          mainContent: parts[0],
          quotedContent: '<blockquote' + parts.slice(1).join('<blockquote'),
          hasQuote: true,
        };
      }
    }

    // Check for "Pada ... menulis:" or "On ... wrote:" in plaintext
    const quotePattern = /(Pada\s+.+?\s+menulis:|On\s+.+?\s+wrote:)/i;
    if (quotePattern.test(raw)) {
      const match = raw.match(quotePattern);
      if (match && match.index !== undefined && match.index > 0) {
        return {
          mainContent: raw.slice(0, match.index),
          quotedContent: raw.slice(match.index),
          hasQuote: true,
        };
      }
    }

    return { mainContent: raw, quotedContent: '', hasQuote: false };
  }, [html, text]);

  // Prepare safe sandboxed HTML for iframe
  const contentToDisplay = showQuoted ? `${mainContent}${quotedContent ? `<hr style="margin: 16px 0; border: none; border-top: 1px dashed ${isDark ? '#475569' : '#cbd5e1'};" /><div style="border-left: 2px solid ${isDark ? '#64748b' : '#94a3b8'}; padding-left: 12px; margin-top: 12px; color: ${isDark ? '#94a3b8' : '#64748b'}; font-size: 12px;">${quotedContent}</div>` : ''}` : mainContent;

  const sandboxedSrcDoc = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <base target="_blank">
  <style>
    *, *:before, *:after {
      box-sizing: border-box !important;
    }
    html, body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      line-height: 1.6;
      color: ${isDark ? '#f1f5f9' : '#0f172a'};
      background: transparent;
      margin: 0;
      padding: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
      overflow-x: auto;
      overflow-y: visible;
      -webkit-text-size-adjust: 100%;
    }
    #email-content-wrapper {
      box-sizing: border-box;
      padding: 8px 4px;
      margin: 0;
      width: 100%;
      min-height: 20px;
      color: ${isDark ? '#f1f5f9' : '#0f172a'};
      overflow: visible;
    }
    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 6px;
      display: inline-block;
    }
    a {
      color: ${isDark ? '#a3e635' : '#4d7c0f'} !important;
      text-decoration: underline;
      word-break: break-all;
    }
    table {
      max-width: 100% !important;
      width: auto !important;
      table-layout: auto !important;
    }
    td, th {
      max-width: 100% !important;
      word-break: break-word !important;
    }
    pre, code {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12px;
      background: ${isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
      color: ${isDark ? '#f1f5f9' : '#0f172a'};
      border-radius: 4px;
      padding: 2px 4px;
      white-space: pre-wrap;
      word-break: break-word;
    }
    blockquote {
      margin: 8px 0;
      padding-left: 12px;
      border-left: 3px solid ${isDark ? '#475569' : '#cbd5e1'};
      color: ${isDark ? '#94a3b8' : '#64748b'};
    }
  </style>
</head>
<body>
  <div id="email-content-wrapper">
    ${contentToDisplay || `<p style="color: ${isDark ? '#94a3b8' : '#64748b'}; font-style: italic;">(Isi email kosong)</p>`}
  </div>
  <script>
    function measureAndSendHeight() {
      var el = document.getElementById('email-content-wrapper') || document.body;
      if (!el) return;
      var h = Math.max(
        el.scrollHeight || 0,
        el.offsetHeight || 0,
        el.getBoundingClientRect().height || 0,
        document.body ? document.body.scrollHeight || 0 : 0,
        document.documentElement ? document.documentElement.scrollHeight || 0 : 0
      );
      h = Math.ceil(h);
      if (h > 10) {
        window.parent.postMessage({ type: 'SET_IFRAME_HEIGHT', height: h + 20 }, '*');
      }
    }
    window.addEventListener('load', measureAndSendHeight);
    window.addEventListener('resize', measureAndSendHeight);
    if (window.ResizeObserver) {
      var roTarget = document.getElementById('email-content-wrapper');
      if (roTarget) {
        new ResizeObserver(measureAndSendHeight).observe(roTarget);
      }
    }
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) {
        measureAndSendHeight();
      } else {
        imgs[i].addEventListener('load', measureAndSendHeight);
      }
    }
    measureAndSendHeight();
    setTimeout(measureAndSendHeight, 50);
    setTimeout(measureAndSendHeight, 150);
    setTimeout(measureAndSendHeight, 400);
    setTimeout(measureAndSendHeight, 1000);
    setTimeout(measureAndSendHeight, 2000);

    document.addEventListener('mousemove', function(e) {
      try {
        var rect = window.frameElement ? window.frameElement.getBoundingClientRect() : null;
        var target = e.target;
        var isInteractive = target && (target.tagName === 'A' || target.tagName === 'BUTTON' || (target.closest && (target.closest('a') || target.closest('button'))));
        if (rect) {
          window.parent.postMessage({
            type: 'IFRAME_MOUSE_MOVE',
            clientX: rect.left + e.clientX,
            clientY: rect.top + e.clientY,
            isInteractive: !!isInteractive
          }, '*');
        }
      } catch (err) {}
    });
  </script>
</body>
</html>`;

  const syncHeight = () => {
    if (iframeRef.current) {
      try {
        const doc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
        if (doc) {
          const wrapper = doc.getElementById('email-content-wrapper') || doc.body;
          const h = Math.max(
            wrapper.scrollHeight || 0,
            wrapper.offsetHeight || 0,
            wrapper.getBoundingClientRect().height || 0,
            doc.body?.scrollHeight || 0,
            doc.documentElement?.scrollHeight || 0
          );
          if (h > 10) {
            setIframeHeight(`${Math.ceil(h) + 20}px`);
          }
        }
      } catch {}
    }
  };

  useEffect(() => {
    syncHeight();
    const t1 = setTimeout(syncHeight, 100);
    const t2 = setTimeout(syncHeight, 400);
    const t3 = setTimeout(syncHeight, 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [contentToDisplay, isDark]);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'SET_IFRAME_HEIGHT' && typeof e.data.height === 'number') {
        const nextH = Math.min(Math.max(e.data.height, 60), 20000);
        setIframeHeight(`${nextH}px`);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Cetak: ${subject || 'Email'}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #000; line-height: 1.5; font-size: 13px; }
    .header { border-bottom: 2px solid #ccc; padding-bottom: 12px; margin-bottom: 20px; }
    .title { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 4px; }
    .content { margin-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${subject || '(Tanpa Subjek)'}</div>
    <div class="meta"><strong>Dari:</strong> ${senderName || ''} &lt;${senderEmail || ''}&gt;</div>
    <div class="meta"><strong>Tanggal:</strong> ${dateStr || ''}</div>
  </div>
  <div class="content">${html || text || ''}</div>
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* List-Unsubscribe Gmail-Style Banner */}
      {parsedUnsubLink && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <BellOff className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px]">
              Email ini berasal dari milis / langganan buletin.
            </span>
          </div>
          <a
            href={parsedUnsubLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 transition-colors shrink-0"
          >
            <span>Berhenti Berlangganan (Unsubscribe)</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {/* Main Email HTML Sandbox Frame */}
      <div className="rounded-xl overflow-hidden bg-white dark:bg-zinc-900/60 border border-[var(--border)] p-1.5 sm:p-2">
        <iframe
          ref={iframeRef}
          srcDoc={sandboxedSrcDoc}
          sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
          onLoad={() => {
            syncHeight();
            setTimeout(syncHeight, 50);
            setTimeout(syncHeight, 150);
            setTimeout(syncHeight, 400);
            setTimeout(syncHeight, 1000);
          }}
          className="w-full border-0 rounded-lg transition-all"
          style={{ height: iframeHeight, minHeight: '120px' }}
          title="Isi Pesan Email"
        />
      </div>

      {/* Quoted Reply History Toggler (Gmail ··· Button) */}
      {hasQuote && (
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowQuoted(!showQuoted)}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono transition-all ${
              showQuoted
                ? 'bg-lime-500/15 text-lime-700 dark:text-brand border border-lime-500/30 font-bold'
                : 'bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
            title={showQuoted ? 'Sembunyikan kutipan teks' : 'Tampilkan kutipan riwayat email'}
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
            <span className="text-[10px]">
              {showQuoted ? 'Tutup riwayat kutipan' : 'Tampilkan kutipan teks'}
            </span>
          </button>
        </div>
      )}

      {/* Attachments Section */}
      {attachments.length > 0 && (
        <div className="pt-3 border-t border-[var(--border)] space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
              <span>{attachments.length} Lampiran File</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {attachments.map((att, idx) => {
              const isImg = att.content_type?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif)$/i.test(att.name);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-lime-500/40 transition-all group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center text-lime-700 dark:text-brand border border-[var(--border)] shrink-0">
                      {isImg ? <ImageIcon className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                    </div>
                    <div className="truncate min-w-0">
                      <div className="text-xs font-semibold text-[var(--text-primary)] truncate" title={att.name}>
                        {att.name}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">
                        {formatFileSize(att.size)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isImg && (
                      <button
                        type="button"
                        onClick={() => setPreviewMedia(att)}
                        className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                        title="Lihat Pratinjau Gambar"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <a
                      href={att.url || (att.content_b64 ? `data:${att.content_type || 'application/octet-stream'};base64,${att.content_b64}` : '#')}
                      download={att.name}
                      className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand transition-colors"
                      title="Unduh File"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Image Preview Lightbox Modal */}
      {previewMedia && (
        <div
          onClick={() => setPreviewMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <img
              src={previewMedia.url || (previewMedia.content_b64 ? `data:${previewMedia.content_type || 'image/png'};base64,${previewMedia.content_b64}` : '')}
              alt={previewMedia.name}
              className="max-w-full max-h-[80vh] rounded-xl object-contain shadow-2xl border border-white/10"
            />
            <div className="flex items-center justify-between w-full px-4 text-xs text-white">
              <span className="font-semibold">{previewMedia.name}</span>
              <a
                href={previewMedia.url || (previewMedia.content_b64 ? `data:${previewMedia.content_type || 'image/png'};base64,${previewMedia.content_b64}` : '')}
                download={previewMedia.name}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
