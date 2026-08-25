'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderGit2,
  Award,
  Briefcase,
  GraduationCap,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Bot,
  MessageSquare,
  Settings,
  Mail,
  Inbox,
  Users,
  ArrowUpRight,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  Gamepad2,
} from 'lucide-react';
import { contactsApi, mailboxApi } from '@/lib/api';

const menuItems = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Pesan Masuk', href: '/admin/contacts', icon: Mail, hasContactBadge: true },
  { name: 'Kotak Surat', href: '/admin/mailbox', icon: Inbox, hasMailboxBadge: true },
  { name: 'Kelola User', href: '/admin/users', icon: Users },
  { name: 'Projects', href: '/admin/projects', icon: FolderGit2 },
  { name: 'Certificates', href: '/admin/certificates', icon: Award },
  { name: 'Experiences', href: '/admin/experiences', icon: Briefcase },
  { name: 'Educations', href: '/admin/educations', icon: GraduationCap },
  { name: 'Skills', href: '/admin/skills', icon: Sparkles },
  { name: 'Pages', href: '/admin/pages', icon: FileText },
  { name: 'Media Library', href: '/admin/media', icon: ImageIcon },
  { name: 'Game Tools', href: '/admin/game-tools', icon: Gamepad2 },
  { name: 'AI Settings', href: '/admin/ai-settings', icon: Bot },
  { name: 'Chat Sessions', href: '/admin/chat-sessions', icon: MessageSquare },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export function Sidebar({
  mobileOpen = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [emailUnreadCount, setEmailUnreadCount] = useState<number>(0);

  const fetchStats = useCallback(() => {
    contactsApi
      .getStats()
      .then((res) => {
        if (res.status && res.data) {
          setUnreadCount(res.data.unread_count || 0);
        }
      })
      .catch(() => {});

    mailboxApi
      .getStats()
      .then((res) => {
        if (res.status && res.data) {
          setEmailUnreadCount(res.data.unread_count || 0);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchStats();

    const handleStatsUpdated = () => fetchStats();
    window.addEventListener('contact-stats-updated', handleStatsUpdated);
    window.addEventListener('focus', handleStatsUpdated);

    const timer = setInterval(fetchStats, 15000);

    return () => {
      window.removeEventListener('contact-stats-updated', handleStatsUpdated);
      window.removeEventListener('focus', handleStatsUpdated);
      clearInterval(timer);
    };
  }, [pathname, fetchStats]);

  // Close mobile drawer on route change
  useEffect(() => {
    if (mobileOpen && onCloseMobile) {
      onCloseMobile();
    }
  }, [pathname]);

  const renderNavContent = (collapsed: boolean) => (
    <>
      {/* Brand Header */}
      <div className={`p-4 border-b border-[var(--border)] flex items-center shrink-0 ${
        collapsed ? 'justify-center' : 'justify-between'
      }`}>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-9 h-9 rounded-xl bg-lime-500/10 dark:bg-brand/10 border border-lime-600/30 dark:border-brand/30 flex items-center justify-center text-lime-700 dark:text-brand hover:bg-lime-500/20 hover:scale-105 transition-all shadow-xs"
            title="Buka Sidebar Penuh"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2"
            title="Admin Panel"
          >
            <span className="text-base font-bold tracking-tight text-[var(--text-primary)] truncate">
              Admin Panel
            </span>
            <span className="w-2 h-2 rounded-full bg-lime-600 dark:bg-brand animate-pulse" />
          </Link>
        )}

        {/* Desktop Collapse Toggle Button in Header */}
        {!collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden md:flex p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Kecilkan Sidebar (Desktop)"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}

        {/* Mobile close button */}
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            title="Tutup Menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin/dashboard' && pathname.startsWith(item.href));

          const unreadNum = item.hasContactBadge
            ? unreadCount
            : item.hasMailboxBadge
            ? emailUnreadCount
            : 0;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (onCloseMobile) onCloseMobile();
              }}
              title={collapsed ? item.name : undefined}
              className={`group relative flex items-center ${
                collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2.5'
              } rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] font-semibold shadow-xs'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 min-w-0'}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="truncate">{item.name}</span>}
              </div>

              {/* Unread Counter Badge */}
              {unreadNum > 0 && (
                collapsed ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                ) : (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                      isActive
                        ? 'bg-white/20 text-white dark:bg-black/20 dark:text-black'
                        : 'bg-lime-500/20 text-lime-700 dark:bg-brand/20 dark:text-brand'
                    }`}
                  >
                    {unreadNum}
                  </span>
                )
              )}

              {/* Collapsed Hover Tooltip */}
              {collapsed && (
                <div className="hidden md:group-hover:flex absolute left-full ml-3 px-3 py-1.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl text-xs font-semibold text-[var(--text-primary)] shadow-xl z-50 whitespace-nowrap items-center gap-2 pointer-events-none">
                  <span>{item.name}</span>
                  {unreadNum > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-lime-500/20 text-lime-700 dark:bg-brand/20 dark:text-brand font-bold">
                      {unreadNum}
                    </span>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className={`p-2.5 border-t border-[var(--border)] shrink-0 space-y-1 ${
        collapsed ? 'flex flex-col items-center' : ''
      }`}>
        {/* Toggle Expand in Collapsed Mode */}
        {collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="w-full p-2.5 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors flex items-center justify-center"
            title="Buka Sidebar Penuh (Desktop)"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        <Link
          href="/"
          target="_blank"
          title="Buka Website Publik"
          className={`flex items-center ${
            collapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'
          } rounded-xl text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors font-medium`}
        >
          {!collapsed && <span>Buka Website Publik</span>}
          <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* 1. Desktop Persistent Collapsible Sidebar */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        } border-r border-[var(--border)] bg-[var(--bg-surface)] flex-col justify-between shrink-0 h-screen sticky top-0 z-30 transition-all duration-300 ease-in-out`}
      >
        {renderNavContent(isCollapsed)}
      </aside>

      {/* 2. Mobile Drawer Overlay & Slide-over Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onCloseMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />

            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-[var(--bg-surface)] border-r border-[var(--border)] z-50 flex flex-col justify-between md:hidden shadow-2xl"
            >
              {renderNavContent(false)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
