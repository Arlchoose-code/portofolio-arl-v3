import { getProjectBySlug } from '@/lib/api/server';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { CurtainReveal } from '@/components/shared/CurtainReveal';
import { Button } from '@/components/ui/Button';
import { notFound } from 'next/navigation';
import { Github, ExternalLink, ArrowLeft, Calendar, Tag } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { getMediaUrl, getAbsoluteMediaUrl } from '@/lib/utils';

interface ProjectDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) {
    return {
      title: { absolute: 'Project Not Found | Syahril Haryono' },
    };
  }

  const title = `${project.title} | Syahril Haryono`;
  const description = project.short_description || project.title;
  const ogImageUrl = project.images?.[0]?.original_url
    ? getAbsoluteMediaUrl(project.images[0].original_url)
    : undefined;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  if (!project) {
    notFound();
  }

  let stackList: string[] = [];
  if (Array.isArray(project.tech_stack)) {
    stackList = project.tech_stack;
  } else if (typeof project.tech_stack === 'string') {
    try {
      stackList = JSON.parse(project.tech_stack);
    } catch {
      stackList = project.tech_stack ? project.tech_stack.split(',').map((s) => s.trim()) : [];
    }
  }

  return (
    <article className="pt-28 pb-20 max-w-4xl mx-auto px-6 space-y-10">
      <BreadcrumbWithJsonLD
        items={[
          { name: 'Projects', url: '/projects' },
          { name: project.title, url: `/projects/${project.slug}` },
        ]}
      />

      <Link
        href="/projects"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] hover:text-lime-700 dark:hover:text-brand transition-colors font-medium"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Kembali ke Daftar Proyek</span>
      </Link>

      {/* Header */}
      <div className="space-y-4 border-b border-[var(--border)] pb-8">
        {project.category && (
          <span className="text-xs font-mono text-lime-700 dark:text-brand uppercase tracking-wider font-bold">
            {project.category.name}
          </span>
        )}
        <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
          {project.title}
        </h1>
        {project.short_description && (
          <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
            {project.short_description}
          </p>
        )}

        {/* Action Buttons & Links */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          {project.demo_url && (
            <Button asChild variant="default" className="gap-2">
              <a href={project.demo_url} target="_blank" rel="noopener noreferrer">
                <span>Kunjungi Live Demo</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          )}
          {project.repo_url && (
            <Button asChild variant="secondary" className="gap-2">
              <a href={project.repo_url} target="_blank" rel="noopener noreferrer">
                <Github className="w-4 h-4" />
                <span>Repositori Source Code</span>
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Gallery */}
      {project.images && project.images.length > 0 && (
        <div className="space-y-6">
          <CurtainReveal className="aspect-video w-full rounded-2xl overflow-hidden bg-[var(--bg-elevated)] border border-[var(--border)]">
            <img
              src={getMediaUrl(project.images[0].original_url || project.images[0].medium_url)}
              alt={project.title}
              className="w-full h-full object-cover"
            />
          </CurtainReveal>

          {project.images.length > 1 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {project.images.slice(1).map((img, idx) => (
                <div
                  key={idx}
                  className="aspect-video rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--bg-elevated)]"
                >
                  <img
                    src={getMediaUrl(img.medium_url || img.thumbnail_url)}
                    alt={img.caption || project.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tech Stack */}
      {stackList.length > 0 && (
        <div className="space-y-3 p-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)]">
          <h3 className="text-xs font-mono uppercase tracking-wider text-lime-700 dark:text-brand flex items-center gap-1.5 font-bold">
            <Tag className="w-3.5 h-3.5" />
            <span>Teknologi yang Digunakan</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {stackList.map((tech, idx) => (
              <span
                key={idx}
                className="px-3 py-1 rounded-lg text-xs font-mono border border-[var(--border)] bg-[var(--bg-elevated)] text-lime-800 dark:text-brand font-semibold shadow-sm"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Rich Description */}
      {project.description && (
        <div className="space-y-4 pt-4">
          <h2 className="text-xl font-bold text-[var(--text-primary)]">Tentang & Implementasi</h2>
          <div
            className="prose dark:prose-invert max-w-none text-sm leading-relaxed text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{ __html: project.description }}
          />
        </div>
      )}
    </article>
  );
}
