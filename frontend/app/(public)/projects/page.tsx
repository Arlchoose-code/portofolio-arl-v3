import { getPublicProjects, getSeoByPath } from '@/lib/api/server';
import { FeaturedProjectsSection } from '@/components/public/FeaturedProjectsSection';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/projects');
  const defaultTitle = 'Portofolio Proyek';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description || 'Kumpulan aplikasi web, sistem terdistribusi, dan model AI yang telah dibangun.';

  return {
    title: seo?.meta_title ? { absolute: seo.meta_title } : defaultTitle,
    description,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: seo?.og_image_url ? [seo.og_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
    },
  };
}

export default async function ProjectsPage() {
  const [projects, seo] = await Promise.all([
    getPublicProjects({ per_page: 100 }),
    getSeoByPath('/projects'),
  ]);

  const subtitleDesc =
    seo?.meta_description ||
    'Kumpulan aplikasi web, sistem terdistribusi, aplikasi mobile, dan model kecerdasan buatan yang telah dirancang dan dibangun.';

  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      <BreadcrumbWithJsonLD items={[{ name: 'Projects', url: '/projects' }]} />

      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
          Arsip & Eksplorasi
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          All Projects
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          {subtitleDesc}
        </p>
      </div>

      <FeaturedProjectsSection projects={projects} showAll={true} />
    </div>
  );
}
