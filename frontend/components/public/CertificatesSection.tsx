'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Certificate } from '@/types';
import {
  ArrowUpRight,
  Award,
  ExternalLink,
  Search,
  FileText,
  Image as ImageIcon,
  X,
  CheckCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/shared/Pagination';
import { getMediaUrl } from '@/lib/utils';

interface CertificatesSectionProps {
  certificates: Certificate[];
  showAll?: boolean;
  maxHomeItems?: number;
}

export function CertificatesSection({
  certificates,
  showAll = false,
  maxHomeItems = 6,
}: CertificatesSectionProps) {
  const [selectedIssuer, setSelectedIssuer] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [previewCert, setPreviewCert] = useState<Certificate | null>(null);
  const itemsPerPage = 9;
  const sectionRef = useRef<HTMLDivElement>(null);

  // Extract unique issuers safely
  const rawIssuers = useMemo(() => {
    return Array.from(
      new Set(
        certificates
          .map((c) => c.issuer?.trim())
          .filter((name): name is string => Boolean(name))
      )
    );
  }, [certificates]);

  const issuers = useMemo(() => ['ALL', ...rawIssuers], [rawIssuers]);

  // Handle filter changes and reset page
  const handleIssuerChange = (issuer: string) => {
    setSelectedIssuer(issuer);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Filtered certificates
  const filteredCertificates = useMemo(() => {
    return certificates.filter((c) => {
      const issuerName = c.issuer?.trim() || '';
      const matchIssuer =
        selectedIssuer === 'ALL' ||
        issuerName.toLowerCase() === selectedIssuer.trim().toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q) ||
        (c.credential_id && c.credential_id.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q));

      return matchIssuer && matchSearch;
    });
  }, [certificates, selectedIssuer, searchQuery]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredCertificates.length / itemsPerPage);

  // Certificates to display (Paginated on /certificates, or Max 6 on Homepage)
  const displayItems = useMemo(() => {
    if (!showAll) {
      return certificates.slice(0, maxHomeItems);
    }

    const start = (currentPage - 1) * itemsPerPage;
    return filteredCertificates.slice(start, start + itemsPerPage);
  }, [showAll, certificates, maxHomeItems, filteredCertificates, currentPage, itemsPerPage]);

  const isPdf = (url?: string) => Boolean(url && url.toLowerCase().endsWith('.pdf'));

  const scrollToSectionTop = () => {
    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToSectionTop();
  };

  const paginationRange = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const leftSibling = Math.max(currentPage - 1, 1);
    const rightSibling = Math.min(currentPage + 1, totalPages);

    const showLeftDots = leftSibling > 2;
    const showRightDots = rightSibling < totalPages - 1;

    if (!showLeftDots && showRightDots) {
      return [1, 2, 3, '...', totalPages];
    }
    if (showLeftDots && !showRightDots) {
      return [1, '...', totalPages - 2, totalPages - 1, totalPages];
    }
    if (showLeftDots && showRightDots) {
      return [1, '...', currentPage, '...', totalPages];
    }
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }, [totalPages, currentPage]);

  return (
    <section
      ref={sectionRef}
      id="certificates-section"
      className={showAll ? 'space-y-8' : 'py-24 max-w-6xl mx-auto px-6 space-y-10'}
    >
      {!showAll && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
              Validasi Kompetensi
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Licenses & Certifications
            </h2>
          </div>
          <Link
            href="/about?tab=certificates"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors"
          >
            <span>Lihat Semua Sertifikat ({certificates.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {showAll && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Horizontal Swipeable Category Rail on mobile, clean wrap on desktop */}
            {issuers.length > 2 && (
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar flex-1 min-w-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {issuers.map((issuer) => (
                  <button
                    key={issuer}
                    type="button"
                    onClick={() => handleIssuerChange(issuer)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                      selectedIssuer === issuer
                        ? 'border-lime-600 dark:border-brand bg-lime-500/10 dark:bg-brand/10 text-lime-800 dark:text-brand shadow-xs font-bold'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {issuer === 'ALL' ? `Semua (${certificates.length})` : issuer}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Cari nama sertifikasi atau ID..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border)] focus:border-lime-600 dark:focus:border-brand focus:outline-hidden text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchChange('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {filteredCertificates.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] space-y-2"
        >
          <p className="font-semibold text-sm text-[var(--text-secondary)]">Tidak ada sertifikat yang cocok</p>
          <p>Coba pilih penerbit lain atau ubah kata kunci pencarian.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayItems.map((cert) => {
              const fileUrl = cert.original_url || cert.thumbnail_url;
              const certIsPdf = isPdf(fileUrl);
              const hasFile = Boolean(fileUrl);

              return (
                <motion.div
                  key={cert.id}
                  layout
                  initial={{ opacity: 0, scale: 0.94, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.94, y: 15 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between hover:border-lime-600/50 dark:hover:border-brand/50 hover:shadow-xl transition-all duration-300 space-y-4 h-full"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-lime-500/10 text-lime-700 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/20 group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      {cert.issue_date && (
                        <span className="text-xs font-mono font-bold text-[var(--text-muted)]">
                          {cert.issue_date}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand">
                        {cert.issuer}
                      </span>
                      <h3 className="text-base font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors line-clamp-2">
                        {cert.name}
                      </h3>
                    </div>

                    {cert.description && (
                      <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                        {cert.description}
                      </p>
                    )}

                    {hasFile && (
                      <div
                        onClick={() => setPreviewCert(cert)}
                        className="cursor-pointer relative aspect-[16/9] rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)] group/thumb"
                      >
                        {certIsPdf ? (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 text-center text-[var(--text-secondary)] bg-lime-500/5 dark:bg-brand/5 group-hover/thumb:bg-lime-500/10 transition-colors">
                            <FileText className="w-8 h-8 text-lime-700 dark:text-brand" />
                            <span className="text-[11px] font-mono font-bold">Dokumen Sertifikat (PDF)</span>
                            <span className="text-[10px] text-[var(--text-muted)]">Klik untuk melihat</span>
                          </div>
                        ) : (
                          <>
                            <img
                              src={getMediaUrl(fileUrl)}
                              alt={cert.name}
                              className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center gap-1.5 text-white text-xs font-semibold transition-opacity">
                              <ImageIcon className="w-4 h-4" />
                              <span>Lihat Sertifikat</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--border)] space-y-3">
                    {cert.credential_id && (
                      <div className="text-[11px] font-mono text-[var(--text-muted)] truncate flex items-center justify-between">
                        <span>ID:</span>
                        <span className="font-semibold text-[var(--text-secondary)] truncate ml-1 max-w-[170px]">{cert.credential_id}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {hasFile && (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => setPreviewCert(cert)}
                          className="flex-1 gap-1.5 text-xs font-semibold"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lihat Sertifikat</span>
                        </Button>
                      )}

                      {cert.credential_url ? (
                        <Button
                          variant={hasFile ? 'outline' : 'default'}
                          size="sm"
                          asChild
                          className={`gap-1.5 text-xs font-semibold ${!hasFile ? 'w-full' : ''}`}
                        >
                          <a
                            href={cert.credential_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <span>Kredensial</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      ) : (
                        !hasFile && (
                          <div className="text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-lime-700 dark:text-brand" />
                            <span>Terverifikasi Resmi</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Responsive Pagination on /certificates */}
      {showAll && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredCertificates.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          itemName="sertifikat"
        />
      )}

      {/* Interactive Modal Preview for Image & PDF */}
      <AnimatePresence>
        {previewCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-4xl max-h-[90vh] rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 border-b border-[var(--border)] flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand">
                    {previewCert.issuer} — {previewCert.issue_date}
                  </span>
                  <h3 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                    {previewCert.name}
                  </h3>
                  {previewCert.credential_id && (
                    <div className="text-xs font-mono text-[var(--text-muted)]">
                      Credential ID: <span className="font-semibold text-[var(--text-secondary)]">{previewCert.credential_id}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {previewCert.credential_url && (
                    <Button asChild size="sm" variant="secondary" className="gap-1.5 text-xs">
                      <a href={previewCert.credential_url} target="_blank" rel="noopener noreferrer">
                        <span>Verifikasi Kredensial</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={() => setPreviewCert(null)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body: Render Image or PDF Viewer */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex items-center justify-center bg-[var(--bg-elevated)]">
                {(() => {
                  const url = previewCert.original_url || previewCert.thumbnail_url;
                  if (!url) {
                    return (
                      <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                        Dokumen sertifikat belum diunggah.
                      </div>
                    );
                  }

                  const fullUrl = getMediaUrl(url);

                  if (isPdf(url)) {
                    return (
                      <div className="w-full h-[65vh] flex flex-col space-y-3">
                        <iframe
                          src={`${fullUrl}#toolbar=0`}
                          title={previewCert.name}
                          className="w-full flex-1 rounded-xl border border-[var(--border)] bg-white"
                        />
                        <div className="flex justify-end">
                          <Button asChild size="sm" className="gap-1.5">
                            <a href={fullUrl} target="_blank" rel="noopener noreferrer" download>
                              <Download className="w-4 h-4" />
                              <span>Buka / Unduh File PDF</span>
                            </a>
                          </Button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div className="max-h-[70vh] overflow-hidden rounded-xl border border-[var(--border)] shadow-lg bg-black/10 flex items-center justify-center">
                      <img
                        src={fullUrl}
                        alt={previewCert.name}
                        className="max-h-[68vh] w-auto object-contain rounded-lg"
                      />
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
