'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Unlink,
  Paperclip,
  Eraser,
  Undo,
  Redo,
  FileText,
  X,
  Check,
  Globe,
} from 'lucide-react';
import { EmailAttachment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface EmailRichEditorProps {
  content: string;
  onChange: (html: string, text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  attachments?: EmailAttachment[];
  onAddAttachment?: (file: File) => void;
  onRemoveAttachment?: (index: number) => void;
  uploadingAttachment?: boolean;
}

export function EmailRichEditor({
  content,
  onChange,
  placeholder = 'Tulis pesan email Anda...',
  disabled = false,
  minHeight = '140px',
  attachments = [],
  onAddAttachment,
  onRemoveAttachment,
  uploadingAttachment = false,
}: EmailRichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Link Dialog State
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');

  // Undo / Redo live state
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'tiptap-bullet-list',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'tiptap-ordered-list',
          },
        },
        listItem: {
          HTMLAttributes: {
            class: 'tiptap-list-item',
          },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'tiptap-blockquote',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'tiptap-code-block',
          },
        },
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-lime-700 dark:text-brand underline hover:opacity-80 font-medium',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-2 border border-[var(--border)]',
        },
      }),
    ],
    content: content || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const text = editor.getText();
      onChange(html === '<p></p>' ? '' : html, text);
    },
    onTransaction: ({ editor }) => {
      setCanUndo(editor.can().undo());
      setCanRedo(editor.can().redo());
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor-body focus:outline-none text-xs text-[var(--text-primary)] px-3.5 py-3 overflow-y-auto leading-relaxed',
        style: `min-height: ${minHeight};`,
      },
    },
    immediatelyRender: false,
  });

  // Sync external content if changed
  useEffect(() => {
    if (editor && content !== editor.getHTML() && content === '') {
      editor.commands.setContent('');
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  const openLinkDialog = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href || '';
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    setLinkUrl(previousUrl || 'https://');
    setLinkText(selectedText || '');
    setLinkDialogOpen(true);
  };

  const handleApplyLink = (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    e?.preventDefault();
    if (!editor) return;

    const trimmedUrl = linkUrl.trim();
    if (!trimmedUrl || trimmedUrl === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkDialogOpen(false);
      return;
    }

    if (linkText.trim() && editor.state.selection.empty) {
      editor
        .chain()
        .focus()
        .insertContent(`<a href="${trimmedUrl}">${linkText.trim()}</a> `)
        .run();
    } else {
      editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: trimmedUrl })
        .run();
    }

    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  };

  const handleRemoveLink = (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkDialogOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && onAddAttachment) {
      for (let i = 0; i < e.target.files.length; i++) {
        onAddAttachment(e.target.files[i]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden flex flex-col focus-within:border-lime-500/50 focus-within:ring-1 focus-within:ring-lime-500/20 transition-all relative">
      {/* Embedded CSS for TipTap Elements */}
      <style jsx global>{`
        .tiptap-editor-body {
          outline: none;
        }
        .tiptap-editor-body p {
          margin: 0.25rem 0;
          line-height: 1.6;
        }
        .tiptap-editor-body ul,
        .tiptap-bullet-list {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin: 0.4rem 0 !important;
        }
        .tiptap-editor-body ol,
        .tiptap-ordered-list {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin: 0.4rem 0 !important;
        }
        .tiptap-editor-body li,
        .tiptap-list-item {
          display: list-item !important;
          margin: 0.15rem 0 !important;
        }
        .tiptap-editor-body blockquote,
        .tiptap-blockquote {
          border-left: 3px solid #84cc16 !important;
          padding-left: 0.75rem !important;
          margin: 0.5rem 0 !important;
          font-style: italic !important;
          color: var(--text-secondary) !important;
        }
        .tiptap-editor-body pre,
        .tiptap-code-block {
          background: var(--bg-elevated) !important;
          border: 1px solid var(--border) !important;
          padding: 0.5rem 0.75rem !important;
          border-radius: 0.5rem !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          font-size: 11px !important;
          margin: 0.5rem 0 !important;
          overflow-x: auto !important;
        }
        .tiptap-editor-body code {
          background: var(--bg-elevated) !important;
          padding: 0.1rem 0.3rem !important;
          border-radius: 0.25rem !important;
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
          font-size: 11px !important;
        }
      `}</style>

      {/* Formatting Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60 text-[var(--text-secondary)] select-none">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('bold') ? 'bg-lime-500/20 text-lime-700 dark:text-brand font-bold' : ''
          }`}
          title="Tebal (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('italic') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Miring (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('underline') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Garis Bawah (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('strike') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Coret Teks"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1 self-center" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('bulletList') ? 'bg-lime-500/20 text-lime-700 dark:text-brand font-bold' : ''
          }`}
          title="Daftar Poin (Bullet List)"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('orderedList') ? 'bg-lime-500/20 text-lime-700 dark:text-brand font-bold' : ''
          }`}
          title="Daftar Angka (Numbered List)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('blockquote') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Kutipan (Quote)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('codeBlock') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Blok Kode"
        >
          <Code className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1 self-center" />

        {/* Link Button with Dialog Trigger */}
        <button
          type="button"
          onClick={openLinkDialog}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('link') ? 'bg-lime-500/20 text-lime-700 dark:text-brand font-bold' : ''
          }`}
          title="Sisipkan Tautan (Link Modal)"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {editor?.isActive('link') && (
          <button
            type="button"
            onClick={handleRemoveLink}
            disabled={disabled}
            className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-rose-500 transition-colors"
            title="Hapus Tautan"
          >
            <Unlink className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Attach File Button */}
        {onAddAttachment && (
          <>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || uploadingAttachment}
              className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
                uploadingAttachment ? 'animate-pulse text-lime-700 dark:text-brand' : ''
              }`}
              title="Lampirkan File (Gambar, PDF, Dokumen, Zip)"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().setParagraph().run()}
          disabled={disabled || !editor}
          className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          title="Hapus Pemformatan Teks"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={disabled || !editor || !canUndo}
            className={`p-1.5 rounded-lg transition-colors ${
              canUndo
                ? 'hover:bg-[var(--accent-soft)] text-[var(--text-primary)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
            }`}
            title="Urungkan (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={disabled || !editor || !canRedo}
            className={`p-1.5 rounded-lg transition-colors ${
              canRedo
                ? 'hover:bg-[var(--accent-soft)] text-[var(--text-primary)] cursor-pointer'
                : 'opacity-30 cursor-not-allowed text-[var(--text-muted)]'
            }`}
            title="Ulangi (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!content && (
          <div className="absolute top-3 left-3.5 pointer-events-none text-xs text-[var(--text-muted)] select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Attachment Chips Bar */}
      {attachments.length > 0 && (
        <div className="p-2.5 border-t border-[var(--border)] bg-[var(--bg-elevated)]/40 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Paperclip className="w-3 h-3 text-lime-700 dark:text-brand" />
            <span>{attachments.length} Lampiran:</span>
          </span>

          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs shadow-2xs group"
            >
              <FileText className="w-3.5 h-3.5 text-lime-700 dark:text-brand shrink-0" />
              <div className="truncate max-w-[140px] text-[11px] font-medium text-[var(--text-primary)]" title={att.name}>
                {att.name}
              </div>
              <span className="text-[9px] text-[var(--text-muted)] font-mono">
                ({formatFileSize(att.size)})
              </span>
              {onRemoveAttachment && (
                <button
                  type="button"
                  onClick={() => onRemoveAttachment(idx)}
                  className="p-0.5 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors ml-0.5"
                  title="Hapus Lampiran"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modern Floating Link Insert Dialog Modal */}
      {linkDialogOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs rounded-xl">
          <div className="w-full max-w-sm p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl space-y-3 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-primary)]">
                <Globe className="w-4 h-4 text-lime-700 dark:text-brand" />
                <span>Sisipkan Tautan (Link)</span>
              </div>
              <button
                type="button"
                onClick={() => setLinkDialogOpen(false)}
                className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  Teks Tautan (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Contoh: Klik di sini"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyLink(e);
                    }
                  }}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                  URL Tujuan Web *
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleApplyLink(e);
                    }
                  }}
                  required
                  autoFocus
                  className="text-xs h-8 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border)]">
                {editor?.isActive('link') && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLink}
                    className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs h-7 px-2.5 mr-auto"
                  >
                    Hapus Tautan
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLinkDialogOpen(false)}
                  className="text-xs h-7 px-2.5"
                >
                  Batal
                </Button>

                <Button
                  type="button"
                  onClick={(e) => handleApplyLink(e)}
                  size="sm"
                  className="text-xs h-7 px-3 font-bold gap-1"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Terapkan</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
