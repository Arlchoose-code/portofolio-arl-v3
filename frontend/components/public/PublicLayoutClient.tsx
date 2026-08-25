'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/shared/Navbar';
import { Footer } from '@/components/shared/Footer';
import { ChatWidget } from '@/components/shared/ChatWidget';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { initLenis } from '@/lib/lenis';
import { configureGSAP } from '@/lib/gsap-config';
import { PublicSiteInfo } from '@/types';
import { ShieldAlert } from 'lucide-react';

interface PublicLayoutClientProps {
  children: React.ReactNode;
  siteInfo: PublicSiteInfo | null;
  isMaintenance: boolean;
  hasAdminCookie: boolean;
}

export function PublicLayoutClient({
  children,
  siteInfo,
  isMaintenance,
  hasAdminCookie,
}: PublicLayoutClientProps) {
  useEffect(() => {
    initLenis();
    configureGSAP();
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative selection:bg-brand selection:text-black">
      {/* Floating Admin Preview Banner if Maintenance Mode is On */}
      {isMaintenance && hasAdminCookie && (
        <div className="sticky top-0 z-50 w-full bg-amber-500 text-black px-4 py-2.5 text-xs font-bold font-mono flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
            <span>MODE PEMELIHARAAN AKTIF — Pengunjung umum melihat layar Maintenance. Anda sedang dalam Admin Preview.</span>
          </div>
          <Link
            href="/admin/settings"
            className="underline hover:opacity-80 transition-opacity whitespace-nowrap ml-4 font-bold"
          >
            Ubah di Pengaturan Admin →
          </Link>
        </div>
      )}

      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <ScrollToTop />
      <ChatWidget />
    </div>
  );
}
