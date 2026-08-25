'use client';

import React, { useRef, useState, useMemo } from 'react';
import Link from 'next/link';
import { Project } from '@/types';
import {
  ArrowUpRight,
  Github,
  ExternalLink,
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/shared/Pagination';
import { getMediaUrl } from '@/lib/utils';

interface FeaturedProjectsSectionProps {
  projects: Project[];
  showAll?: boolean;
  maxHomeItems?: number;
}

function TiltCard({ project }: { project: Project }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  // Parse tech stack
  let stackList: string[] = [];
  if (Array.isArray(project.tech_stack)) {
    stackList = project.tech_stack;
  } else if (typeof project.tech_stack === 'string') {
    try {
      stackList = JSON.parse(project.tech_stack);
    } catch {
      stackList = project.tech_stack.split(',').map((s) => s.trim());
    }
  }

  const mainImage = project.images?.[0]?.medium_url || project.images?.[0]?.original_url;

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden transition-all duration-300 hover:border-lime-600/50 dark:hover:border-brand/50 hover:shadow-2xl flex flex-col justify-between h-full"
    >
      <div className="space-y-4">
        {/* Project Image Banner */}
        <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-elevated)] border-b border-[var(--border)]">
          {mainImage ? (
            <img
              src={getMediaUrl(mainImage)}
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-muted)] p-6 text-center space-y-2">
              <Sparkles className="w-8 h-8 opacity-40 text-lime-700 dark:text-brand" />
              <span className="text-xs font-mono font-semibold">{project.category?.name || 'Project Showcase'}</span>
            </div>
          )}

          {project.is_featured && (
            <div className="absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-700 text-white dark:bg-brand dark:text-[#0a0a0a] shadow-md">
              Featured
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-3 pt-0">
          <div className="space-y-1">
            {project.category?.name && (
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand">
                {project.category.name}
              </span>
            )}
            <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors line-clamp-1">
              {project.title}
            </h3>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-2">
            {project.short_description}
          </p>

          {/* Tech Stack Pills */}
          <div className="flex flex-wrap gap-1.5 pt-2">
            {stackList.slice(0, 4).map((tech, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-secondary)] font-medium"
              >
                {tech}
              </span>
            ))}
            {stackList.length > 4 && (
              <span className="px-1.5 py-0.5 text-[10px] font-mono text-[var(--text-muted)]">
                +{stackList.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Action Footer */}
      <div className="p-6 pt-0 border-t border-[var(--border)] mt-4">
        <div className="flex items-center justify-between pt-4 text-xs text-[var(--text-secondary)]">
          <Link
            href={`/projects/${project.slug}`}
            className="flex items-center gap-1 hover:text-lime-700 dark:hover:text-brand transition-colors font-semibold"
          >
            <span>Detail Proyek</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>

          <div className="flex items-center gap-3">
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-lime-700 dark:hover:text-brand transition-colors p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
                title="Lihat Repositori GitHub"
              >
                <Github className="w-3.5 h-3.5" />
              </a>
            )}
            {project.demo_url && (
              <a
                href={project.demo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-lime-700 dark:hover:text-brand transition-colors p-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)]"
                title="Kunjungi Live Demo"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function FeaturedProjectsSection({
  projects,
  showAll = false,
  maxHomeItems = 6,
}: FeaturedProjectsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;
  const sectionRef = useRef<HTMLDivElement>(null);

  // Extract unique categories safely
  const rawCategories = useMemo(() => {
    return Array.from(
      new Set(
        projects
          .map((p) => p.category?.name?.trim())
          .filter((name): name is string => Boolean(name))
      )
    );
  }, [projects]);

  const categories = useMemo(() => ['ALL', ...rawCategories], [rawCategories]);

  // Handle filter changes and reset pagination
  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Filtered projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const catName = p.category?.name?.trim() || '';
      const catSlug = p.category?.slug?.trim() || '';
      const matchCategory =
        selectedCategory === 'ALL' ||
        catName.toLowerCase() === selectedCategory.trim().toLowerCase() ||
        catSlug.toLowerCase() === selectedCategory.trim().toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        (p.short_description && p.short_description.toLowerCase().includes(q)) ||
        (typeof p.tech_stack === 'string' && p.tech_stack.toLowerCase().includes(q)) ||
        (Array.isArray(p.tech_stack) && p.tech_stack.some((t) => t.toLowerCase().includes(q)));

      return matchCategory && matchSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  // Total pages calculation
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  // Projects to display (Paginated on /projects, or Max 6 on Homepage)
  const displayProjects = useMemo(() => {
    if (!showAll) {
      // Prioritize featured projects on homepage
      const featured = projects.filter((p) => p.is_featured);
      const remaining = projects.filter((p) => !p.is_featured);
      const combined = [...featured, ...remaining];
      return combined.slice(0, maxHomeItems);
    }

    const start = (currentPage - 1) * itemsPerPage;
    return filteredProjects.slice(start, start + itemsPerPage);
  }, [showAll, projects, maxHomeItems, filteredProjects, currentPage, itemsPerPage]);

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
      id="featured-projects"
      className={showAll ? 'space-y-8' : 'py-24 max-w-6xl mx-auto px-6 space-y-10'}
    >
      {!showAll && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
              Karya & Eksplorasi
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Featured Projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors"
          >
            <span>Lihat Semua Proyek ({projects.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Category Filter & Search Bar (Only on /projects) */}
      {showAll && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Horizontal Swipeable Category Rail on mobile, clean wrap on desktop */}
            {categories.length > 2 && (
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 -mx-6 px-6 sm:mx-0 sm:px-0 sm:flex-wrap no-scrollbar flex-1 min-w-0"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => handleCategoryChange(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all border ${
                      selectedCategory === cat
                        ? 'border-lime-600 dark:border-brand bg-lime-500/10 dark:bg-brand/10 text-lime-800 dark:text-brand shadow-xs font-bold'
                        : 'border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    {cat === 'ALL' ? `Semua Kategori (${projects.length})` : cat}
                  </button>
                ))}
              </div>
            )}

            {/* Search Input */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Cari proyek atau teknologi..."
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

      {/* Grid of Projects */}
      {filteredProjects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-12 text-center rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)] space-y-2"
        >
          <p className="font-semibold text-sm text-[var(--text-secondary)]">Tidak ada proyek yang sesuai</p>
          <p>Coba pilih kategori lain atau ubah kata kunci pencarian.</p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {displayProjects.map((project) => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.94, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 15 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className="h-full"
              >
                <TiltCard project={project} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Responsive Pagination Controls on /projects */}
      {showAll && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredProjects.length}
          itemsPerPage={itemsPerPage}
          onPageChange={handlePageChange}
          itemName="proyek"
        />
      )}
    </section>
  );
}
