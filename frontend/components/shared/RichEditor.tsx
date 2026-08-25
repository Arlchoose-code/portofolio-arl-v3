'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { MediaLibrary } from './MediaLibrary';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getMediaUrl } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  X,
} from 'lucide-react';

interface RichEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export function RichEditor({ value, onChange, placeholder = 'Tulis konten di sini...' }: RichEditorProps) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert max-w-none min-h-[160px] p-4 focus:outline-none text-sm text-[var(--text-primary)]',
      },
    },
  });

  if (!editor) return null;

  const openLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setLinkModalOpen(true);
  };

  const handleSaveLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl.trim() }).run();
    }
    setLinkModalOpen(false);
  };

  const handleSelectMedia = (media: any) => {
    const imageUrl = getMediaUrl(media.medium_url || media.original_url);
    editor.chain().focus().setImage({ src: imageUrl, alt: media.original_name }).run();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden relative">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[var(--border)] bg-[var(--bg-base)]">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('bold') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('italic') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('underline') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('heading', { level: 2 }) ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('heading', { level: 3 }) ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('bulletList') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('orderedList') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Ordered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive({ textAlign: 'left' }) ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive({ textAlign: 'center' }) ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive({ textAlign: 'right' }) ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="w-[1px] h-4 bg-[var(--border)] mx-1" />

        <button
          type="button"
          onClick={openLinkModal}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('link') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setMediaOpen(true)}
          className="p-1.5 rounded hover:bg-[var(--accent-soft)] text-[var(--text-secondary)]"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('highlight') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Highlight"
        >
          <Highlighter className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`p-1.5 rounded hover:bg-[var(--accent-soft)] ${
            editor.isActive('codeBlock') ? 'bg-lime-500/20 text-lime-800 dark:bg-brand/20 dark:text-brand font-semibold' : 'text-[var(--text-secondary)]'
          }`}
          title="Code Block"
        >
          <Code className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Media Modal */}
      <MediaLibrary
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={handleSelectMedia}
      />

      {/* Custom Link Modal Dialog */}
      {linkModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-[var(--text-primary)]">Sisipkan Tautan (Link)</h3>
              <button
                type="button"
                onClick={() => setLinkModalOpen(false)}
                className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                URL Tautan
              </label>
              <Input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://contoh.com"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveLink();
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setLinkUrl('');
                  editor.chain().focus().extendMarkRange('link').unsetLink().run();
                  setLinkModalOpen(false);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Hapus Link
              </Button>

              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setLinkModalOpen(false)}>
                  Batal
                </Button>
                <Button type="button" variant="default" size="sm" onClick={handleSaveLink}>
                  Terapkan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
