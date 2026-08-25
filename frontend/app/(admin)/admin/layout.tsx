'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/admin/Sidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('admin_sidebar_collapsed');
    if (saved !== null) {
      setDesktopCollapsed(saved === 'true');
    }

    const handleFocus = () => {
      router.refresh();
    };
    const handleVisibility = () => {
      if (!document.hidden) {
        router.refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [router]);

  const handleToggleDesktopCollapse = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const isAuthPage =
    pathname === '/admin/login' ||
    pathname === '/admin/forgot-password' ||
    pathname === '/admin/reset-password';

  if (isAuthPage) {
    return <main className="min-h-screen bg-[var(--bg-base)]">{children}</main>;
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Desktop & Mobile Drawer Sidebar */}
      <Sidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        isCollapsed={desktopCollapsed}
        onToggleCollapse={handleToggleDesktopCollapse}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          onToggleMobile={() => setMobileOpen((prev) => !prev)}
          onToggleCollapse={handleToggleDesktopCollapse}
          isCollapsed={desktopCollapsed}
        />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto w-full">{children}</main>
      </div>
    </div>
  );
}
