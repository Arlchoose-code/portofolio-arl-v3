'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { Project } from '@/types';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ExternalLink, Github, Tag } from 'lucide-react';
import Link from 'next/link';

export default function PreviewProjectPage() {
  const params = useParams();
  const id = Number(params.id);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      projectsApi.get(id).then((res) => {
        if (res.status) setProject(res.data);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return <div className="p-8 text-sm text-[var(--text-muted)] animate-pulse">Memuat preview proyek...</div>;
  if (!project) return <div className="p-8 text-sm text-red-400">Proyek tidak ditemukan.</div>;

  let stackList: string[] = [];
  if (Array.isArray(project.tech_stack)) stackList = project.tech_stack;
  else if (typeof project.tech_stack === 'string') {
    try {
      stackList = JSON.parse(project.tech_stack);
    } catch {
      stackList = project.tech_stack ? project.tech_stack.split(',') : [];
    }
  }

  return (
    <div className="w-full space-y-8">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <Button asChild variant="secondary" size="sm" className="gap-2">
          <Link href="/admin/projects">
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke List</span>
          </Link>
        </Button>

        <Button asChild variant="default" size="sm">
          <Link href={`/admin/projects/${project.id}/edit`}>Edit Proyek</Link>
        </Button>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 space-y-6">
        <div className="space-y-2">
          {project.category && (
            <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand uppercase tracking-wider">
              {project.category.name}
            </span>
          )}
          <h1 className="text-3xl font-black text-[var(--text-primary)]">{project.title}</h1>
          <p className="text-base text-[var(--text-secondary)]">{project.short_description}</p>
        </div>

        {project.images && project.images.length > 0 && (
          <div className="aspect-video w-full rounded-xl overflow-hidden bg-[var(--bg-elevated)]">
            <img
              src={`http://localhost:8080${project.images[0].original_url || project.images[0].medium_url}`}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {stackList.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stackList.map((t, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-lg text-xs font-mono bg-[var(--bg-elevated)] text-lime-800 dark:text-brand border border-[var(--border)] font-semibold shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {project.description && (
          <div
            className="prose dark:prose-invert max-w-none text-sm text-[var(--text-secondary)] border-t border-[var(--border)] pt-6"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        )}
      </div>
    </div>
  );
}
