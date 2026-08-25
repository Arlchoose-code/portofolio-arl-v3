'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MagneticWrapper } from './MagneticWrapper';
import { SocialIcon } from './SocialIcon';
import { ArrowUpRight } from 'lucide-react';
import { settingsApi } from '@/lib/api';
import { SocialLink, SiteSetting } from '@/types';
import { getMediaUrl } from '@/lib/utils';

export function Footer() {
  const [site, setSite] = useState<SiteSetting | null>(null);
  const [socials, setSocials] = useState<SocialLink[]>([]);

  const fetchSiteInfo = () => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data) {
        if (res.data.site) setSite(res.data.site);
        if (res.data.social_links) setSocials(res.data.social_links);
      }
    });
  };

  useEffect(() => {
    fetchSiteInfo();

    const onFocus = () => fetchSiteInfo();
    const onVisibility = () => {
      if (!document.hidden) fetchSiteInfo();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const brandName = site?.site_name || 'Syahril Haryono';
  const taglineText = site?.description || site?.tagline || 'Full Stack Developer & AI Systems Engineer';
  const copyrightText = site?.footer_text || `© 2026 ${brandName}. Built with Go, Next.js & AI.`;

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg-base)] py-16 text-[var(--text-secondary)]">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Brand & Tagline */}
        <div className="space-y-2 text-center md:text-left">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-lg font-bold tracking-tight text-[var(--text-primary)] font-sans"
          >
            {site?.logo_url && (
              <img
                src={getMediaUrl(site.logo_url)}
                alt={brandName}
                className="w-10 h-10 object-contain rounded-xl shrink-0 shadow-sm border border-[var(--border)] p-1 bg-[var(--bg-surface)]"
              />
            )}
            <div className="flex items-center gap-1">
              <span>{brandName}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-lime-600 dark:bg-brand" />
            </div>
          </Link>
          <p className="text-xs text-[var(--text-muted)] max-w-sm">
            {taglineText}
          </p>
        </div>

        {/* Dynamic Social Links */}
        <div className="flex items-center gap-3">
          {socials.length > 0 ? (
            socials.map((social) => (
              <MagneticWrapper key={social.id}>
                <a
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors flex items-center justify-center shadow-sm"
                  aria-label={social.platform}
                  title={social.platform}
                >
                  <SocialIcon icon={social.icon} platform={social.platform} className="w-4 h-4" />
                </a>
              </MagneticWrapper>
            ))
          ) : (
            <>
              <MagneticWrapper>
                <a
                  href="https://github.com/Arlchoose-code"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors flex items-center justify-center shadow-sm"
                  aria-label="GitHub"
                >
                  <SocialIcon platform="github" className="w-4 h-4" />
                </a>
              </MagneticWrapper>
              <MagneticWrapper>
                <a
                  href="https://linkedin.com/in/syahril-haryono"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors flex items-center justify-center shadow-sm"
                  aria-label="LinkedIn"
                >
                  <SocialIcon platform="linkedin" className="w-4 h-4" />
                </a>
              </MagneticWrapper>
            </>
          )}
        </div>
      </div>

      {/* Footer Navigation & Copyright */}
      <div className="max-w-6xl mx-auto px-6 mt-12 pt-6 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-4">
        <span>{copyrightText}</span>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link href="/about" className="hover:text-lime-700 dark:hover:text-brand transition-colors font-medium">
            Tentang Saya
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/tools" className="hover:text-lime-700 dark:hover:text-brand transition-colors font-medium">
            Web Tools
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/contact" className="hover:text-lime-700 dark:hover:text-brand transition-colors font-medium">
            Hubungi Saya
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/privacy-policy" className="hover:text-lime-700 dark:hover:text-brand transition-colors font-medium">
            Kebijakan Privasi
          </Link>
          <span className="opacity-30">•</span>
          <Link href="/terms" className="hover:text-lime-700 dark:hover:text-brand transition-colors font-medium">
            Syarat & Ketentuan
          </Link>
        </div>
      </div>
    </footer>
  );
}
