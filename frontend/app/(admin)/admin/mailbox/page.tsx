'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { mailboxApi } from '@/lib/api';
import { EmailThread, EmailMessage, EmailSetting, MailboxStats, SenderItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Inbox,
  Send,
  Star,
  Trash2,
  Settings,
  PenSquare,
  Search,
  Reply,
  RefreshCw,
  Clock,
  User,
  Mail,
  ChevronRight,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  ArrowUpRight,
  ArrowLeft,
  Eye,
  CornerDownRight,
  Plus,
  Check,
  AtSign,
  Globe,
  Building2,
  Tag,
} from 'lucide-react';
import { toast } from 'sonner';

type MailFolder = 'inbox' | 'sent' | 'starred' | 'trash';

function AdminMailboxContent() {
  const searchParams = useSearchParams();
  const [folder, setFolder] = useState<MailFolder>('inbox');
  const [threads, setThreads] = useState<EmailThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Stats
  const [stats, setStats] = useState<MailboxStats>({
    unread_count: 0,
    inbox_count: 0,
    sent_count: 0,
    starred_count: 0,
    trash_count: 0,
  });

  // Settings & Multi-Sender
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [emailSetting, setEmailSetting] = useState<EmailSetting | null>(null);
  const [activeProvider, setActiveProvider] = useState<'hybrid' | 'brevo' | 'resend'>('hybrid');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [resendApiKeyInput, setResendApiKeyInput] = useState('');
  const [senderEmailInput, setSenderEmailInput] = useState('');
  const [senderNameInput, setSenderNameInput] = useState('');
  const [replyToEmailInput, setReplyToEmailInput] = useState('');
  const [replyToNameInput, setReplyToNameInput] = useState('');
  const [allowedInboundInput, setAllowedInboundInput] = useState('');
  const [inboundDomainInput, setInboundDomainInput] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Custom Senders Management
  const [sendersList, setSendersList] = useState<SenderItem[]>([]);
  const [newSenderName, setNewSenderName] = useState('');
  const [newSenderEmail, setNewSenderEmail] = useState('');
  const [syncingSenders, setSyncingSenders] = useState(false);

  // Compose Modal
  const [composeModalOpen, setComposeModalOpen] = useState(false);
  const [selectedSenderEmail, setSelectedSenderEmail] = useState('');
  const [selectedSenderName, setSelectedSenderName] = useState('');
  const [composeReplyTo, setComposeReplyTo] = useState('');
  const [composeTo, setComposeTo] = useState('');
  const [composeToName, setComposeToName] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Inline Reply
  const [replyBody, setReplyBody] = useState('');
  const [replySenderEmail, setReplySenderEmail] = useState('');
  const [replySenderName, setReplySenderName] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await mailboxApi.getStats();
      if (res.status && res.data) {
        setStats(res.data);
      }
    } catch {}
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const res = await mailboxApi.listThreads({
        folder,
        page,
        per_page: 20,
        search: search.trim() || undefined,
      });

      if (res.status && res.data) {
        setThreads(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch {
      toast.error('Gagal memuat daftar email.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await mailboxApi.getSettings();
      if (res.status && res.data) {
        setEmailSetting(res.data);
        setActiveProvider(res.data.active_provider || 'hybrid');
        setSenderEmailInput(res.data.default_sender_email || '');
        setSenderNameInput(res.data.default_sender_name || '');
        setReplyToEmailInput(res.data.reply_to_email || '');
        setReplyToNameInput(res.data.reply_to_name || '');
        setAllowedInboundInput(res.data.allowed_inbound_emails || '');
        setInboundDomainInput(res.data.inbound_domain || '');

        if (res.data.custom_senders && res.data.custom_senders.length > 0) {
          setSendersList(res.data.custom_senders);
        } else {
          setSendersList([
            {
              email: res.data.default_sender_email || 'contact@arlab.my.id',
              name: res.data.default_sender_name || 'Syahril Haryono',
              is_default: true,
              active: true,
            },
          ]);
        }

        if (!selectedSenderEmail) {
          setSelectedSenderEmail(res.data.default_sender_email || 'contact@arlab.my.id');
          setSelectedSenderName(res.data.default_sender_name || 'Syahril Haryono');
        }
        if (!replySenderEmail) {
          setReplySenderEmail(res.data.default_sender_email || 'contact@arlab.my.id');
          setReplySenderName(res.data.default_sender_name || 'Syahril Haryono');
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchThreads();
    fetchStats();
  }, [folder, page]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Handle compose query parameters from contacts or external links
  useEffect(() => {
    if (searchParams.get('compose') === 'true') {
      const to = searchParams.get('to') || '';
      const toName = searchParams.get('toName') || '';
      const subject = searchParams.get('subject') || '';
      const body = searchParams.get('body') || '';

      setComposeTo(to);
      setComposeToName(toName);
      setComposeSubject(subject);
      setComposeBody(body);
      setComposeModalOpen(true);
    }
  }, [searchParams]);

  const handleSelectThread = async (t: EmailThread) => {
    setLoadingThread(true);
    try {
      const res = await mailboxApi.getThread(t.id);
      if (res.status && res.data) {
        setSelectedThread(res.data);
        // Mark thread as read in local state
        setThreads((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, has_unread: false } : item))
        );
        fetchStats();
      }
    } catch {
      toast.error('Gagal memuat percakapan email.');
    } finally {
      setLoadingThread(false);
    }
  };

  const handleToggleStar = async (threadId: number, currentStarred: boolean, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await mailboxApi.updateStatus(threadId, { is_starred: !currentStarred });
      if (res.status) {
        setThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, is_starred: !currentStarred } : t))
        );
        if (selectedThread?.id === threadId) {
          setSelectedThread({ ...selectedThread, is_starred: !currentStarred });
        }
        fetchStats();
      }
    } catch {
      toast.error('Gagal mengubah status bintang.');
    }
  };

  const handleMoveToTrash = async (threadId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await mailboxApi.updateStatus(threadId, { is_trash: true });
      if (res.status) {
        toast.success('Email dipindahkan ke sampah.');
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (selectedThread?.id === threadId) {
          setSelectedThread(null);
        }
        fetchStats();
      }
    } catch {
      toast.error('Gagal memindahkan ke sampah.');
    }
  };

  const handleRestoreFromTrash = async (threadId: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const res = await mailboxApi.updateStatus(threadId, { is_trash: false });
      if (res.status) {
        toast.success('Email berhasil dipulihkan.');
        setThreads((prev) => prev.filter((t) => t.id !== threadId));
        if (selectedThread?.id === threadId) {
          setSelectedThread(null);
        }
        fetchStats();
      }
    } catch {
      toast.error('Gagal memulihkan email.');
    }
  };

  const handlePermanentDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await mailboxApi.deleteThread(deleteId);
      if (res.status) {
        toast.success('Email berhasil dihapus permanen.');
        setThreads((prev) => prev.filter((t) => t.id !== deleteId));
        if (selectedThread?.id === deleteId) {
          setSelectedThread(null);
        }
        setConfirmDeleteOpen(false);
        setDeleteId(null);
        fetchStats();
      }
    } catch {
      toast.error('Gagal menghapus email.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddCustomSender = () => {
    if (!newSenderEmail.trim() || !newSenderName.trim()) {
      toast.error('Nama dan Email pengirim wajib diisi.');
      return;
    }
    if (sendersList.some((s) => s.email.toLowerCase() === newSenderEmail.trim().toLowerCase())) {
      toast.error('Email pengirim ini sudah ada dalam daftar.');
      return;
    }
    const updated: SenderItem[] = [
      ...sendersList,
      {
        email: newSenderEmail.trim(),
        name: newSenderName.trim(),
        is_default: sendersList.length === 0,
        active: true,
      },
    ];
    setSendersList(updated);
    setNewSenderEmail('');
    setNewSenderName('');
    toast.success('Pengirim baru ditambahkan ke daftar.');
  };

  const handleSetDefaultSender = (email: string) => {
    const updated = sendersList.map((s) => ({
      ...s,
      is_default: s.email === email,
    }));
    setSendersList(updated);
    const def = sendersList.find((s) => s.email === email);
    if (def) {
      setSenderEmailInput(def.email);
      setSenderNameInput(def.name);
      toast.success(`Pengirim default diubah ke ${def.name} <${def.email}>`);
    }
  };

  const handleDeleteCustomSender = (email: string) => {
    if (sendersList.length <= 1) {
      toast.error('Harus menyisakan minimal 1 pengirim.');
      return;
    }
    const updated = sendersList.filter((s) => s.email !== email);
    if (!updated.some((s) => s.is_default)) {
      updated[0].is_default = true;
      setSenderEmailInput(updated[0].email);
      setSenderNameInput(updated[0].name);
    }
    setSendersList(updated);
    toast.success('Pengirim dihapus dari daftar.');
  };

  const handleSyncBrevo = async () => {
    setSyncingSenders(true);
    try {
      const res = await mailboxApi.syncBrevoSenders();
      if (res.status && res.data) {
        setSendersList(res.data.senders || []);
        toast.success(res.message || 'Pengirim berhasil disinkronkan dari Brevo!');
        fetchSettings();
      } else {
        toast.error(res.message || 'Gagal menyinkronkan pengirim dari Brevo.');
      }
    } catch {
      toast.error('Gagal menghubungi API Brevo. Pastikan API key sudah disimpan.');
    } finally {
      setSyncingSenders(false);
    }
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim() || !composeSubject.trim() || !composeBody.trim()) {
      toast.error('Mohon lengkapi penerima, subjek, dan isi email.');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await mailboxApi.send({
        sender_email: selectedSenderEmail.trim() || undefined,
        sender_name: selectedSenderName.trim() || undefined,
        reply_to_email: composeReplyTo.trim() || undefined,
        to_email: composeTo.trim(),
        to_name: composeToName.trim() || undefined,
        cc: composeCc.trim() || undefined,
        bcc: composeBcc.trim() || undefined,
        subject: composeSubject.trim(),
        body_html: composeBody.trim(),
        body_text: composeBody.trim(),
      });

      if (res.status) {
        toast.success(`Email berhasil dikirim sebagai ${selectedSenderEmail || 'pengirim default'}!`);
        setComposeModalOpen(false);
        setComposeTo('');
        setComposeToName('');
        setComposeCc('');
        setComposeBcc('');
        setComposeReplyTo('');
        setComposeSubject('');
        setComposeBody('');
        fetchThreads();
        fetchStats();
      } else {
        toast.error(res.message || 'Gagal mengirim email.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengirim email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedThread || !replyBody.trim()) {
      toast.error('Isi balasan tidak boleh kosong.');
      return;
    }

    setSendingReply(true);
    try {
      const res = await mailboxApi.reply({
        thread_id: selectedThread.id,
        sender_email: replySenderEmail.trim() || undefined,
        sender_name: replySenderName.trim() || undefined,
        body_html: replyBody.trim(),
        body_text: replyBody.trim(),
      });

      if (res.status) {
        toast.success(`Balasan berhasil dikirim sebagai ${replySenderEmail || 'pengirim default'}!`);
        setReplyBody('');
        // Refresh thread to display newly sent message
        handleSelectThread(selectedThread);
        fetchStats();
      } else {
        toast.error(res.message || 'Gagal mengirim balasan.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Gagal mengirim balasan.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await mailboxApi.updateSettings({
        active_provider: activeProvider,
        brevo_api_key: apiKeyInput.trim() || undefined,
        resend_api_key: resendApiKeyInput.trim() || undefined,
        default_sender_email: senderEmailInput.trim() || undefined,
        default_sender_name: senderNameInput.trim() || undefined,
        reply_to_email: replyToEmailInput.trim() || undefined,
        reply_to_name: replyToNameInput.trim() || undefined,
        custom_senders_json: JSON.stringify(sendersList),
        allowed_inbound_emails: allowedInboundInput.trim() || undefined,
        inbound_domain: inboundDomainInput.trim() || undefined,
      });

      if (res.status) {
        toast.success('Pengaturan email & identitas pengirim berhasil disimpan!');
        setSettingsModalOpen(false);
        fetchSettings();
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan email.');
    } finally {
      setSavingSettings(false);
    }
  };

  const formatEmailTime = (raw?: string) => {
    if (!raw) return '';
    try {
      const d = new Date(raw);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      }
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return raw;
    }
  };

  return (
    <div className="h-[calc(100vh-100px)] flex flex-col space-y-4 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center border border-lime-500/20">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Kotak Surat (Webmail)</h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Kirim, terima, dan balas email secara real-time terintegrasi dengan Brevo Transactional & Inbound Webhook.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Kelola Akun &amp; Pengaturan Email</span>
            {emailSetting?.is_configured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500" title="Provider Terkonfigurasi" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Perlu Konfigurasi API Key" />
            )}
          </Button>

          <Button
            size="sm"
            onClick={() => setComposeModalOpen(true)}
            className="gap-2 font-bold shadow-lg shadow-brand/10"
          >
            <PenSquare className="w-4 h-4" />
            <span>Tulis Email</span>
          </Button>
        </div>
      </div>

      {/* Mobile Folder Selector Tabs (< lg) */}
      <div className="flex lg:hidden items-center gap-1.5 p-1.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border)] overflow-x-auto shrink-0">
        <button
          type="button"
          onClick={() => { setFolder('inbox'); setPage(1); setSelectedThread(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            folder === 'inbox'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          <Inbox className="w-3.5 h-3.5" />
          <span>Masuk</span>
          {stats.unread_count > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-white/20 dark:bg-black/20">
              {stats.unread_count}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setFolder('sent'); setPage(1); setSelectedThread(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            folder === 'sent'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>Terkirim</span>
        </button>

        <button
          type="button"
          onClick={() => { setFolder('starred'); setPage(1); setSelectedThread(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            folder === 'starred'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          <Star className="w-3.5 h-3.5" />
          <span>Berbintang</span>
        </button>

        <button
          type="button"
          onClick={() => { setFolder('trash'); setPage(1); setSelectedThread(null); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-all ${
            folder === 'trash'
              ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a]'
              : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Sampah</span>
        </button>
      </div>

      {/* Main Mailbox Interface: Split View */}
      <div className="flex-1 flex rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm min-h-0">
        {/* Left Folder Navigation Sidebar */}
        <aside className="hidden lg:flex w-56 border-r border-[var(--border)] bg-[var(--bg-elevated)]/50 p-3 flex-col justify-between shrink-0">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setFolder('inbox');
                setPage(1);
                setSelectedThread(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                folder === 'inbox'
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Kotak Masuk</span>
              </div>
              {stats.unread_count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    folder === 'inbox'
                      ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                      : 'bg-lime-500/20 text-lime-700 dark:bg-brand/20 dark:text-brand'
                  }`}
                >
                  {stats.unread_count}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFolder('sent');
                setPage(1);
                setSelectedThread(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                folder === 'sent'
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Terkirim</span>
              </div>
              {stats.sent_count > 0 && (
                <span className="text-[10px] opacity-70 font-mono">{stats.sent_count}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFolder('starred');
                setPage(1);
                setSelectedThread(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                folder === 'starred'
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4" />
                <span>Berbintang</span>
              </div>
              {stats.starred_count > 0 && (
                <span className="text-[10px] opacity-70 font-mono">{stats.starred_count}</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setFolder('trash');
                setPage(1);
                setSelectedThread(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                folder === 'trash'
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Trash2 className="w-4 h-4" />
                <span>Sampah</span>
              </div>
              {stats.trash_count > 0 && (
                <span className="text-[10px] opacity-70 font-mono">{stats.trash_count}</span>
              )}
            </button>
          </div>

          {/* Active Email Accounts List & Management Card */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                <span>Akun &amp; Identitas</span>
              </span>
              <button
                type="button"
                onClick={() => setSettingsModalOpen(true)}
                className="text-[10px] text-lime-700 dark:text-brand font-semibold hover:underline"
              >
                + Kelola
              </button>
            </div>

            <div className="space-y-1.5 max-h-32 overflow-y-auto pr-0.5 text-xs">
              {sendersList.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-1 p-1.5 rounded-lg bg-[var(--bg-elevated)]/60 border border-[var(--border)] text-[11px]"
                >
                  <div className="truncate min-w-0">
                    <div className="font-semibold text-[var(--text-primary)] truncate">{s.name}</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono truncate">{s.email}</div>
                  </div>
                  {s.is_default && (
                    <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-lime-500/20 text-lime-700 dark:text-brand shrink-0">
                      Utama
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Engine Status Pill */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-lime-700 dark:text-brand">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid Engine</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {emailSetting?.is_configured
                ? 'API Terhubung & Siap Kirim/Terima Email'
                : 'Mode Simulasi Dev (Belum ada API Key)'}
            </p>
          </div>
        </aside>

        {/* Center Thread List Pane */}
        <div className={`w-full lg:w-80 xl:w-96 border-r border-[var(--border)] flex flex-col shrink-0 min-h-0 bg-[var(--bg-surface)] ${
          selectedThread ? 'hidden lg:flex' : 'flex'
        }`}>
          {/* Search Header */}
          <div className="p-3 border-b border-[var(--border)] flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Input
                placeholder="Cari subjek, pengirim..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchThreads()}
                className="pl-8 h-8 text-xs bg-[var(--bg-elevated)]"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={fetchThreads}
              className="h-8 w-8 p-0 shrink-0 text-[var(--text-muted)]"
              title="Segarkan email"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Thread List Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
            {threads.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-[var(--bg-elevated)] mx-auto flex items-center justify-center text-[var(--text-muted)]">
                  <Mail className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-[var(--text-secondary)]">Tidak ada email</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  {folder === 'inbox' ? 'Kotak masuk kosong' : 'Belum ada riwayat email di folder ini'}
                </div>
              </div>
            ) : (
              threads.map((t) => {
                const isSelected = selectedThread?.id === t.id;
                const isUnread = t.has_unread;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectThread(t)}
                    className={`p-3.5 cursor-pointer transition-colors relative space-y-1.5 ${
                      isSelected
                        ? 'bg-lime-500/10 dark:bg-brand/10 border-l-2 border-lime-600 dark:border-brand'
                        : 'hover:bg-[var(--bg-elevated)]/60'
                    }`}
                  >
                    {/* Top Row: Subject & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-lime-600 dark:bg-brand shrink-0" />
                        )}
                        <span
                          className={`text-xs truncate ${
                            isUnread ? 'font-bold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'
                          }`}
                        >
                          {t.subject || '(Tanpa Subjek)'}
                        </span>
                      </div>

                      <span className="text-[10px] text-[var(--text-muted)] font-mono shrink-0">
                        {formatEmailTime(t.last_message_at)}
                      </span>
                    </div>

                    {/* Snippet */}
                    <p className="text-[11px] text-[var(--text-muted)] line-clamp-1 leading-snug">
                      {t.snippet || 'Tidak ada pratinjau teks.'}
                    </p>

                    {/* Badges / Indicators */}
                    <div className="flex items-center gap-2 pt-0.5">
                      {t.is_starred && (
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      )}

                      {t.message_count > 1 && (
                        <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                          {t.message_count} pesan
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Message Viewer & Reply Pane */}
        <div className={`flex-1 flex flex-col min-h-0 bg-[var(--bg-base)] ${
          selectedThread ? 'flex' : 'hidden lg:flex'
        }`}>
          {loadingThread ? (
            <div className="flex-1 flex items-center justify-center p-8 text-xs text-[var(--text-muted)] animate-pulse">
              Memuat percakapan email...
            </div>
          ) : selectedThread ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Thread Header Toolbar */}
              <div className="px-4 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)] flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedThread(null)}
                    className="lg:hidden h-8 px-2 text-xs gap-1 shrink-0"
                    title="Kembali ke daftar pesan"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden xs:inline">Daftar</span>
                  </Button>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
                      {selectedThread.subject || '(Tanpa Subjek)'}
                    </h3>
                    <div className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                      ID #{selectedThread.id} • {selectedThread.message_count} Pesan
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStar(selectedThread.id, selectedThread.is_starred)}
                    className="h-8 px-2 text-xs"
                    title={selectedThread.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedThread.is_starred ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </Button>

                  {folder === 'trash' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestoreFromTrash(selectedThread.id)}
                        className="h-8 text-xs"
                      >
                        Pulihkan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDeleteId(selectedThread.id);
                          setConfirmDeleteOpen(true);
                        }}
                        className="h-8 px-2 text-red-500 hover:text-red-600 hover:bg-red-500/10 text-xs"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveToTrash(selectedThread.id)}
                      className="h-8 px-2 text-[var(--text-muted)] hover:text-red-500 text-xs"
                      title="Pindahkan ke Sampah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Thread Messages Timeline */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {selectedThread.messages?.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';

                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isOutbound
                          ? 'border-lime-500/30 bg-lime-500/5 dark:border-brand/30 dark:bg-brand/5'
                          : 'border-[var(--border)] bg-[var(--bg-surface)]'
                      }`}
                    >
                      {/* Sender Info Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border)] pb-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full font-bold flex items-center justify-center text-xs shrink-0 ${
                              isOutbound
                                ? 'bg-lime-700 text-white dark:bg-brand dark:text-black shadow-xs'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]'
                            }`}
                          >
                            {msg.from_name ? msg.from_name.charAt(0).toUpperCase() : 'M'}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-[var(--text-primary)]">
                                {msg.from_name || msg.from_email}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                                  isOutbound
                                    ? 'bg-lime-500/20 text-lime-800 dark:text-brand border border-lime-500/30'
                                    : 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border border-blue-500/30'
                                }`}
                              >
                                {isOutbound ? 'Terkirim (Outbound)' : 'Diterima (Inbound)'}
                              </span>
                            </div>

                            <div className="text-[11px] text-[var(--text-muted)] font-mono">
                              Dari: &lt;{msg.from_email}&gt; • Kepada: &lt;{msg.to_email}&gt;
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(msg.created_at).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Message Body Content */}
                      <div className="text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap select-text overflow-x-auto">
                        {msg.body_html ? (
                          <div
                            dangerouslySetInnerHTML={{ __html: msg.body_html }}
                            className="prose dark:prose-invert max-w-none text-xs"
                          />
                        ) : (
                          msg.body_text
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Inline Quick Reply Box */}
                <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-md space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                      <Reply className="w-4 h-4 text-lime-700 dark:text-brand" />
                      <span>Kirim Balasan Langsung</span>
                    </div>

                    {/* Sender Selector for Reply */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[11px] text-[var(--text-muted)] font-medium">Balas Sebagai:</span>
                      <select
                        value={replySenderEmail}
                        onChange={(e) => {
                          const chosen = sendersList.find((s) => s.email === e.target.value);
                          setReplySenderEmail(e.target.value);
                          if (chosen) setReplySenderName(chosen.name);
                        }}
                        className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] text-[11px] font-semibold text-[var(--text-primary)] focus:outline-none focus:border-lime-500 transition-colors"
                      >
                        {sendersList.map((s, idx) => (
                          <option key={idx} value={s.email}>
                            {s.name} &lt;{s.email}&gt; {s.is_default ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <form onSubmit={handleSendReply} className="space-y-3">
                    <Textarea
                      placeholder="Tuliskan balasan email Anda di sini..."
                      rows={4}
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      disabled={sendingReply}
                      className="text-xs"
                    />

                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">
                        Header <code>In-Reply-To</code> & <code>References</code> akan disematkan otomatis.
                      </span>

                      <Button
                        type="submit"
                        size="sm"
                        disabled={sendingReply}
                        className="gap-2 font-bold shadow-sm"
                      >
                        {sendingReply ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            <span>Mengirim...</span>
                          </>
                        ) : (
                          <>
                            <span>Kirim Balasan</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-3 text-[var(--text-muted)]">
              <div className="w-16 h-16 rounded-3xl bg-[var(--bg-elevated)] flex items-center justify-center border border-[var(--border)] shadow-xs">
                <Mail className="w-8 h-8 opacity-40" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Pilih Email untuk Dibaca
              </h3>
              <p className="text-xs max-w-sm">
                Pilih salah satu percakapan di sebelah kiri untuk melihat riwayat pesan atau klik tombol "Tulis Email" untuk mengirim pesan baru.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Compose Email Modal Dialog */}
      <AnimatePresence>
        {composeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center border border-lime-500/20">
                    <PenSquare className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Tulis Email Baru</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setComposeModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Form */}
              <form onSubmit={handleSendCompose} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Sender Identity Selection */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                    <span>Kirim Sebagai (Identitas Pengirim) *</span>
                    <button
                      type="button"
                      onClick={() => {
                        setComposeModalOpen(false);
                        setSettingsModalOpen(true);
                      }}
                      className="text-[10px] text-lime-700 dark:text-brand hover:underline"
                    >
                      + Kelola Pengirim di Pengaturan
                    </button>
                  </label>
                  <select
                    value={selectedSenderEmail}
                    onChange={(e) => {
                      const chosen = sendersList.find((s) => s.email === e.target.value);
                      setSelectedSenderEmail(e.target.value);
                      if (chosen) setSelectedSenderName(chosen.name);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-lime-500 transition-colors"
                  >
                    {sendersList.map((s, idx) => (
                      <option key={idx} value={s.email}>
                        {s.name} &lt;{s.email}&gt; {s.is_default ? '(Default)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Alamat Email Penerima *
                    </label>
                    <Input
                      type="email"
                      placeholder="client@example.com"
                      value={composeTo}
                      onChange={(e) => setComposeTo(e.target.value)}
                      required
                      disabled={sendingEmail}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Nama Penerima</span>
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(!showCcBcc)}
                        className="text-[10px] text-lime-700 dark:text-brand hover:underline"
                      >
                        {showCcBcc ? 'Sembunyikan Opsi Lanjutan' : '+ Opsi Lanjutan (Cc/Bcc/Reply-To)'}
                      </button>
                    </label>
                    <Input
                      placeholder="Nama Klien / Perusahaan"
                      value={composeToName}
                      onChange={(e) => setComposeToName(e.target.value)}
                      disabled={sendingEmail}
                    />
                  </div>
                </div>

                {showCcBcc && (
                  <div className="space-y-3 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Cc</label>
                        <Input
                          placeholder="cc1@example.com, cc2@example.com"
                          value={composeCc}
                          onChange={(e) => setComposeCc(e.target.value)}
                          disabled={sendingEmail}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--text-secondary)]">Bcc</label>
                        <Input
                          placeholder="bcc@example.com"
                          value={composeBcc}
                          onChange={(e) => setComposeBcc(e.target.value)}
                          disabled={sendingEmail}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">
                        Reply-To Khusus (Opsional)
                      </label>
                      <Input
                        placeholder="replyto@arlab.my.id"
                        value={composeReplyTo}
                        onChange={(e) => setComposeReplyTo(e.target.value)}
                        disabled={sendingEmail}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Subjek Email *
                  </label>
                  <Input
                    placeholder="Contoh: Diskusi Kerja Sama Proyek Software"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    required
                    disabled={sendingEmail}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Isi Email (HTML / Teks) *
                  </label>
                  <Textarea
                    placeholder="Halo, terima kasih telah menghubungi kami..."
                    rows={8}
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    required
                    disabled={sendingEmail}
                    className="text-xs"
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComposeModalOpen(false)}
                    disabled={sendingEmail}
                  >
                    Batal
                  </Button>

                  <Button type="submit" disabled={sendingEmail} className="gap-2 font-bold shadow-sm">
                    {sendingEmail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <span>Kirim Email</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Email & Multi-Sender Settings Modal Dialog */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-lime-500/10 text-lime-700 dark:text-brand flex items-center justify-center border border-lime-500/20">
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Pengaturan Email, Multi-Sender &amp; Akun Masuk
                    </h3>
                    <p className="text-[10px] text-[var(--text-muted)]">
                      Kelola identitas pengirim, akun penerima (inbound filter), dan API provider email.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(false)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-soft)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="p-6 space-y-5 overflow-y-auto flex-1">
                {/* Mode Provider Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Mode Provider Email</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveProvider('hybrid')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeProvider === 'hybrid'
                          ? 'border-lime-500 bg-lime-500/10 dark:border-brand dark:bg-brand/10 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-primary)]">⚡ Hybrid (Disarankan)</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Brevo (300) + Resend (100) + Terima via Resend</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveProvider('brevo')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeProvider === 'brevo'
                          ? 'border-lime-500 bg-lime-500/10 dark:border-brand dark:bg-brand/10 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-primary)]">🚀 Brevo Saja</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Kirim 300 email/hari</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveProvider('resend')}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        activeProvider === 'resend'
                          ? 'border-lime-500 bg-lime-500/10 dark:border-brand dark:bg-brand/10 shadow-xs'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)]/80'
                      }`}
                    >
                      <div className="font-bold text-xs text-[var(--text-primary)]">✉️ Resend Saja</div>
                      <div className="text-[10px] text-[var(--text-muted)] mt-0.5">Kirim 100 & Terima Gratis</div>
                    </button>
                  </div>
                </div>

                {/* API Keys */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Brevo API Key (v3)</span>
                      {emailSetting?.brevo_api_key_masked && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {emailSetting.brevo_api_key_masked}
                        </span>
                      )}
                    </label>
                    <Input
                      type="password"
                      placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      disabled={savingSettings}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                      <span>Resend API Key</span>
                      {emailSetting?.resend_api_key_masked && (
                        <span className="text-[10px] font-mono text-[var(--text-muted)]">
                          {emailSetting.resend_api_key_masked}
                        </span>
                      )}
                    </label>
                    <Input
                      type="password"
                      placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
                      value={resendApiKeyInput}
                      onChange={(e) => setResendApiKeyInput(e.target.value)}
                      disabled={savingSettings}
                    />
                  </div>
                </div>

                {/* Multi-Sender Identities Management */}
                <div className="space-y-3 pt-2 border-t border-[var(--border)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                        <span>Daftar Identitas Pengirim (Senders)</span>
                      </label>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Pilih identitas mana yang digunakan saat mengirim atau membalas email.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSyncBrevo}
                      disabled={syncingSenders || savingSettings}
                      className="gap-1.5 text-xs py-1 h-7"
                    >
                      <RefreshCw className={`w-3 h-3 ${syncingSenders ? 'animate-spin' : ''}`} />
                      <span>{syncingSenders ? 'Menyinkronkan...' : 'Sinkronkan dari Brevo'}</span>
                    </Button>
                  </div>

                  {/* Senders List */}
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {sendersList.map((sender, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                          sender.is_default
                            ? 'border-lime-500/50 bg-lime-500/5 dark:border-brand/40 dark:bg-brand/5'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center font-bold text-xs text-lime-700 dark:text-brand border border-[var(--border)]">
                            {sender.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                              <span>{sender.name}</span>
                              {sender.is_default && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-lime-500/20 text-lime-700 dark:text-brand">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                              {sender.email}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {!sender.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultSender(sender.email)}
                              className="px-2 py-1 rounded-lg text-[10px] font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:bg-[var(--accent-soft)] transition-colors"
                            >
                              Jadikan Default
                            </button>
                          )}
                          {sendersList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomSender(sender.email)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Hapus Pengirim"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add New Sender Form */}
                  <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/40 space-y-2">
                    <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                      + Tambah Identitas / Akun Pengirim Baru:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <Input
                        placeholder="Nama (misal: Syahril Support)"
                        value={newSenderName}
                        onChange={(e) => setNewSenderName(e.target.value)}
                        className="sm:col-span-2 text-xs"
                      />
                      <Input
                        type="email"
                        placeholder="support@arlab.my.id"
                        value={newSenderEmail}
                        onChange={(e) => setNewSenderEmail(e.target.value)}
                        className="sm:col-span-2 text-xs"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handleAddCustomSender}
                        className="sm:col-span-1 text-xs font-bold"
                      >
                        Tambah
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Allowed Inbound Recipient Accounts (Filter Masuk) */}
                <div className="space-y-2 pt-2 border-t border-[var(--border)]">
                  <label className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Akun / Alamat Penerima yang Diizinkan Masuk (Inbound Whitelist)</span>
                  </label>
                  <Input
                    placeholder="contact@arlab.my.id, syahril@arlab.my.id, admin@arlab.my.id"
                    value={allowedInboundInput}
                    onChange={(e) => setAllowedInboundInput(e.target.value)}
                    disabled={savingSettings}
                  />
                  <p className="text-[10px] text-[var(--text-muted)] leading-relaxed">
                    💡 Pisahkan dengan koma jika ada beberapa akun (misal: <code>contact@arlab.my.id, syahril@arlab.my.id, info@arlab.my.id</code>).
                    <br />
                    🔒 <strong>Sistem Keamanan:</strong> Email yang masuk ke alamat di luar akun terdaftar akan <strong>otomatis ditolak</strong> untuk mencegah spam alamat acak.
                  </p>
                </div>

                {/* Reply-To Defaults */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border)]">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Default Reply-To Email
                    </label>
                    <Input
                      placeholder="contact@arlab.my.id"
                      value={replyToEmailInput}
                      onChange={(e) => setReplyToEmailInput(e.target.value)}
                      disabled={savingSettings}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Default Reply-To Name
                    </label>
                    <Input
                      placeholder="Syahril Haryono"
                      value={replyToNameInput}
                      onChange={(e) => setReplyToNameInput(e.target.value)}
                      disabled={savingSettings}
                    />
                  </div>
                </div>

                {/* DNS Setup Guide Card */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] space-y-2 leading-relaxed">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Konfigurasi DNS Resend Inbound &amp; SPF Record</span>
                  </div>

                  <div className="space-y-1 text-[10px] font-mono">
                    <div>
                      <strong>1. Webhook Inbound Resend:</strong>
                      <code className="block text-lime-700 dark:text-brand bg-[var(--bg-surface)] p-1.5 rounded mt-0.5 break-all">
                        https://arlab.my.id/api/public/webhooks/resend/inbound
                      </code>
                    </div>

                    <div>
                      <strong>2. MX Record Domain (Penerima):</strong>
                      <code className="block bg-[var(--bg-surface)] p-1.5 rounded mt-0.5">
                        Type: MX | Host: @ | Priority: 10 | Value: feedback-smtp.us-east-1.amazonses.com
                      </code>
                    </div>

                    <div>
                      <strong>3. SPF Record (Anti-Spam Brevo + Resend):</strong>
                      <code className="block bg-[var(--bg-surface)] p-1.5 rounded mt-0.5 break-all">
                        v=spf1 include:spf.sendinblue.com include:resend.com ~all
                      </code>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSettingsModalOpen(false)}
                    disabled={savingSettings}
                  >
                    Tutup
                  </Button>

                  <Button type="submit" disabled={savingSettings} className="gap-2 font-bold">
                    {savingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
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
        title="Hapus Email Permanen"
        description="Apakah Anda yakin ingin menghapus seluruh percakapan email ini secara permanen?"
        confirmLabel="Hapus Permanen"
        cancelLabel="Batal"
        isLoading={isDeleting}
        onConfirm={handlePermanentDelete}
        onCancel={() => {
          setConfirmDeleteOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
}

export default function AdminMailboxPage() {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-sm font-mono text-[var(--text-muted)] animate-pulse">
          Memuat Kotak Surat Webmail...
        </div>
      }
    >
      <AdminMailboxContent />
    </Suspense>
  );
}
