'use client';

import React from 'react';
import Link from 'next/link';
import { SkillCategory, Skill } from '@/types';
import { ScrollReveal, ScrollRevealItem } from '@/components/shared/ScrollReveal';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkillsSectionProps {
  categories: SkillCategory[];
  showAll?: boolean;
}

function getLevelPercentage(level: string): number {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 95;
    case 'advanced':
      return 80;
    case 'intermediate':
      return 60;
    default:
      return 40;
  }
}

function getLevelDots(level: string): number {
  switch (level?.toLowerCase()) {
    case 'expert':
      return 4;
    case 'advanced':
      return 3;
    case 'intermediate':
      return 2;
    default:
      return 1;
  }
}

function SkillCard({ skill }: { skill: Skill }) {
  const percentage = getLevelPercentage(skill.level);
  const activeDots = getLevelDots(skill.level);

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 space-y-3 hover:border-[var(--border-hover)] transition-all">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--text-primary)]">{skill.name}</span>
        {/* 4 dots level indicator from DESIGN_FULL.MD */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((dot) => (
            <span
              key={dot}
              className={`w-1.5 h-1.5 rounded-full ${
                dot <= activeDots ? 'bg-lime-600 dark:bg-brand' : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Progress Bar with Shimmer Animation */}
      <div className="relative h-1.5 w-full bg-[var(--bg-elevated)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${percentage}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="h-full bg-lime-600 dark:bg-brand relative overflow-hidden rounded-full"
        >
          {/* Shimmer line */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
        </motion.div>
      </div>

      <div className="flex justify-between text-[11px] font-mono text-[var(--text-muted)] capitalize">
        <span>{skill.level}</span>
        <span>{percentage}%</span>
      </div>
    </div>
  );
}

export function SkillsSection({ categories, showAll = false }: SkillsSectionProps) {
  const displayCategories = showAll ? categories : categories.slice(0, 4);

  return (
    <section className={showAll ? 'space-y-8' : 'py-24 max-w-6xl mx-auto px-6 space-y-12'}>
      {!showAll && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
              Kompetensi Teknis
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Skills & Capabilities
            </h2>
          </div>
          <Link
            href="/about?tab=skills"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors"
          >
            <span>Lihat Semua Skill ({categories.reduce((acc, c) => acc + (c.skills?.length || 0), 0)})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="space-y-10">
        {displayCategories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <h3 className="text-base font-bold font-mono tracking-wider text-lime-700 dark:text-brand uppercase">
              // {cat.name}
            </h3>

            <ScrollReveal className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {cat.skills?.map((skill) => (
                <ScrollRevealItem key={skill.id}>
                  <SkillCard skill={skill} />
                </ScrollRevealItem>
              ))}
            </ScrollReveal>
          </div>
        ))}
      </div>
    </section>
  );
}
