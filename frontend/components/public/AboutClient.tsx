'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Code2,
  Award,
  GraduationCap,
  Sparkles,
  Layers,
  Users,
  MapPin,
  Mail,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { ExperienceSection } from '@/components/public/ExperienceSection';
import { SkillsSection } from '@/components/public/SkillsSection';
import { CertificatesSection } from '@/components/public/CertificatesSection';
import { Button } from '@/components/ui/Button';
import { Experience, SkillCategory, Certificate, Education, SiteSetting, Page } from '@/types';
import Link from 'next/link';

interface AboutClientProps {
  experiences: Experience[];
  skills: SkillCategory[];
  certificates: Certificate[];
  educations: Education[];
  aboutPage?: Page | null;
  siteSetting?: SiteSetting | null;
  seoTitle?: string;
  seoDescription?: string;
}

type TabType = 'all' | 'experience' | 'skills' | 'certificates' | 'education';

export function AboutClient({
  experiences,
  skills,
  certificates,
  educations,
  aboutPage,
  siteSetting,
  seoTitle,
  seoDescription,
}: AboutClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get('tab') as TabType | null;
  const validTabs: TabType[] = ['all', 'experience', 'skills', 'certificates', 'education'];
  const [activeTab, setActiveTab] = useState<TabType>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'all'
  );

  const scrollToTabs = () => {
    setTimeout(() => {
      const target = document.getElementById('qualifications-tabs');
      if (target) {
        const yOffset = -90;
        const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 150);
  };

  useEffect(() => {
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
      if (tabParam !== 'all') {
        scrollToTabs();
      }
    }
  }, [tabParam]);

  const handleTabChange = (tab: TabType, shouldScroll = true) => {
    setActiveTab(tab);
    if (tab === 'all') {
      router.push('/about', { scroll: false });
    } else {
      router.push(`/about?tab=${tab}`, { scroll: false });
      if (shouldScroll) {
        scrollToTabs();
      }
    }
  };

  const formalEdu = educations.filter((e) => e.type !== 'organization');
  const orgEdu = educations.filter((e) => e.type === 'organization');
  const totalSkillCount = skills.reduce((acc, cat) => acc + (cat.skills?.length || 0), 0);

  const profilePhoto =
    aboutPage?.image_url || siteSetting?.hero_background_url || siteSetting?.logo_url;
  const siteName = siteSetting?.site_name || 'Syahril Haryono';
  const tagline = siteSetting?.tagline || 'Full Stack Developer | AI Enthusiast';
  
  // Process narrative to avoid redundant nested <h2> if we already have the main page title
  let bioNarrative = aboutPage?.content || '';
  if (bioNarrative.includes('<h2>Tentang Saya</h2>')) {
    bioNarrative = bioNarrative.replace('<h2>Tentang Saya</h2>', '');
  }

  const tabs: { id: TabType; label: string; icon: any; count?: number }[] = [
    { id: 'all', label: 'Semua Kualifikasi', icon: Layers },
    { id: 'experience', label: 'Pengalaman Kerja', icon: Briefcase, count: experiences.length },
    { id: 'skills', label: 'Keahlian Teknis', icon: Code2, count: totalSkillCount },
    { id: 'certificates', label: 'Sertifikasi & Lisensi', icon: Award, count: certificates.length },
    { id: 'education', label: 'Pendidikan & Organisasi', icon: GraduationCap, count: educations.length },
  ];

  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      {/* Breadcrumb - Standard spacing matching all other pages */}
      <BreadcrumbWithJsonLD items={[{ name: 'About', url: '/about' }]} />

      {/* Hero Profile Banner (Portrait Photo + Full Biodata & Story Narrative) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border-b border-[var(--border)] pb-10"
      >
        {/* Left Column: Portrait Photo Card with Ambient Glow */}
        {profilePhoto && (
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* Ambient Glow */}
              <div className="absolute -inset-2 bg-gradient-to-tr from-lime-500/20 via-emerald-500/15 to-lime-500/20 rounded-3xl blur-xl opacity-75 animate-pulse" />

              <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 shadow-xl group hover:border-lime-600/40 dark:hover:border-brand/40 transition-all duration-300">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-elevated)] relative">
                  <img
                    src={profilePhoto.startsWith('http') ? profilePhoto : `http://localhost:8080${profilePhoto}`}
                    alt={siteName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  {/* Floating Status Pill */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-emerald-400 border border-white/10 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>{siteSetting?.available_status || 'Available for Work'}</span>
                  </div>
                </div>

                {/* Quick Metadata Footer */}
                <div className="p-4 space-y-1.5">
                  <div className="font-bold text-[var(--text-primary)] text-lg">
                    {siteName}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] font-mono">
                    {tagline}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                      <span>Jakarta, ID</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                      <span>UNJ</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Full Biodata & Story Narrative + CTAs & Metrics */}
        <div className={profilePhoto ? 'lg:col-span-7 space-y-5' : 'lg:col-span-12 space-y-5'}>
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-lime-500/10 dark:bg-brand/10 border border-lime-600/20 dark:border-brand/20 text-xs font-semibold text-lime-700 dark:text-brand font-mono uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Profil & Biodata Lengkap</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight leading-tight">
              {aboutPage?.title || 'Tentang Syahril Haryono'}
            </h1>

            {/* Biodata & Narrative Prose Content (Direct, Clean & Engaging) */}
            {bioNarrative ? (
              <div
                className="text-sm sm:text-base leading-relaxed text-[var(--text-secondary)] space-y-3 pt-1 [&_strong]:text-[var(--text-primary)] [&_strong]:font-bold [&_p]:leading-relaxed"
                dangerouslySetInnerHTML={{ __html: bioNarrative }}
              />
            ) : (
              <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed">
                {aboutPage?.meta_description || seoDescription || siteSetting?.description}
              </p>
            )}
          </div>

          {/* Action CTAs - 2 buttons side-by-side (kiri-kanan) on mobile */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 pt-1">
            <Button size="lg" asChild className="gap-2 font-bold shadow-md bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] w-full sm:w-auto px-3 sm:px-6 text-xs sm:text-base justify-center">
              <Link href="/contact">
                <Mail className="w-4 h-4 shrink-0" />
                <span>Hubungi Saya</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="gap-2 font-bold w-full sm:w-auto px-3 sm:px-6 text-xs sm:text-base justify-center">
              <Link href="/projects">
                <span className="truncate">Lihat Semua Proyek</span>
                <ArrowUpRight className="w-4 h-4 shrink-0" />
              </Link>
            </Button>
          </div>

          {/* Quick Highlights Grid - Clickable & Auto-scrolls to Qualifications */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 pt-5 border-t border-[var(--border)]">
            {/* Card 1: Pengalaman */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleTabChange('experience')}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('experience')}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5 shadow-2xs hover:border-lime-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group text-left"
              title="Klik untuk melihat jejak pengalaman kerja"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                  Pengalaman
                </span>
                <Briefcase className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {experiences.length}
                </div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Posisi Karier</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-lime-700 dark:text-brand transition-opacity" />
                </div>
              </div>
            </div>

            {/* Card 2: Tech Skills */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleTabChange('skills')}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('skills')}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5 shadow-2xs hover:border-lime-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group text-left"
              title="Klik untuk melihat keahlian teknis"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                  Skills
                </span>
                <Code2 className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {totalSkillCount}+
                </div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Keahlian Teknis</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-lime-700 dark:text-brand transition-opacity" />
                </div>
              </div>
            </div>

            {/* Card 3: Sertifikasi */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleTabChange('certificates')}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('certificates')}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5 shadow-2xs hover:border-lime-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group text-left"
              title="Klik untuk melihat sertifikasi resmi"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                  Sertifikasi
                </span>
                <Award className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {certificates.length}
                </div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Lisensi Resmi</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-lime-700 dark:text-brand transition-opacity" />
                </div>
              </div>
            </div>

            {/* Card 4: Pendidikan */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleTabChange('education')}
              onKeyDown={(e) => e.key === 'Enter' && handleTabChange('education')}
              className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] space-y-2.5 shadow-2xs hover:border-lime-500/60 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col justify-between cursor-pointer group text-left"
              title="Klik untuk melihat riwayat pendidikan"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                  Pendidikan
                </span>
                <GraduationCap className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              </div>
              <div className="space-y-0.5">
                <div className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight">
                  {formalEdu.length}
                </div>
                <div className="text-xs font-semibold text-[var(--text-secondary)] flex items-center justify-between">
                  <span>Gelar Formal</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-lime-700 dark:text-brand transition-opacity" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sticky Tab Navigation Bar */}
      <motion.div
        id="qualifications-tabs"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="sticky top-20 z-30 py-3 -mx-6 px-6 bg-[var(--bg-base)]/85 backdrop-blur-md border-y border-[var(--border)]"
      >
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`relative px-4 py-2 rounded-2xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 z-10 ${
                  isActive
                    ? 'text-white dark:text-[#0a0a0a]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeAboutSectionTab"
                    className="absolute inset-0 bg-lime-600 dark:bg-brand rounded-2xl -z-10 shadow-xs"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive
                        ? 'bg-black/20 text-white dark:bg-black/20 dark:text-[#0a0a0a]'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-muted)]'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Dynamic Content Views */}
      <AnimatePresence mode="wait">
        {/* VIEW 1: ALL SECTIONS (Comprehensive View) */}
        {activeTab === 'all' && (
          <motion.div
            key="all-sections"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-24"
          >
            {/* Experience Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5">
                    <Briefcase className="w-4 h-4" />
                    Karier & Pekerjaan
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Work Experience
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('experience')}
                  className="text-xs font-bold text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
                >
                  Fokus Pengalaman ({experiences.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <ExperienceSection experiences={experiences} showAll={true} />
            </section>

            {/* Skills Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    Keahlian & Penguasaan
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Technical Skills Matrix
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('skills')}
                  className="text-xs font-bold text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
                >
                  Fokus Skills ({totalSkillCount})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <SkillsSection categories={skills} showAll={true} />
            </section>

            {/* Certificates Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5">
                    <Award className="w-4 h-4" />
                    Lisensi Resmi
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Licenses & Certifications
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('certificates')}
                  className="text-xs font-bold text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
                >
                  Fokus Sertifikat ({certificates.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              <CertificatesSection certificates={certificates} showAll={true} />
            </section>

            {/* Education & Leadership Section */}
            <section className="space-y-8">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    Akademik & Organisasi
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    Education & Leadership
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('education')}
                  className="text-xs font-bold text-lime-700 dark:text-brand hover:underline flex items-center gap-1"
                >
                  Fokus Pendidikan ({educations.length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Formal Education Grid */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>Pendidikan Formal</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {formalEdu.map((edu) => (
                    <div
                      key={edu.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-lime-500/40 transition-all flex flex-col justify-between shadow-2xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                            {edu.start_year} — {edu.is_current ? 'Present' : edu.end_year || 'Present'}
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-lime-500/30 text-lime-700 dark:text-brand bg-lime-500/10 dark:bg-brand/10 font-medium">
                            Formal
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[var(--text-primary)]">
                          {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                        </h4>
                        <p className="text-sm text-[var(--text-secondary)] font-medium">{edu.institution}</p>
                        {edu.description && (
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">{edu.description}</p>
                        )}
                      </div>
                      {edu.gpa && (
                        <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                          <span>IPK / GPA</span>
                          <span className="font-bold text-[var(--text-primary)] font-mono">{edu.gpa}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Organization Grid */}
              {orgEdu.length > 0 && (
                <div className="space-y-4 pt-4">
                  <h3 className="text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Pengalaman Organisasi & Kepemimpinan</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {orgEdu.map((org) => (
                      <div
                        key={org.id}
                        className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3 hover:border-lime-500/40 transition-all shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                            {org.start_year} — {org.is_current ? 'Present' : org.end_year || 'Present'}
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                            Organisasi
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-[var(--text-primary)]">
                          {org.degree || org.field_of_study || 'Anggota'}
                        </h4>
                        <p className="text-xs font-semibold text-[var(--text-secondary)]">{org.institution}</p>
                        {org.description && (
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{org.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </motion.div>
        )}

        {/* VIEW 2: WORK EXPERIENCE ONLY */}
        {activeTab === 'experience' && (
          <motion.div
            key="experience-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Work Experience Timeline
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Jejak pengalaman kerja profesional, kontribusi teknis, dan arsitektur sistem di berbagai organisasi.
              </p>
            </div>
            <ExperienceSection experiences={experiences} showAll={true} />
          </motion.div>
        )}

        {/* VIEW 3: SKILLS ONLY */}
        {activeTab === 'skills' && (
          <motion.div
            key="skills-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Technical Skills & Competencies
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Penguasaan mendalam dalam arsitektur backend, ekosistem frontend, kecerdasan buatan (AI/LLM), dan infrastruktur cloud.
              </p>
            </div>
            <SkillsSection categories={skills} showAll={true} />
          </motion.div>
        )}

        {/* VIEW 4: CERTIFICATES ONLY */}
        {activeTab === 'certificates' && (
          <motion.div
            key="certificates-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-8"
          >
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Licenses & Official Certifications
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Sertifikasi profesional global dari Anthropic, Microsoft, IBM, Meta, Google Cloud, dan AWS.
              </p>
            </div>
            <CertificatesSection certificates={certificates} showAll={true} />
          </motion.div>
        )}

        {/* VIEW 5: EDUCATION ONLY */}
        {activeTab === 'education' && (
          <motion.div
            key="education-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-12"
          >
            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Education & Leadership Background
              </h2>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Latar belakang pendidikan formal dan kepemimpinan di berbagai organisasi kemahasiswaan dan teknologi.
              </p>
            </div>

            {/* Formal Education Grid */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider flex items-center gap-2">
                <GraduationCap className="w-5 h-5" />
                <span>Pendidikan Formal</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formalEdu.map((edu) => (
                  <div
                    key={edu.id}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-lime-500/40 transition-all flex flex-col justify-between shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                          {edu.start_year} — {edu.is_current ? 'Present' : edu.end_year || 'Present'}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-lime-500/30 text-lime-700 dark:text-brand bg-lime-500/10 dark:bg-brand/10 font-medium">
                          Formal
                        </span>
                      </div>
                      <h4 className="text-lg font-bold text-[var(--text-primary)]">
                        {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                      </h4>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">{edu.institution}</p>
                      {edu.description && (
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">{edu.description}</p>
                      )}
                    </div>
                    {edu.gpa && (
                      <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                        <span>IPK / GPA</span>
                        <span className="font-bold text-[var(--text-primary)] font-mono">{edu.gpa}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Organization Grid */}
            {orgEdu.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Pengalaman Organisasi & Kepemimpinan</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {orgEdu.map((org) => (
                    <div
                      key={org.id}
                      className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-3 hover:border-lime-500/40 transition-all shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                          {org.start_year} — {org.is_current ? 'Present' : org.end_year || 'Present'}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                          Organisasi
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-[var(--text-primary)]">
                        {org.degree || org.field_of_study || 'Anggota'}
                      </h4>
                      <p className="text-xs font-semibold text-[var(--text-secondary)]">{org.institution}</p>
                      {org.description && (
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">{org.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AboutClient;
