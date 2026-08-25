'use client';

import React from 'react';
import Link from 'next/link';
import { Experience } from '@/types';
import { ScrollReveal, ScrollRevealItem } from '@/components/shared/ScrollReveal';
import { ArrowUpRight, Briefcase, MapPin, Wifi, Laptop, Building2 } from 'lucide-react';

interface ExperienceSectionProps {
  experiences: Experience[];
  showAll?: boolean;
}

export function ExperienceSection({ experiences, showAll = false }: ExperienceSectionProps) {
  const displayItems = showAll ? experiences : experiences.slice(0, 4);

  return (
    <section className={showAll ? 'space-y-8' : 'py-24 max-w-5xl mx-auto px-6 space-y-12'}>
      {!showAll && (
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
              Perjalanan Profesional
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
              Work Experience
            </h2>
          </div>
          <Link
            href="/about?tab=experience"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors"
          >
            <span>Lihat Semua Pengalaman ({experiences.length})</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      <div className="relative pl-6 sm:pl-8 border-l border-[var(--border)] space-y-10">
        <ScrollReveal stagger={0.1}>
          {displayItems.map((exp) => {
            let stackList: string[] = [];
            if (Array.isArray(exp.tech_stack)) {
              stackList = exp.tech_stack;
            } else if (typeof exp.tech_stack === 'string') {
              try {
                stackList = JSON.parse(exp.tech_stack);
              } catch {
                stackList = exp.tech_stack ? exp.tech_stack.split(',').map((s) => s.trim()) : [];
              }
            }

            return (
              <ScrollRevealItem key={exp.id} className="relative group">
                {/* Timeline Dot */}
                <div
                  className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 bg-[var(--bg-base)] flex items-center justify-center ${
                    exp.is_current
                      ? 'border-lime-600 dark:border-brand shadow-md shadow-lime-500/20 dark:shadow-brand/30'
                      : 'border-[var(--border)] group-hover:border-[var(--text-secondary)]'
                  } transition-colors`}
                >
                  {exp.is_current && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 dark:bg-brand animate-ping-slow" />
                  )}
                </div>

                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-[var(--border-hover)] transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                        {exp.position}
                      </h3>
                      <div className="text-sm font-medium text-[var(--text-secondary)]">
                        {exp.company}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {exp.is_current && (
                        <span className="px-2.5 py-0.5 rounded-full bg-lime-500/10 text-lime-800 dark:bg-brand/10 dark:text-brand border border-lime-500/30 dark:border-brand/30 font-semibold">
                          Current
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] capitalize font-medium">
                        {exp.type}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] capitalize flex items-center gap-1 font-medium">
                        <Wifi className="w-3 h-3 text-lime-700 dark:text-brand/80" />
                        <span>{exp.work_mode}</span>
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-mono text-[var(--text-muted)]">
                    {exp.start_date} — {exp.is_current ? 'Present' : exp.end_date || 'Present'} {exp.location && `• ${exp.location}`}
                  </div>

                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                    {exp.description}
                  </p>

                  {stackList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--border)]">
                      {stackList.map((tech, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md text-[10px] font-mono border border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--text-secondary)]"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollRevealItem>
            );
          })}
        </ScrollReveal>
      </div>
    </section>
  );
}
