'use client';

import React from 'react';
import {
  Code2,
  Cpu,
  Database,
  Server,
  Globe,
  Layers,
  Terminal,
  Workflow,
  Boxes,
  Cloud,
  Flame,
  Sparkles,
  Bot,
  Zap,
  Shield,
  Binary,
} from 'lucide-react';

const row1 = [
  { name: 'Go (Golang)', icon: Terminal, category: 'Backend' },
  { name: 'Next.js 15', icon: Globe, category: 'Frontend' },
  { name: 'React 19', icon: Layers, category: 'Frontend' },
  { name: 'TypeScript', icon: Code2, category: 'Language' },
  { name: 'Python', icon: Binary, category: 'AI / Backend' },
  { name: 'Rust', icon: Zap, category: 'Systems' },
  { name: 'Laravel', icon: Flame, category: 'Backend' },
  { name: 'Tailwind CSS', icon: Sparkles, category: 'Design' },
  { name: 'Docker', icon: Boxes, category: 'DevOps' },
  { name: 'LLM & Ollama', icon: Bot, category: 'AI Systems' },
];

const row2 = [
  { name: 'MySQL', icon: Database, category: 'Database' },
  { name: 'PostgreSQL', icon: Database, category: 'Database' },
  { name: 'Redis', icon: Zap, category: 'Cache' },
  { name: 'Node.js', icon: Server, category: 'Runtime' },
  { name: 'PyTorch', icon: Cpu, category: 'Machine Learning' },
  { name: 'AWS Cloud', icon: Cloud, category: 'Cloud' },
  { name: 'Google Cloud', icon: Cloud, category: 'Cloud' },
  { name: 'Microservices', icon: Workflow, category: 'Architecture' },
  { name: 'API Security', icon: Shield, category: 'Security' },
  { name: 'Distributed Systems', icon: Server, category: 'Systems' },
];

export function TechMarquee() {
  return (
    <div className="w-full py-8 overflow-hidden relative flex flex-col gap-4 select-none">
      {/* Gradient masks for edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[var(--bg-base)] to-transparent z-10 pointer-events-none" />

      {/* Row 1 */}
      <div className="flex w-max gap-4 animate-[marquee1_35s_linear_infinite] hover:[animation-play-state:paused]">
        {[...row1, ...row1, ...row1].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors cursor-pointer group shadow-sm"
            >
              <Icon className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold font-sans text-[var(--text-primary)]">{item.name}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">
                {item.category}
              </span>
            </div>
          );
        })}
      </div>

      {/* Row 2 (hidden on mobile, shown on md+) */}
      <div className="hidden md:flex w-max gap-4 animate-[marquee2_35s_linear_infinite] hover:[animation-play-state:paused]">
        {[...row2, ...row2, ...row2].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-lime-500/40 dark:hover:border-brand/40 transition-colors cursor-pointer group shadow-sm"
            >
              <Icon className="w-4 h-4 text-lime-700 dark:text-brand group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold font-sans text-[var(--text-primary)]">{item.name}</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)] px-1.5 py-0.5 rounded bg-[var(--bg-elevated)]">
                {item.category}
              </span>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        @keyframes marquee1 {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        @keyframes marquee2 {
          0% {
            transform: translateX(-33.333%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
