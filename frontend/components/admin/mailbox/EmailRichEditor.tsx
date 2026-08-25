'use client';

import React, { useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { EmailAttachment } from '@/types';

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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-lime-700 dark:text-brand underline hover:opacity-80',
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
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none focus:outline-none text-xs text-[var(--text-primary)] px-3.5 py-2.5 overflow-y-auto leading-relaxed`,
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

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Masukkan URL link:', previousUrl || 'https://');

    if (url === null) return;
    if (url === '' || url === 'https://') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden flex flex-col focus-within:border-lime-500/50 focus-within:ring-1 focus-within:ring-lime-500/20 transition-all">
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
            editor?.isActive('bulletList') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Daftar Poin"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('orderedList') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Daftar Angka"
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

        <button
          type="button"
          onClick={setLink}
          disabled={disabled || !editor}
          className={`p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors ${
            editor?.isActive('link') ? 'bg-lime-500/20 text-lime-700 dark:text-brand' : ''
          }`}
          title="Sisipkan Tautan (Link)"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {editor?.isActive('link') && (
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetLink().run()}
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
              title="Lampirkan File (Gambar, PDF, Dokumen)"
            >
              <Paperclip className="w-3.5 h-3.5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          disabled={disabled || !editor}
          className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] transition-colors"
          title="Hapus Pemformatan"
        >
          <Eraser className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => editor?.chain().focus().undo().run()}
            disabled={disabled || !editor?.can().undo()}
            className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] disabled:opacity-30 transition-colors"
            title="Urungkan (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().redo().run()}
            disabled={disabled || !editor?.can().redo()}
            className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] disabled:opacity-30 transition-colors"
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
          <div className="absolute top-2.5 left-3.5 pointer-events-none text-xs text-[var(--text-muted)] select-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Attachment Chips Bar */}
      {attachments.length > 0 && (
        <div className="p-2.5 border-t border-[var(--border)] bg-[var(--bg-elevated)]/40 flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1">
            <Paperclip className="w-3 h-3" />
            <span>{attachments.length} Lampiran:</span>
          </span>

          {attachments.map((att, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] text-xs shadow-2xs group"
            >
              <FileText className="w-3.5 h-3.5 text-lime-700 dark:text-brand shrink-0" />
              <div className="truncate max-w-[140px] text-[11px] font-medium text-[var(--text-primary)]">
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
    </div>
  );
}
