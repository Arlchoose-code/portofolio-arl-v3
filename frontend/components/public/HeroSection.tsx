'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { GridBackground } from '@/components/shared/GridBackground';
import { MagneticWrapper } from '@/components/shared/MagneticWrapper';
import { CountUp } from '@/components/shared/CountUp';
import { Button } from '@/components/ui/Button';
import {
  ArrowDown,
  ArrowUpRight,
  Award,
  Briefcase,
  Code2,
  Sparkles,
  Terminal,
  Brain,
  Zap,
  MapPin,
  GraduationCap,
} from 'lucide-react';
import Link from 'next/link';
import { settingsApi } from '@/lib/api';
import { SkillCategory } from '@/types';

interface HeroSectionProps {
  stats?: {
    projectsCount?: number;
    certificatesCount?: number;
    experiencesCount?: number;
    skillsCount?: number;
  };
  initialPhotoUrl?: string;
  skills?: SkillCategory[];
}

// 3D Interactive Cyber Portrait Card Component
function HeroPortrait3DCard({
  photoUrl,
  targetName,
  tagline,
  topSkillsBadge,
  availableStatus,
}: {
  photoUrl: string;
  targetName: string;
  tagline: string;
  topSkillsBadge: string;
  availableStatus?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 220, damping: 20 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], ['-10deg', '10deg']);
  const glareX = useTransform(smoothX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

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
      className="relative w-full max-w-sm sm:max-w-md cursor-pointer select-none group perspective-[1000px]"
    >
      {/* Ambient Pulsing Neon Glow */}
      <div className="absolute -inset-3.5 bg-gradient-to-tr from-lime-500/35 via-emerald-500/30 to-teal-500/35 rounded-3xl blur-2xl opacity-80 animate-pulse -z-10" />

      {/* Floating Cyber Badge 1: Top Right (AI / Role Badge) */}
      <motion.div
        animate={{ y: [-4, 4, -4] }}
        transition={{ duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: 'translateZ(45px)' }}
        className="absolute -top-4 -right-2 sm:-right-4 z-20 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-lime-500/40 text-lime-400 text-xs font-mono font-bold shadow-xl group-hover:border-lime-400 transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-lime-400 animate-pulse" />
        <span className="truncate max-w-[180px]">{tagline || 'Applied AI & Software'}</span>
      </motion.div>

      {/* Floating Cyber Badge 2: Bottom Left (Dynamic Tech Stacks from DB) */}
      {topSkillsBadge && (
        <motion.div
          animate={{ y: [4, -4, 4] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ transform: 'translateZ(45px)' }}
          className="absolute -bottom-3 -left-2 sm:-left-4 z-20 hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-black/85 backdrop-blur-md border border-white/25 text-white text-xs font-mono font-bold shadow-xl group-hover:border-lime-500/40 transition-colors"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>{topSkillsBadge}</span>
        </motion.div>
      )}

      {/* Main Glass Card */}
      <Link href="/about" className="block" title="Buka Halaman Tentang Saya Lengkap">
        <div
          style={{ transform: 'translateZ(20px)' }}
          className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md p-3 shadow-2xl transition-all duration-300 group-hover:border-lime-500/60 group-hover:shadow-lime-500/10 overflow-hidden"
        >
          {/* Subtle Glare Light Effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            style={{
              background: `radial-gradient(circle 250px at ${glareX} ${glareY}, rgba(163,230,53,0.15), transparent 80%)`,
            }}
          />

          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-elevated)] relative">
            <img
              src={photoUrl}
              alt={targetName}
              className="w-full h-full object-cover"
            />

            {/* Floating Status Pill inside photo */}
            <div className="absolute top-3.5 left-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md text-xs font-semibold text-emerald-400 border border-white/15 shadow-md">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{availableStatus || 'Available for Work'}</span>
            </div>
          </div>

          {/* Card Footer Metadata */}
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-extrabold text-[var(--text-primary)] text-lg group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                {targetName}
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-lime-500/10 text-lime-700 dark:text-brand border border-lime-500/25 font-bold">
                Engineer &bull; AI
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] font-mono truncate">
              {tagline}
            </p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-2.5 border-t border-[var(--border)]">
              <span className="flex items-center gap-1 font-medium">
                <MapPin className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                <span>Jakarta, ID</span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <GraduationCap className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                <span>UNJ</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HeroSection({ stats, initialPhotoUrl, skills = [] }: HeroSectionProps) {
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(initialPhotoUrl || '');
  const [targetName, setTargetName] = useState('Syahril Haryono');
  const [tagline, setTagline] = useState('Full Stack Developer & AI Systems Engineer');
  const [description, setDescription] = useState(
    'Membangun sistem web performa tinggi dengan arsitektur microservices, antarmuka reaktif modern, dan implementasi kecerdasan buatan terapan.'
  );
  const [displayText, setDisplayText] = useState('Syahril Haryono');
  const [availableStatus, setAvailableStatus] = useState('Available for Work');
  const [availableBadgeText, setAvailableBadgeText] = useState('Open for Engineering & AI Roles');
  const [customBadgeText, setCustomBadgeText] = useState('Full Stack • Applied AI');
  const [projectsCount, setProjectsCount] = useState(stats?.projectsCount || 15);
  const [certificatesCount, setCertificatesCount] = useState(stats?.certificatesCount || 55);
  const [experiencesCount, setExperiencesCount] = useState(stats?.experiencesCount || 18);
  const [skillsCount, setSkillsCount] = useState(stats?.skillsCount || 29);

  // Extract dynamic skills from database
  const dynamicTechList = useMemo(() => {
    const list: string[] = [];
    skills.forEach((cat) => {
      cat.skills?.forEach((s) => {
        if (s.name && !list.includes(s.name) && list.length < 8) {
          list.push(s.name);
        }
      });
    });
    return list.length > 0 ? list : ['Go', 'Rust', 'Next.js', 'Python', 'Docker', 'PostgreSQL'];
  }, [skills]);

  const topSkillsBadge = useMemo(() => {
    const top = dynamicTechList.slice(0, 3);
    return top.join(' • ');
  }, [dynamicTechList]);

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  const fetchHeroInfo = () => {
    settingsApi.getPublicSiteInfo().then((res) => {
      if (res.status && res.data?.site) {
        const s = res.data.site;
        if (s.site_name) {
          setTargetName(s.site_name);
          setDisplayText(s.site_name);
        }
        if (s.tagline) setTagline(s.tagline);
        if (s.description) setDescription(s.description);
        if (s.available_status) setAvailableStatus(s.available_status);
        if (s.available_badge_text) setAvailableBadgeText(s.available_badge_text);
        if (s.custom_badge_text) setCustomBadgeText(s.custom_badge_text);
        const bgUrl = s.hero_background_url || s.logo_url || '';
        if (bgUrl && !profilePhotoUrl) setProfilePhotoUrl(bgUrl);
      }
    });
  };

  useEffect(() => {
    fetchHeroInfo();

    const onFocus = () => fetchHeroInfo();
    const onVisibility = () => {
      if (!document.hidden) fetchHeroInfo();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  useEffect(() => {
    if (stats?.projectsCount !== undefined) setProjectsCount(stats.projectsCount);
    if (stats?.certificatesCount !== undefined) setCertificatesCount(stats.certificatesCount);
    if (stats?.experiencesCount !== undefined) setExperiencesCount(stats.experiencesCount);
    if (stats?.skillsCount !== undefined) setSkillsCount(stats.skillsCount);
  }, [stats]);

  // Cyber Text Scramble effect for Name
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        targetName
          .split('')
          .map((letter, index) => {
            if (index < iteration) {
              return targetName[index];
            }
            if (letter === ' ') return ' ';
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration >= targetName.length) {
        clearInterval(interval);
      }
      iteration += 1 / 2;
    }, 30);

    return () => clearInterval(interval);
  }, [targetName]);

  const effectivePhoto =
    profilePhotoUrl || '/storage/media/originals/1740333796_about_profile.jpg';

  const fullPhotoUrl = effectivePhoto.startsWith('http')
    ? effectivePhoto
    : `http://localhost:8080${effectivePhoto}`;

  const handleScrollDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = document.getElementById('featured-projects');
    if (target) {
      const headerOffset = 70;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: window.innerHeight * 0.85,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section className="relative min-h-[92vh] flex items-center justify-center pt-28 pb-16 overflow-hidden">
      <GridBackground />

      <div className="relative max-w-6xl mx-auto px-6 space-y-12 z-10 w-full">
        {/* Main 2-Column Split Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left Column: High-Impact Typography, Hacker Scramble & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Cyber Status Chips */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-wrap items-center gap-2.5"
            >
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)]/90 backdrop-blur-md text-xs font-medium text-[var(--text-secondary)] shadow-2xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 dark:bg-brand opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 dark:bg-brand" />
                </span>
                <span>{availableBadgeText || 'Open for Engineering & AI Roles'}</span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-lime-500/10 dark:bg-brand/10 border border-lime-600/25 dark:border-brand/25 text-[11px] font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
                <Terminal className="w-3 h-3" />
                <span>{customBadgeText || 'Full Stack • Applied AI'}</span>
              </div>
            </motion.div>

            {/* Name with Cyber Hacker Scramble Animation */}
            <div className="space-y-2">
              <motion.h1
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-[var(--text-primary)] font-sans leading-none"
              >
                {displayText}
              </motion.h1>

              {/* Typing Role Subtitle with Animated Blinking Cursor */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-lg sm:text-xl md:text-2xl text-lime-700 dark:text-brand font-mono font-bold tracking-tight"
              >
                <span>{tagline}</span>
                <span className="inline-block w-2 h-5 ml-1.5 bg-lime-600 dark:bg-brand animate-blink align-middle" />
              </motion.div>
            </div>

            {/* Narrative Bio */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed max-w-xl"
            >
              {description}
            </motion.p>

            {/* Dynamic Core Tech Pills from DB */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-wrap items-center gap-2 pt-1"
            >
              {dynamicTechList.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] text-[11px] font-mono font-semibold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-lime-500/40 transition-colors shadow-2xs"
                >
                  {tech}
                </span>
              ))}
            </motion.div>

            {/* Action Buttons: Responsive for Mobile & Desktop */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full"
            >
              {/* Primary CTA (Lihat Portofolio Proyek) */}
              <div className="w-full sm:w-auto">
                <MagneticWrapper>
                  <Button
                    size="lg"
                    asChild
                    className="gap-2 shadow-lg bg-lime-600 dark:bg-brand text-white dark:text-[#0a0a0a] shadow-brand/20 w-full sm:w-auto justify-center font-bold px-6"
                  >
                    <Link href="/projects">
                      <span>Lihat Portofolio Proyek</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </Link>
                  </Button>
                </MagneticWrapper>
              </div>

              {/* Secondary CTAs (Tentang Saya & Riwayat Pengalaman) */}
              <div className="grid grid-cols-2 gap-3 w-full sm:flex sm:w-auto">
                <MagneticWrapper>
                  <Button
                    size="lg"
                    variant="secondary"
                    asChild
                    className="gap-2 w-full sm:w-auto justify-center px-4 text-xs sm:text-sm font-semibold"
                  >
                    <Link href="/about">
                      <span>Tentang Saya</span>
                    </Link>
                  </Button>
                </MagneticWrapper>

                <MagneticWrapper>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="gap-2 w-full sm:w-auto justify-center px-4 text-xs sm:text-sm font-semibold"
                  >
                    <Link href="/about?tab=experience">
                      <span className="truncate">Riwayat Pengalaman</span>
                    </Link>
                  </Button>
                </MagneticWrapper>
              </div>
            </motion.div>
          </div>

          {/* Right Column: 3D-feel Interactive Portrait Card with Parallax Tilt & Glare */}
          <div className="lg:col-span-5 flex justify-center">
            <HeroPortrait3DCard
              photoUrl={fullPhotoUrl}
              targetName={targetName}
              tagline={tagline}
              topSkillsBadge={topSkillsBadge}
              availableStatus={availableStatus}
            />
          </div>
        </div>

        {/* Dynamic Connected 4 Counter Stat Cards with Click-to-Scroll */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto pt-6 border-t border-[var(--border)]"
        >
          {/* Projects Stat Card */}
          <Link
            href="/projects"
            className="group p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-lime-600/50 dark:hover:border-brand/50 hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer"
            title="Buka Portofolio Semua Proyek"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5" />
              <span>Proyek</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
              <CountUp end={projectsCount} suffix="+" />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              Sistem &amp; Open-Source
            </div>
          </Link>

          {/* Experience Stat Card */}
          <Link
            href="/about?tab=experience"
            className="group p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-lime-600/50 dark:hover:border-brand/50 hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer"
            title="Buka Jejak Pengalaman Karier"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Pengalaman</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
              <CountUp end={experiencesCount} suffix="+" />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              Jejak Karier &amp; Posisi
            </div>
          </Link>

          {/* Certificates Stat Card */}
          <Link
            href="/about?tab=certificates"
            className="group p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-lime-600/50 dark:hover:border-brand/50 hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer"
            title="Buka Sertifikasi &amp; Lisensi Resmi"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
              <Award className="w-3.5 h-3.5" />
              <span>Sertifikasi</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
              <CountUp end={certificatesCount} suffix="+" />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              Lisensi &amp; Uji Kompetensi
            </div>
          </Link>

          {/* Technical Skills Stat Card */}
          <Link
            href="/about?tab=skills"
            className="group p-5 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] hover:border-lime-600/50 dark:hover:border-brand/50 hover:bg-[var(--bg-elevated)] hover:-translate-y-1 transition-all duration-300 shadow-sm flex flex-col items-center justify-center space-y-1.5 text-center cursor-pointer"
            title="Buka Matriks Keahlian Teknis"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Keahlian</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
              <CountUp end={skillsCount} suffix="+" />
            </div>
            <div className="text-[11px] text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors">
              Tech Stack &amp; AI Tools
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Smooth Scroll Down Indicator */}
      <div className="absolute bottom-4 inset-x-0 flex justify-center z-20 pointer-events-auto">
        <button
          type="button"
          onClick={handleScrollDown}
          aria-label="Scroll ke Featured Projects"
          className="group flex items-center justify-center w-10 h-10 rounded-full border border-[var(--border)] bg-[var(--bg-surface)]/85 backdrop-blur-md hover:bg-[var(--bg-elevated)] hover:border-lime-500/50 dark:hover:border-brand/50 text-[var(--text-muted)] hover:text-lime-700 dark:hover:text-brand transition-all duration-200 shadow-md cursor-pointer active:scale-95"
        >
          <motion.div
            animate={{ y: [0, 4, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </button>
      </div>
    </section>
  );
}

export default HeroSection;
