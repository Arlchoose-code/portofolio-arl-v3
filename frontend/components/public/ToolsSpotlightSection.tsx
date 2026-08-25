'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  Video,
  Code2,
  ArrowUpRight,
  Sparkles,
  Zap,
  Wrench,
  Layers,
  Terminal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ToolSetting } from '@/types';

interface ToolsSpotlightSectionProps {
  tools?: ToolSetting[];
}

export function ToolsSpotlightSection({ tools = [] }: ToolsSpotlightSectionProps) {
  // Only show active tools from database
  const activeTools = tools.filter((t) => t.is_enabled);

  if (activeTools.length === 0) {
    return null;
  }

  // Dynamic icon resolver
  const getToolIcon = (tool: ToolSetting) => {
    const slug = (tool.slug || '').toLowerCase();
    const type = (tool.tool_type || '').toLowerCase();

    if (slug.includes('game') || type.includes('game')) return Gamepad2;
    if (slug.includes('youtube') || slug.includes('video') || type.includes('youtube')) return Video;
    if (slug.includes('dev') || slug.includes('code') || slug.includes('base64') || slug.includes('json')) return Code2;
    return Wrench;
  };

  return (
    <section className="py-16 max-w-6xl mx-auto px-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
            <Wrench className="w-3.5 h-3.5" />
            <span>Pusat Utilitas &amp; Web Tools</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Interactive Web Tools
          </h2>
        </div>
        <Link
          href="/tools"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors"
        >
          <span>Buka Semua Tools &amp; Utilitas ({activeTools.length})</span>
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid of Dynamic Tools from Database */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeTools.map((tool, idx) => {
          const Icon = getToolIcon(tool);
          const toolHref = `/tools/${tool.slug}`;

          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between space-y-6 shadow-sm hover:border-lime-500/50 dark:hover:border-brand/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              {/* Top Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-lime-500/10 dark:bg-brand/10 border border-lime-600/20 dark:border-brand/20 text-lime-700 dark:text-brand">
                    <Icon className="w-6 h-6" />
                  </div>
                  {tool.badge && (
                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-muted)] group-hover:text-lime-700 dark:group-hover:text-brand group-hover:border-lime-500/30 transition-colors">
                      {tool.badge}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    {tool.category || 'Developer Tool'}
                  </div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors flex items-center justify-between">
                    <span>{tool.name}</span>
                    <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 border-t border-[var(--border)]">
                <Button
                  size="sm"
                  asChild
                  variant="secondary"
                  className="w-full justify-between font-semibold group-hover:bg-lime-600 group-hover:text-white dark:group-hover:bg-brand dark:group-hover:text-[#0a0a0a] transition-colors"
                >
                  <Link href={toolHref}>
                    <span>Gunakan Tool</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

export default ToolsSpotlightSection;
