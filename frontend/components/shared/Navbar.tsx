'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, ArrowUpRight, Code2, User, Wrench, Send, ChevronRight, Sparkles } from 'lucide-react';
import { settingsApi } from '@/lib/api';

const navLinks = [
  {
    name: 'Projects',
    href: '/projects',
    icon: Code2,
    badge: 'Karya',
    description: 'Sistem web, arsitektur backend & open-source',
    match: (path: string) => path.startsWith('/projects'),
  },
  {
    name: 'About',
    href: '/about',
    icon: User,
    badge: 'Profil',
    description: 'Rekam jejak, keahlian teknis & sertifikasi',
    match: (path: string) =>
      path === '/about' ||
      path.startsWith('/about') ||
      path.startsWith('/experiences') ||
      path.startsWith('/skills') ||
      path.startsWith('/certificates') ||
      path.startsWith('/educations'),
  },
  {
    name: 'Tools',
    href: '/tools',
    icon: Wrench,
    badge: 'Utilitas',
    description: 'Pusat web tools interaktif & generator',
    match: (path: string) => path.startsWith('/tools'),
  },
  {
    name: 'Contact',
    href: '/contact',
    icon: Send,
    badge: 'Pesan',
    description: 'Mari berdiskusi & jalin kerja sama',
    match: (path: string) => path.startsWith('/contact'),
  },
];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [brandName, setBrandName] = useState('Arl');
  const [logoUrl, setLogoUrl] = useState('');
  const [availableStatus, setAvailableStatus] = useState('Available for Work');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);

    const fetchBranding = () => {
      settingsApi.getPublicSiteInfo().then((res) => {
        if (res.status && res.data?.site) {
          if (res.data.site.site_name) {
            setBrandName(res.data.site.site_name);
          }
          if (res.data.site.logo_url !== undefined) {
            setLogoUrl(res.data.site.logo_url);
          }
          if (res.data.site.available_status) {
            setAvailableStatus(res.data.site.available_status);
          }
        }
      });
    };

    fetchBranding();

    const onFocus = () => fetchBranding();
    const onVisibility = () => {
      if (!document.hidden) fetchBranding();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[var(--bg-base)]/85 backdrop-blur-md border-b border-[var(--border)] py-3 shadow-sm'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between relative">
          {/* Logo / Dynamic Brand Name */}
          <Link
            href="/"
            className="group flex items-center gap-3 text-xl font-bold tracking-tight text-[var(--text-primary)] hover:opacity-90 transition-opacity font-sans z-10"
          >
            {logoUrl && (
              <img
                src={logoUrl.startsWith('http') ? logoUrl : `http://localhost:8080${logoUrl}`}
                alt={brandName}
                className="w-10 h-10 object-contain rounded-xl shrink-0 shadow-sm border border-[var(--border)] p-1 bg-[var(--bg-surface)]"
              />
            )}
            <div className="flex items-center gap-1">
              <span>{brandName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand group-hover:scale-125 transition-transform" />
            </div>
          </Link>

          {/* Desktop Navigation - Exact Horizontal Center */}
          <nav className="hidden md:flex items-center gap-1.5 bg-[var(--bg-surface)]/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-[var(--border)] shadow-sm absolute left-1/2 -translate-x-1/2 z-0">
            {navLinks.map((link) => {
              const isActive = link.match(pathname);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`relative px-4 py-1.5 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-[var(--text-primary)] font-bold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-[var(--accent-soft)] rounded-full -z-10 border border-[var(--border)]"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Tools (Theme Toggle + Mobile Menu Trigger) */}
          <div className="flex items-center gap-2.5 z-10">
            <ThemeToggle />

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md text-[var(--text-primary)] hover:border-lime-500/50 hover:bg-[var(--bg-elevated)] transition-all shadow-xs cursor-pointer active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-lime-700 dark:text-brand" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Premium Full-Featured Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 dark:bg-black/80 backdrop-blur-sm z-50 md:hidden"
            />

            {/* Mobile Sheet Container (Solid Clean Surface in Light & Dark Mode) */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="fixed top-3 inset-x-3 max-w-lg mx-auto rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl z-50 md:hidden overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Sheet Header */}
              <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
                <Link
                  href="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 font-bold text-base text-[var(--text-primary)]"
                >
                  {logoUrl && (
                    <img
                      src={logoUrl.startsWith('http') ? logoUrl : `http://localhost:8080${logoUrl}`}
                      alt={brandName}
                      className="w-8 h-8 object-contain rounded-lg p-0.5 bg-[var(--bg-surface)] border border-[var(--border)]"
                    />
                  )}
                  <span>{brandName}</span>
                </Link>

                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    <span>{availableStatus}</span>
                  </div>

                  <ThemeToggle />

                  <button
                    type="button"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    aria-label="Tutup Menu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Link Cards */}
              <div className="p-4 space-y-2.5 overflow-y-auto">
                {navLinks.map((link, index) => {
                  const isActive = link.match(pathname);
                  const Icon = link.icon;

                  return (
                    <motion.div
                      key={link.name}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 + 0.05 }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`group flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 ${
                          isActive
                            ? 'border-lime-600/40 dark:border-brand/40 bg-lime-500/10 dark:bg-brand/10 shadow-xs'
                            : 'border-[var(--border)] bg-[var(--bg-elevated)]/50 hover:bg-[var(--bg-elevated)] hover:border-lime-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
                              isActive
                                ? 'bg-lime-600 text-white dark:bg-brand dark:text-black border-lime-600 dark:border-brand shadow-xs'
                                : 'bg-[var(--bg-surface)] text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand border-[var(--border)]'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-bold truncate ${
                                  isActive
                                    ? 'text-lime-700 dark:text-brand'
                                    : 'text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors'
                                }`}
                              >
                                {link.name}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-secondary)] font-semibold">
                                {link.badge}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5 font-normal">
                              {link.description}
                            </p>
                          </div>
                        </div>

                        <ChevronRight
                          className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                            isActive
                              ? 'text-lime-700 dark:text-brand'
                              : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Bottom Quick Contact CTA */}
              <div className="p-4 pt-2 border-t border-[var(--border)] bg-[var(--bg-elevated)]/40 mt-auto">
                <Link
                  href="/contact"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-lime-600 hover:bg-lime-700 text-white dark:bg-brand dark:hover:bg-brand/90 dark:text-black font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Kirim Pesan &amp; Mulai Kolaborasi</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Navbar;
