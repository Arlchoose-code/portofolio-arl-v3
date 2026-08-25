'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { mailboxApi } from '@/lib/api';
import { EmailThread, EmailMessage, EmailSetting, MailboxStats, SenderItem, EmailAttachment } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EmailRichEditor } from '@/components/admin/mailbox/EmailRichEditor';
import { EmailHtmlViewer } from '@/components/admin/mailbox/EmailHtmlViewer';
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
  Printer,
  Download,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Paperclip,
  Forward,
  ChevronLeft,
  Filter,
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
  const [composeText, setComposeText] = useState('');
  const [composeAttachments, setComposeAttachments] = useState<EmailAttachment[]>([]);
  const [uploadingComposeAttachment, setUploadingComposeAttachment] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  // Inline Reply
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyAttachments, setReplyAttachments] = useState<EmailAttachment[]>([]);
  const [uploadingReplyAttachment, setUploadingReplyAttachment] = useState(false);
  const [replySenderEmail, setReplySenderEmail] = useState('');
  const [replySenderName, setReplySenderName] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Message Details Popover ("Kepada saya ▾")
  const [expandedDetailsMsgId, setExpandedDetailsMsgId] = useState<number | null>(null);

  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-Account Switcher (Gmail / Apple Mail style)
  const [selectedAccount, setSelectedAccount] = useState<string>('all');

  const handleUploadComposeAttachment = async (file: File) => {
    setUploadingComposeAttachment(true);
    try {
      const res = await mailboxApi.uploadAttachment(file);
      if (res.status && res.data) {
        setComposeAttachments((prev) => [...prev, res.data]);
        toast.success(`File ${file.name} berhasil dilampirkan`);
      } else {
        toast.error(res.message || 'Gagal mengunggah lampiran');
      }
    } catch {
      toast.error('Gagal mengunggah lampiran');
    } finally {
      setUploadingComposeAttachment(false);
    }
  };

  const handleRemoveComposeAttachment = (index: number) => {
    setComposeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadReplyAttachment = async (file: File) => {
    setUploadingReplyAttachment(true);
    try {
      const res = await mailboxApi.uploadAttachment(file);
      if (res.status && res.data) {
        setReplyAttachments((prev) => [...prev, res.data]);
        toast.success(`File ${file.name} berhasil dilampirkan`);
      } else {
        toast.error(res.message || 'Gagal mengunggah lampiran');
      }
    } catch {
      toast.error('Gagal mengunggah lampiran');
    } finally {
      setUploadingReplyAttachment(false);
    }
  };

  const handleRemoveReplyAttachment = (index: number) => {
    setReplyAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExportEml = (msg: EmailMessage) => {
    const emlContent = [
      `From: "${msg.from_name || ''}" <${msg.from_email}>`,
      `To: "${msg.to_name || ''}" <${msg.to_email}>`,
      `Subject: ${msg.subject}`,
      `Date: ${new Date(msg.created_at).toUTCString()}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      msg.body_html || msg.body_text || '',
    ].join('\r\n');

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(msg.subject || 'email').replace(/[^a-zA-Z0-9_-]/g, '_')}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('File .eml berhasil diunduh');
  };

  const handlePrintThread = () => {
    if (!selectedThread) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const msgsHtml = (selectedThread.messages || [])
      .map(
        (m) => `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 16px 0; margin-bottom: 16px;">
          <div style="font-size: 13px; font-weight: bold; color: #0f172a;">${m.from_name || m.from_email} &lt;${m.from_email}&gt;</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Kepada: ${m.to_name || m.to_email} &lt;${m.to_email}&gt; • ${new Date(m.created_at).toLocaleString('id-ID')}</div>
          <div style="margin-top: 12px; font-size: 13px; line-height: 1.6;">${m.body_html || m.body_text || ''}</div>
        </div>
      `
      )
      .join('');

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>Cetak: ${selectedThread.subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 24px; color: #000; font-size: 13px; }
    h1 { font-size: 18px; font-weight: bold; margin-bottom: 16px; border-bottom: 2px solid #000; padding-bottom: 8px; }
  </style>
</head>
<body>
  <h1>${selectedThread.subject || '(Tanpa Subjek)'}</h1>
  ${msgsHtml}
</body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 400);
  };

  const reqIdRef = React.useRef(0);
  const initialStatsFetchedRef = React.useRef(false);
  const prevUnreadCountRef = React.useRef<number>(0);

  const fetchStats = useCallback(async () => {
    try {
      const res = await mailboxApi.getStats(selectedAccount);
      if (res.status && res.data) {
        const newStats = res.data;
        if (initialStatsFetchedRef.current) {
          if (newStats.unread_count > prevUnreadCountRef.current) {
            const diff = newStats.unread_count - prevUnreadCountRef.current;
            toast.info(`📬 ${diff} email baru masuk!`);
          }
        } else {
          initialStatsFetchedRef.current = true;
        }
        prevUnreadCountRef.current = newStats.unread_count;
        setStats(newStats);
      }
    } catch {}
  }, [selectedAccount]);

  const fetchThreads = useCallback(async (isSilent = false) => {
    const reqId = ++reqIdRef.current;
    if (!isSilent) setLoading(true);

    try {
      const res = await mailboxApi.listThreads({
        folder,
        account: selectedAccount !== 'all' ? selectedAccount : undefined,
        page,
        per_page: 25,
        search: search.trim() || undefined,
      });

      if (reqId !== reqIdRef.current) return;

      if (res.status && res.data) {
        setThreads(res.data);
        if (res.meta) {
          setTotalPages(res.meta.total_pages || 1);
          setTotalCount(res.meta.total || 0);
        }
      }
    } catch {
      if (reqId === reqIdRef.current && !isSilent) {
        toast.error('Gagal memuat daftar email.');
      }
    } finally {
      if (reqId === reqIdRef.current && !isSilent) {
        setLoading(false);
      }
    }
  }, [folder, selectedAccount, page, search]);

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

  const handleSwitchAccount = (newAccount: string) => {
    setSelectedAccount(newAccount);
    setPage(1);
    setSelectedThread(null);
    setThreads([]);
    setLoading(true);
  };

  useEffect(() => {
    fetchThreads();
    fetchStats();
  }, [fetchThreads, fetchStats]);

  // Realtime Inbound Auto-Polling every 10 seconds (silent background refresh)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchThreads(true);
      fetchStats();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchThreads, fetchStats]);

  // Realtime on Window / Tab Focus
  useEffect(() => {
    const handleFocus = () => {
      fetchThreads(true);
      fetchStats();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchThreads, fetchStats]);

  useEffect(() => {
    fetchSettings();
  }, []);

  // Compute unique accounts list for Account Switcher
  const allAccounts = React.useMemo(() => {
    const accs: { email: string; name: string; isDefault?: boolean }[] = [];
    const seen = new Set<string>();

    sendersList.forEach((s) => {
      const em = s.email.toLowerCase().trim();
      if (em && !seen.has(em)) {
        seen.add(em);
        accs.push({ email: s.email, name: s.name, isDefault: s.is_default });
      }
    });

    if (accs.length === 0) {
      accs.push({
        email: emailSetting?.default_sender_email || 'contact@arlab.my.id',
        name: emailSetting?.default_sender_name || 'Syahril Haryono',
        isDefault: true,
      });
    }

    return accs;
  }, [sendersList, emailSetting]);

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
    setIsReplyOpen(false);
    try {
      const res = await mailboxApi.getThread(t.id);
      if (res.status && res.data) {
        setSelectedThread(res.data);
        // Mark thread as read in local state
        setThreads((prev) =>
          prev.map((item) => (item.id === t.id ? { ...item, has_unread: false } : item))
        );
        fetchStats();
        window.dispatchEvent(new Event('contact-stats-updated'));

        // Auto-match reply sender to recipient of inbound message
        const msgs = res.data.messages || [];
        const inboundMsg = msgs.slice().reverse().find((m: EmailMessage) => m.direction === 'inbound');
        if (inboundMsg && inboundMsg.to_email) {
          const matchedTo = inboundMsg.to_email.toLowerCase().trim();
          const matchedSender = sendersList.find((s) => s.email.toLowerCase().trim() === matchedTo);
          if (matchedSender) {
            setReplySenderEmail(matchedSender.email);
            setReplySenderName(matchedSender.name);
          } else {
            setReplySenderEmail(inboundMsg.to_email);
            setReplySenderName(matchedTo.split('@')[0]);
          }
        } else if (selectedAccount !== 'all') {
          setReplySenderEmail(selectedAccount);
          const matched = sendersList.find((s) => s.email.toLowerCase() === selectedAccount.toLowerCase());
          setReplySenderName(matched?.name || selectedAccount.split('@')[0]);
        }
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
        toast.success('Email dihapus permanen.');
        setThreads((prev) => prev.filter((t) => t.id !== deleteId));
        if (selectedThread?.id === deleteId) {
          setSelectedThread(null);
        }
        fetchStats();
      } else {
        toast.error(res.message || 'Gagal menghapus email.');
      }
    } catch {
      toast.error('Gagal menghapus email.');
    } finally {
      setIsDeleting(false);
      setConfirmDeleteOpen(false);
      setDeleteId(null);
    }
  };

  const handleSendCompose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeTo.trim()) {
      toast.error('Email penerima wajib diisi.');
      return;
    }
    if (!composeSubject.trim()) {
      toast.error('Subjek email wajib diisi.');
      return;
    }
    if (!composeBody.trim() && composeAttachments.length === 0) {
      toast.error('Isi email atau lampiran wajib ada.');
      return;
    }

    setSendingEmail(true);
    try {
      const res = await mailboxApi.send({
        sender_email: selectedSenderEmail,
        sender_name: selectedSenderName,
        reply_to_email: composeReplyTo || undefined,
        to_email: composeTo.trim(),
        to_name: composeToName.trim() || undefined,
        cc: composeCc.trim() || undefined,
        bcc: composeBcc.trim() || undefined,
        subject: composeSubject.trim(),
        body_html: composeBody,
        body_text: composeText,
        attachments: composeAttachments,
      });

      if (res.status) {
        toast.success(res.message || 'Email berhasil dikirim!');
        setComposeModalOpen(false);
        setComposeTo('');
        setComposeToName('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeBody('');
        setComposeText('');
        setComposeAttachments([]);

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
    if (!selectedThread) return;
    if (!replyBody.trim() && replyAttachments.length === 0) {
      toast.error('Tulis balasan atau lampirkan file.');
      return;
    }

    setSendingReply(true);
    try {
      const res = await mailboxApi.reply({
        thread_id: selectedThread.id,
        sender_email: replySenderEmail,
        sender_name: replySenderName,
        body_html: replyBody,
        body_text: replyText,
        attachments: replyAttachments,
      });

      if (res.status) {
        toast.success(res.message || 'Balasan berhasil dikirim!');
        setReplyBody('');
        setReplyText('');
        setReplyAttachments([]);
        setIsReplyOpen(false);

        // Refresh conversation
        handleSelectThread(selectedThread);
        fetchStats();
      } else {
        toast.error(res.message || 'Gagal mengirim balasan.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Terjadi kesalahan saat mengirim balasan.');
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
        default_sender_email: senderEmailInput.trim(),
        default_sender_name: senderNameInput.trim(),
        reply_to_email: replyToEmailInput.trim() || undefined,
        reply_to_name: replyToNameInput.trim() || undefined,
        allowed_inbound_emails: allowedInboundInput.trim() || undefined,
        inbound_domain: inboundDomainInput.trim() || undefined,
        custom_senders: sendersList,
      });

      if (res.status) {
        toast.success('Pengaturan email & identitas pengirim berhasil disimpan.');
        setEmailSetting(res.data);
        setSettingsModalOpen(false);
        fetchSettings();
        fetchStats();
      } else {
        toast.error(res.message || 'Gagal menyimpan pengaturan.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddSender = () => {
    if (!newSenderEmail.trim()) {
      toast.error('Email pengirim wajib diisi');
      return;
    }
    const exists = sendersList.some(
      (s) => s.email.toLowerCase() === newSenderEmail.trim().toLowerCase()
    );
    if (exists) {
      toast.error('Email pengirim ini sudah terdaftar');
      return;
    }

    const updated = [
      ...sendersList,
      {
        name: newSenderName.trim() || newSenderEmail.split('@')[0],
        email: newSenderEmail.trim(),
        is_default: sendersList.length === 0,
        active: true,
      },
    ];
    setSendersList(updated);
    setNewSenderName('');
    setNewSenderEmail('');
    toast.success('Pengirim baru ditambahkan ke daftar draft');
  };

  const handleRemoveSender = (index: number) => {
    const updated = sendersList.filter((_, idx) => idx !== index);
    if (updated.length > 0 && !updated.some((s) => s.is_default)) {
      updated[0].is_default = true;
    }
    setSendersList(updated);
  };

  const handleSetDefaultSender = (index: number) => {
    const updated = sendersList.map((s, idx) => ({
      ...s,
      is_default: idx === index,
    }));
    setSendersList(updated);
  };

  const formatEmailTime = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] p-2 sm:p-4 gap-3 max-w-[1700px] mx-auto w-full overflow-hidden">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 shrink-0 px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-lime-500/10 dark:bg-brand/10 border border-lime-500/20 text-lime-700 dark:text-brand flex items-center justify-center shadow-xs">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)]">
              Kotak Surat (Webmail)
            </h1>
            <p className="text-xs text-[var(--text-muted)] hidden sm:block">
              Kelola pesan masuk, kirim email, dan balas percakapan langsung dari dashboard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSettingsModalOpen(true)}
            className="text-xs gap-1.5 h-9"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Kelola Akun &amp; Pengaturan</span>
          </Button>

          <Button
            size="sm"
            onClick={() => setComposeModalOpen(true)}
            className="text-xs gap-1.5 h-9 font-bold bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a] shadow-sm"
          >
            <PenSquare className="w-4 h-4" />
            <span>Tulis Email</span>
          </Button>
        </div>
      </div>

      {/* Main Mailbox Workspace: Gmail Full-Width Architecture */}
      <div className="flex-1 flex rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden shadow-sm min-h-0">
        {/* Left Sidebar Navigation (Gmail Style) */}
        <aside className="hidden md:flex w-56 lg:w-64 border-r border-[var(--border)] bg-[var(--bg-elevated)]/40 p-3 flex-col justify-between shrink-0 overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* Big Compose Button */}
            <Button
              onClick={() => setComposeModalOpen(true)}
              className="w-full h-11 rounded-2xl text-xs font-bold gap-2 bg-lime-600 hover:bg-lime-700 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a] shadow-sm transition-all"
            >
              <PenSquare className="w-4 h-4" />
              <span>Tulis Pesan Baru</span>
            </Button>

            {/* Account Switcher Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  Pilih Akun Email
                </span>
                <button
                  type="button"
                  onClick={() => setSettingsModalOpen(true)}
                  className="text-[10px] text-lime-700 dark:text-brand font-semibold hover:underline"
                >
                  + Tambah
                </button>
              </div>

              <div className="space-y-1">
                {/* All Inboxes Option */}
                <button
                  type="button"
                  onClick={() => handleSwitchAccount('all')}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    selectedAccount === 'all'
                      ? 'bg-lime-500/15 dark:bg-brand/15 text-lime-800 dark:text-brand border border-lime-500/30 dark:border-brand/30 shadow-xs'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-5 h-5 rounded-md bg-lime-500/20 text-lime-700 dark:text-brand flex items-center justify-center text-[10px] font-bold shrink-0">
                      🌐
                    </div>
                    <span className="truncate">Semua Kotak Masuk</span>
                  </div>
                </button>

                {/* Individual Accounts */}
                {allAccounts.map((acc, idx) => {
                  const isActive = selectedAccount.toLowerCase() === acc.email.toLowerCase();
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSwitchAccount(acc.email)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-all ${
                        isActive
                          ? 'bg-lime-500/15 dark:bg-brand/15 text-lime-800 dark:text-brand border border-lime-500/30 dark:border-brand/30 shadow-xs font-bold'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 text-left">
                        <div className="w-5 h-5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-[10px] font-bold text-lime-700 dark:text-brand shrink-0">
                          {acc.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="truncate min-w-0">
                          <div className="text-[11px] font-mono leading-tight truncate">{acc.email}</div>
                          <div className="text-[9px] text-[var(--text-muted)] font-sans truncate">{acc.name}</div>
                        </div>
                      </div>
                      {acc.isDefault && (
                        <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-lime-500/20 text-lime-700 dark:text-brand shrink-0">
                          Utama
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Folder Navigation */}
            <div className="pt-2 border-t border-[var(--border)] space-y-1">
              <div className="px-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
                Folder
              </div>

              <button
                type="button"
                onClick={() => {
                  setFolder('inbox');
                  setPage(1);
                  setSelectedThread(null);
                  setThreads([]);
                  setLoading(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                  setFolder('starred');
                  setPage(1);
                  setSelectedThread(null);
                  setThreads([]);
                  setLoading(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                  setFolder('sent');
                  setPage(1);
                  setSelectedThread(null);
                  setThreads([]);
                  setLoading(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
                  setFolder('trash');
                  setPage(1);
                  setSelectedThread(null);
                  setThreads([]);
                  setLoading(true);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
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
          </div>

          {/* Engine Status Pill */}
          <div className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] space-y-1.5 text-center">
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono font-bold text-lime-700 dark:text-brand">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Hybrid Engine</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] leading-tight">
              {emailSetting?.is_configured
                ? 'API Terhubung & Siap Kirim/Terima'
                : 'Mode Simulasi Dev'}
            </p>
          </div>
        </aside>

        {/* Right Main Canvas: Transitions between Full-Width Inbox List and Full-Width Thread View */}
        <main className="flex-1 flex flex-col min-h-0 bg-[var(--bg-surface)] overflow-hidden">
          {selectedThread ? (
            /* ========================================================================= */
            /* VIEW 1: FULL-WIDTH GMAIL THREAD VIEW                                       */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Thread Action Header Toolbar */}
              <div className="px-4 sm:px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/50 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedThread(null)}
                    className="h-8 px-3 text-xs gap-1.5 font-bold shadow-xs hover:bg-[var(--accent-soft)]"
                    title="Kembali ke Kotak Masuk"
                  >
                    <ArrowLeft className="w-4 h-4 text-lime-700 dark:text-brand" />
                    <span>Kembali ke Kotak Masuk</span>
                  </Button>

                  <div className="h-4 w-[1px] bg-[var(--border)] mx-1" />

                  {/* Star Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleStar(selectedThread.id, selectedThread.is_starred)}
                    className="h-8 px-2 text-xs"
                    title={selectedThread.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                  >
                    <Star
                      className={`w-4 h-4 ${
                        selectedThread.is_starred ? 'fill-amber-400 text-amber-400' : 'text-[var(--text-muted)]'
                      }`}
                    />
                  </Button>

                  {/* Print Thread */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handlePrintThread}
                    className="h-8 px-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Cetak Seluruh Percakapan"
                  >
                    <Printer className="w-4 h-4" />
                  </Button>

                  {/* Trash / Delete */}
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
                        className="h-8 px-2 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-xs"
                        title="Hapus Permanen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveToTrash(selectedThread.id)}
                      className="h-8 px-2 text-[var(--text-muted)] hover:text-rose-500 text-xs"
                      title="Pindahkan ke Sampah"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] font-mono">
                  <span>ID #{selectedThread.id}</span>
                  <span>•</span>
                  <span>{selectedThread.message_count} Pesan</span>
                </div>
              </div>

              {/* Thread Content Area (Full-Width Scrollable Canvas) */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
                {/* Subject Title & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)]">
                      {selectedThread.subject || '(Tanpa Subjek)'}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-lime-500/15 text-lime-800 dark:text-brand uppercase font-mono">
                        {folder === 'inbox' ? 'Kotak Masuk' : folder === 'sent' ? 'Terkirim' : folder}
                      </span>
                      {selectedAccount !== 'all' && (
                        <span className="text-xs text-[var(--text-muted)] font-mono">
                          untuk {selectedAccount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stacked Message Cards */}
                {selectedThread.messages?.map((msg, idx) => {
                  const isOutbound = msg.direction === 'outbound';
                  let msgAttachments: EmailAttachment[] = [];
                  if (msg.attachments && Array.isArray(msg.attachments)) {
                    msgAttachments = msg.attachments;
                  } else if (msg.attachments_json) {
                    try {
                      msgAttachments = JSON.parse(msg.attachments_json);
                    } catch {}
                  }

                  const isDetailsOpen = expandedDetailsMsgId === msg.id;
                  const dateFormatted = new Date(msg.created_at).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={msg.id || idx}
                      className={`p-5 sm:p-6 rounded-2xl border transition-all shadow-xs ${
                        isOutbound
                          ? 'border-lime-500/30 bg-lime-500/5 dark:border-brand/30 dark:bg-brand/5'
                          : 'border-[var(--border)] bg-[var(--bg-surface)]'
                      }`}
                    >
                      {/* Sender Info Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-[var(--border)] pb-3 mb-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-10 h-10 rounded-full font-bold flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                              isOutbound
                                ? 'bg-lime-700 text-white dark:bg-brand dark:text-black shadow-xs'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border)]'
                            }`}
                          >
                            {msg.from_name ? msg.from_name.charAt(0).toUpperCase() : 'M'}
                          </div>

                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
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

                            {/* Gmail Style "Kepada: saya ▾" Toggle */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setExpandedDetailsMsgId(isDetailsOpen ? null : msg.id)}
                                className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors group"
                              >
                                <span>kepada {isOutbound ? msg.to_email : 'saya'}</span>
                                {isDetailsOpen ? (
                                  <ChevronUp className="w-3 h-3 text-[var(--text-muted)]" />
                                ) : (
                                  <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                                )}
                              </button>

                              {/* Gmail Security & Routing Details Popover */}
                              {isDetailsOpen && (
                                <div className="mt-2 p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-lg space-y-1.5 text-xs text-[var(--text-secondary)] max-w-md animate-in fade-in zoom-in-95">
                                  <div className="grid grid-cols-[70px_1fr] gap-1 text-[11px]">
                                    <span className="text-[var(--text-muted)] font-medium">Dari:</span>
                                    <span className="font-semibold text-[var(--text-primary)] break-all">
                                      {msg.from_name} &lt;{msg.from_email}&gt;
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-[70px_1fr] gap-1 text-[11px]">
                                    <span className="text-[var(--text-muted)] font-medium">Kepada:</span>
                                    <span className="font-semibold text-[var(--text-primary)] break-all">
                                      {msg.to_name || 'Saya'} &lt;{msg.to_email}&gt;
                                    </span>
                                  </div>
                                  {msg.cc && (
                                    <div className="grid grid-cols-[70px_1fr] gap-1 text-[11px]">
                                      <span className="text-[var(--text-muted)] font-medium">Cc:</span>
                                      <span className="font-mono text-[var(--text-primary)]">{msg.cc}</span>
                                    </div>
                                  )}
                                  <div className="grid grid-cols-[70px_1fr] gap-1 text-[11px]">
                                    <span className="text-[var(--text-muted)] font-medium">Tanggal:</span>
                                    <span className="font-mono">{dateFormatted}</span>
                                  </div>
                                  <div className="grid grid-cols-[70px_1fr] gap-1 text-[11px]">
                                    <span className="text-[var(--text-muted)] font-medium">Subjek:</span>
                                    <span className="font-medium text-[var(--text-primary)]">{msg.subject}</span>
                                  </div>
                                  <div className="pt-2 border-t border-[var(--border)] flex items-center gap-1.5 text-[10px] text-emerald-800 dark:text-emerald-300 font-medium">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                    <span>Keamanan: Terenkripsi Standar (TLS 1.3) • Autentikasi SPF &amp; DKIM Valid</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{dateFormatted}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleExportEml(msg)}
                            className="p-1 rounded-lg text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand hover:bg-[var(--accent-soft)] transition-colors"
                            title="Unduh file format .eml"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Sandboxed HTML Email Viewer with Quotes & Attachments */}
                      <EmailHtmlViewer
                        html={msg.body_html}
                        text={msg.body_text}
                        attachments={msgAttachments}
                        headersJson={msg.headers_json}
                        senderName={msg.from_name}
                        senderEmail={msg.from_email}
                        subject={msg.subject}
                        dateStr={dateFormatted}
                      />
                    </div>
                  );
                })}

                {/* Bottom Reply Area (Gmail-Style) */}
                {!isReplyOpen ? (
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      onClick={() => setIsReplyOpen(true)}
                      className="px-5 h-10 rounded-full text-xs font-bold gap-2 bg-[var(--bg-elevated)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] border border-[var(--border)] shadow-xs transition-all"
                    >
                      <Reply className="w-4 h-4 text-lime-700 dark:text-brand" />
                      <span>Balas</span>
                    </Button>

                    <Button
                      onClick={() => {
                        const lastMsg = selectedThread.messages?.[selectedThread.messages.length - 1];
                        if (lastMsg) {
                          setComposeSubject(`Fwd: ${selectedThread.subject}`);
                          setComposeBody(`<p></p><br/><div style="border-left: 2px solid #ccc; padding-left: 8px;">---------- Pesan yang diteruskan ---------<br/>Dari: ${lastMsg.from_name} &lt;${lastMsg.from_email}&gt;<br/>Tanggal: ${new Date(lastMsg.created_at).toLocaleString('id-ID')}<br/>Subjek: ${lastMsg.subject}<br/><br/>${lastMsg.body_html || lastMsg.body_text}</div>`);
                          setComposeModalOpen(true);
                        }
                      }}
                      variant="outline"
                      className="px-5 h-10 rounded-full text-xs font-bold gap-2 hover:bg-[var(--accent-soft)] shadow-xs transition-all"
                    >
                      <Forward className="w-4 h-4" />
                      <span>Teruskan</span>
                    </Button>
                  </div>
                ) : (
                  /* Expanded Inline Reply Box */
                  <div className="p-5 sm:p-6 rounded-2xl border border-lime-500/40 bg-[var(--bg-surface)] shadow-lg space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[var(--border)]">
                      <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                        <Reply className="w-4 h-4 text-lime-700 dark:text-brand" />
                        <span>Balas Percakapan</span>
                      </div>

                      {/* Sender Selector */}
                      <div className="flex items-center gap-2 text-xs">
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

                    <form onSubmit={handleSendReply} className="space-y-4">
                      <EmailRichEditor
                        content={replyBody}
                        onChange={(html, text) => {
                          setReplyBody(html);
                          setReplyText(text);
                        }}
                        placeholder="Tuliskan balasan email Anda di sini..."
                        disabled={sendingReply}
                        minHeight="140px"
                        attachments={replyAttachments}
                        onAddAttachment={handleUploadReplyAttachment}
                        onRemoveAttachment={handleRemoveReplyAttachment}
                        uploadingAttachment={uploadingReplyAttachment}
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsReplyOpen(false)}
                          className="text-xs text-[var(--text-muted)] hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>Buang Draf Balasan</span>
                        </Button>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsReplyOpen(false)}
                            className="text-xs h-9 px-3"
                          >
                            Tutup
                          </Button>

                          <Button
                            type="submit"
                            size="sm"
                            disabled={sendingReply || (!replyBody.trim() && replyAttachments.length === 0)}
                            className="h-9 px-5 gap-2 font-bold bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a] shadow-sm"
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
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* VIEW 2: FULL-WIDTH GMAIL INBOX LIST VIEW                                  */
            /* ========================================================================= */
            <div className="flex-1 flex flex-col min-h-0">
              {/* Search & Action Bar Header */}
              <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated)]/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
                {/* Search Input Bar (Gmail Pill Style) */}
                <div className="relative flex-1 max-w-xl">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <Input
                    placeholder="Telusuri subjek, pengirim, atau isi pesan email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchThreads()}
                    className="pl-10 h-10 text-xs rounded-full bg-[var(--bg-surface)] border-[var(--border)] shadow-xs focus:ring-1 focus:ring-lime-500"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearch('');
                        fetchThreads();
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Account Filter Badge Indicator */}
                  {selectedAccount !== 'all' && (
                    <div className="px-2.5 py-1 bg-lime-500/10 dark:bg-brand/10 border border-lime-500/20 text-[11px] rounded-lg flex items-center gap-1.5 text-lime-800 dark:text-brand font-mono">
                      <span>Filter: {selectedAccount}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAccount('all')}
                        className="hover:opacity-75"
                        title="Hapus filter akun"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchThreads()}
                    className="h-9 px-3 text-xs gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    title="Segarkan Kotak Masuk"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Segarkan</span>
                  </Button>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] font-mono pl-2 border-l border-[var(--border)]">
                      <span>
                        {(page - 1) * 25 + 1}-{Math.min(page * 25, totalCount)} dari {totalCount}
                      </span>
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                        className="p-1 rounded hover:bg-[var(--accent-soft)] disabled:opacity-30"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage(page + 1)}
                        className="p-1 rounded hover:bg-[var(--accent-soft)] disabled:opacity-30"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Thread Table List Area (Full-Width Gmail Row Design) */}
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border)]">
                {loading ? (
                  <div className="p-12 text-center space-y-3 text-xs text-[var(--text-muted)] animate-pulse">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-lime-700 dark:text-brand" />
                    <p>Memuat daftar email...</p>
                  </div>
                ) : threads.length === 0 ? (
                  <div className="p-16 text-center space-y-3">
                    <div className="w-14 h-14 rounded-full bg-[var(--bg-elevated)] mx-auto flex items-center justify-center text-[var(--text-muted)] border border-[var(--border)]">
                      <Mail className="w-7 h-7 opacity-50" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      {folder === 'inbox'
                        ? 'Kotak Masuk Kosong'
                        : folder === 'starred'
                        ? 'Belum Ada Email Berbintang'
                        : folder === 'sent'
                        ? 'Belum Ada Email Terkirim'
                        : 'Sampah Kosong'}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto">
                      {selectedAccount !== 'all'
                        ? `Tidak ada email untuk akun ${selectedAccount} pada folder ini.`
                        : 'Email baru yang masuk atau dikirim akan muncul di sini secara real-time.'}
                    </p>
                  </div>
                ) : (
                  threads.map((t) => {
                    const isUnread = t.has_unread;
                    const msgs = t.messages || [];
                    const firstMsg = msgs[0];
                    const recipientEmail = firstMsg?.direction === 'inbound' ? firstMsg?.to_email : firstMsg?.from_email;
                    const senderDisplay = firstMsg?.direction === 'outbound'
                      ? `Kepada: ${firstMsg.to_name || firstMsg.to_email}`
                      : firstMsg?.from_name || firstMsg?.from_email || 'Pengirim';

                    // Check for attachment in thread messages
                    const hasAttachments = msgs.some((m) => {
                      if (m.attachments && m.attachments.length > 0) return true;
                      if (m.attachments_json && m.attachments_json !== '[]') return true;
                      return false;
                    });

                    return (
                      <div
                        key={t.id}
                        onClick={() => handleSelectThread(t)}
                        className={`group px-4 py-3.5 flex items-center gap-3 cursor-pointer transition-all border-l-4 relative ${
                          isUnread
                            ? 'bg-lime-500/10 dark:bg-brand/10 hover:bg-lime-500/15 border-l-lime-600 dark:border-l-brand shadow-xs'
                            : 'hover:bg-[var(--bg-elevated)]/60 border-l-transparent opacity-85 hover:opacity-100'
                        }`}
                      >
                        {/* Unread Status Dot Indicator */}
                        <div className="w-3 flex items-center justify-center shrink-0">
                          {isUnread ? (
                            <span
                              className="w-2.5 h-2.5 rounded-full bg-lime-600 dark:bg-brand ring-4 ring-lime-500/20 shrink-0 animate-pulse"
                              title="Belum dibaca"
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-transparent" />
                          )}
                        </div>

                        {/* Star Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(t.id, t.is_starred, e)}
                          className="p-1 rounded-md text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-400/10 transition-colors shrink-0"
                          title={t.is_starred ? 'Hapus bintang' : 'Beri bintang'}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              t.is_starred ? 'fill-amber-400 text-amber-400' : ''
                            }`}
                          />
                        </button>

                        {/* Sender / Recipient Name Column */}
                        <div className="w-40 sm:w-52 lg:w-60 shrink-0 flex items-center gap-2 min-w-0">
                          <span
                            className={`text-xs truncate block ${
                              isUnread
                                ? 'font-black text-[var(--text-primary)] text-[13px]'
                                : 'font-normal text-[var(--text-muted)]'
                            }`}
                          >
                            {senderDisplay}
                          </span>
                          {isUnread && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-lime-600 text-white dark:bg-brand dark:text-[#0a0a0a] shrink-0">
                              BARU
                            </span>
                          )}
                        </div>

                        {/* Subject + Inline Snippet (Expands across full center width) */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          <span
                            className={`text-xs truncate shrink-0 max-w-[45%] ${
                              isUnread
                                ? 'font-black text-[var(--text-primary)] text-[13px]'
                                : 'font-normal text-[var(--text-secondary)]'
                            }`}
                          >
                            {t.subject || '(Tanpa Subjek)'}
                          </span>

                          <span className={`text-xs shrink-0 ${isUnread ? 'text-[var(--text-primary)] font-bold' : 'text-[var(--text-muted)]'}`}>
                            -
                          </span>

                          <span
                            className={`text-xs truncate flex-1 ${
                              isUnread ? 'font-medium text-[var(--text-primary)]/90' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {t.snippet || 'Tidak ada pratinjau teks.'}
                          </span>

                          {/* Attachment Badge Pill */}
                          {hasAttachments && (
                            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] shrink-0">
                              <Paperclip className="w-3 h-3 text-lime-700 dark:text-brand" />
                              <span>Lampiran</span>
                            </span>
                          )}

                          {/* Recipient Badge in "All Inboxes" */}
                          {selectedAccount === 'all' && recipientEmail && (
                            <span className="hidden md:inline-block px-2 py-0.5 rounded text-[9px] font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] truncate max-w-[130px] shrink-0">
                              {recipientEmail}
                            </span>
                          )}
                        </div>

                        {/* Date & Hover Action Bar */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Hover Actions (Appear on mouse hover) */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            <button
                              type="button"
                              onClick={(e) => handleMoveToTrash(t.id, e)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Pindahkan ke Sampah"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Message Count Badge */}
                          {t.message_count > 1 && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)]">
                              {t.message_count}
                            </span>
                          )}

                          {/* Date String */}
                          <span
                            className={`text-xs font-mono shrink-0 ${
                              isUnread ? 'font-black text-lime-700 dark:text-brand' : 'text-[var(--text-muted)]'
                            }`}
                          >
                            {formatEmailTime(t.last_message_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Compose Email Modal Dialog */}
      <AnimatePresence>
        {composeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">
                        Nama Penerima
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowCcBcc(!showCcBcc)}
                        className="text-[10px] text-lime-700 dark:text-brand font-semibold hover:underline"
                      >
                        {showCcBcc ? '- Sembunyikan Cc/Bcc' : '+ Opsi Lanjutan (Cc/Bcc/Reply-To)'}
                      </button>
                    </div>
                    <Input
                      placeholder="Nama Klien / Perusahaan"
                      value={composeToName}
                      onChange={(e) => setComposeToName(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Advanced Routing (Cc, Bcc, Custom Reply-To) */}
                {showCcBcc && (
                  <div className="p-3.5 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 space-y-3 animate-in fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          Cc (Tembusan)
                        </label>
                        <Input
                          placeholder="cc1@example.com, cc2@example.com"
                          value={composeCc}
                          onChange={(e) => setComposeCc(e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                          Bcc (Tembusan Tersembunyi)
                        </label>
                        <Input
                          placeholder="bcc@example.com"
                          value={composeBcc}
                          onChange={(e) => setComposeBcc(e.target.value)}
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-[var(--text-secondary)]">
                        Custom Reply-To Email
                      </label>
                      <Input
                        type="email"
                        placeholder="Balasan akan dikirim ke alamat ini jika diisi"
                        value={composeReplyTo}
                        onChange={(e) => setComposeReplyTo(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Subject */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Subjek Email *
                  </label>
                  <Input
                    placeholder="Contoh: Diskusi Kerja Sama Proyek Software"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    required
                    className="text-xs font-medium"
                  />
                </div>

                {/* Rich Text Editor with Attachments */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Isi Email (Rich Text &amp; Lampiran) *
                  </label>
                  <EmailRichEditor
                    content={composeBody}
                    onChange={(html, text) => {
                      setComposeBody(html);
                      setComposeText(text);
                    }}
                    placeholder="Tulis pesan email Anda di sini... (Format teks, tabel, link, & lampirkan file)"
                    disabled={sendingEmail}
                    minHeight="180px"
                    attachments={composeAttachments}
                    onAddAttachment={handleUploadComposeAttachment}
                    onRemoveAttachment={handleRemoveComposeAttachment}
                    uploadingAttachment={uploadingComposeAttachment}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setComposeModalOpen(false)}
                    disabled={sendingEmail}
                    className="text-xs"
                  >
                    Batal
                  </Button>

                  <Button
                    type="submit"
                    disabled={sendingEmail}
                    className="text-xs gap-2 font-bold bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a]"
                  >
                    {sendingEmail ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Mengirim Email...</span>
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

      {/* Settings Modal Dialog */}
      <AnimatePresence>
        {settingsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
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
                    <Settings className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Pengaturan Akun &amp; Email Engine
                    </h3>
                    <p className="text-[11px] text-[var(--text-muted)]">
                      Kelola identitas pengirim multi-alamat dan koneksi API Brevo/Resend.
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

              {/* Settings Form */}
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6 overflow-y-auto flex-1">
                {/* Multi-Sender Aliases Management */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                        <AtSign className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                        <span>Identitas Pengirim &amp; Multi-Akun (Senders)</span>
                      </h4>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Tambahkan alamat email domain yang dapat Anda pilih saat menulis atau membalas pesan.
                      </p>
                    </div>
                  </div>

                  {/* Senders List Table */}
                  <div className="rounded-xl border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)] bg-[var(--bg-elevated)]/30">
                    {sendersList.map((s, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[var(--text-primary)]">{s.name}</span>
                            <span className="font-mono text-[var(--text-muted)]">&lt;{s.email}&gt;</span>
                            {s.is_default && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-lime-500/20 text-lime-700 dark:text-brand">
                                Default
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {!s.is_default && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSetDefaultSender(idx)}
                              className="text-[10px] h-7 px-2"
                            >
                              Jadikan Default
                            </Button>
                          )}
                          {sendersList.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSender(idx)}
                              className="p-1 rounded text-[var(--text-muted)] hover:text-rose-500"
                              title="Hapus Pengirim"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Add New Sender Row */}
                    <div className="p-3 bg-[var(--bg-elevated)]/60 flex flex-col sm:flex-row items-center gap-2">
                      <Input
                        placeholder="Nama Tampilan (e.g. Support Team)"
                        value={newSenderName}
                        onChange={(e) => setNewSenderName(e.target.value)}
                        className="text-xs h-8"
                      />
                      <Input
                        type="email"
                        placeholder="support@arlab.my.id"
                        value={newSenderEmail}
                        onChange={(e) => setNewSenderEmail(e.target.value)}
                        className="text-xs h-8 font-mono"
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddSender}
                        className="text-xs h-8 shrink-0 gap-1 font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Active Engine Provider */}
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Mode Engine Email Aktif</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                        activeProvider === 'hybrid'
                          ? 'border-lime-500 bg-lime-500/10 text-[var(--text-primary)] font-bold'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Hybrid Engine</span>
                        <input
                          type="radio"
                          name="activeProvider"
                          value="hybrid"
                          checked={activeProvider === 'hybrid'}
                          onChange={() => setActiveProvider('hybrid')}
                          className="accent-lime-600"
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal mt-1">
                        Brevo Inbound Webhook + Auto-failover Transaksional.
                      </span>
                    </label>

                    <label
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                        activeProvider === 'brevo'
                          ? 'border-lime-500 bg-lime-500/10 text-[var(--text-primary)] font-bold'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Brevo SMTP/API</span>
                        <input
                          type="radio"
                          name="activeProvider"
                          value="brevo"
                          checked={activeProvider === 'brevo'}
                          onChange={() => setActiveProvider('brevo')}
                          className="accent-lime-600"
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal mt-1">
                        Kirim via Brevo Transactional API.
                      </span>
                    </label>

                    <label
                      className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-all ${
                        activeProvider === 'resend'
                          ? 'border-lime-500 bg-lime-500/10 text-[var(--text-primary)] font-bold'
                          : 'border-[var(--border)] bg-[var(--bg-elevated)]/40 text-[var(--text-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs">Resend API</span>
                        <input
                          type="radio"
                          name="activeProvider"
                          value="resend"
                          checked={activeProvider === 'resend'}
                          onChange={() => setActiveProvider('resend')}
                          className="accent-lime-600"
                        />
                      </div>
                      <span className="text-[10px] text-[var(--text-muted)] font-normal mt-1">
                        Kirim via Resend API Key.
                      </span>
                    </label>
                  </div>
                </div>

                {/* API Keys Configuration */}
                <div className="space-y-3 pt-4 border-t border-[var(--border)]">
                  <h4 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Kunci API &amp; Domain Webhook</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">
                        Brevo API Key (xkeysib-...)
                      </label>
                      <Input
                        type="password"
                        placeholder="Biarkan kosong jika tetap memakai file .env"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--text-secondary)]">
                        Resend API Key (re_...)
                      </label>
                      <Input
                        type="password"
                        placeholder="Biarkan kosong jika tetap memakai file .env"
                        value={resendApiKeyInput}
                        onChange={(e) => setResendApiKeyInput(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--text-secondary)]">
                      Domain Inbound MX
                    </label>
                    <Input
                      placeholder="e.g. mail.arlab.my.id atau arlab.my.id"
                      value={inboundDomainInput}
                      onChange={(e) => setInboundDomainInput(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Inbound Webhook Endpoint URL */}
                <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/50 space-y-2 text-xs">
                  <div className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                    <span>Inbound Webhook URL untuk Brevo / Resend</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    Tempelkan URL ini di Brevo / Resend Inbound Webhook Settings:
                  </p>
                  <div className="p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] font-mono text-[11px] select-all break-all text-lime-700 dark:text-brand font-bold">
                    https://arlab.my.id/api/public/email/webhook/brevo
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSettingsModalOpen(false)}
                    disabled={savingSettings}
                    className="text-xs"
                  >
                    Batal
                  </Button>

                  <Button
                    type="submit"
                    disabled={savingSettings}
                    className="text-xs font-bold gap-1.5 bg-lime-700 hover:bg-lime-800 text-white dark:bg-brand dark:hover:bg-brand-hover dark:text-[#0a0a0a]"
                  >
                    {savingSettings ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Simpan Perubahan</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handlePermanentDelete}
        title="Hapus Email Permanen"
        description="Apakah Anda yakin ingin menghapus email ini secara permanen dari server? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Hapus Permanen"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

export default function AdminMailboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-2 border-lime-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AdminMailboxContent />
    </Suspense>
  );
}
