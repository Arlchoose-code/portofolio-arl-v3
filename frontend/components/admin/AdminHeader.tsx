'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { LogOut, User as UserIcon, Menu } from 'lucide-react';
import { toast } from 'sonner';

interface AdminHeaderProps {
  onToggleMobile?: () => void;
  onToggleCollapse?: () => void;
  isCollapsed?: boolean;
}

export function AdminHeader({
  onToggleMobile,
}: AdminHeaderProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await authApi.logout();
      toast.success('Berhasil logout');
    } catch {
      toast.error('Gagal logout di server, membersihkan sesi lokal...');
    } finally {
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/admin/login';
    }
  };

  const pageName = pathname.split('/').pop() || 'Dashboard';
  const formattedTitle = pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ');

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--bg-surface)] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Drawer Trigger (Only visible on mobile) */}
        {onToggleMobile && (
          <button
            type="button"
            onClick={onToggleMobile}
            className="md:hidden p-2 rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border)] transition-colors shrink-0"
            title="Buka Menu Navigasi"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}

        <h1 className="text-sm sm:text-base font-bold text-[var(--text-primary)] truncate">
          {formattedTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <ThemeToggle />

        {/* User Identity */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] text-xs text-[var(--text-secondary)]">
          <UserIcon className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
          <span className="font-semibold text-[var(--text-primary)]">Admin</span>
        </div>

        {/* Logout Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="gap-1.5 text-xs text-red-500 hover:text-red-400 hover:bg-red-500/10 font-semibold px-2.5 sm:px-3 h-8"
          title="Keluar dari Admin"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Keluar</span>
        </Button>
      </div>
    </header>
  );
}
