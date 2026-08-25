import { getPublicExperiences, getSeoByPath } from '@/lib/api/server';
import { ExperienceSection } from '@/components/public/ExperienceSection';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/experiences');
  const defaultTitle = 'Pengalaman Kerja';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description || 'Jejak pengalaman kerja profesional sebagai Full Stack Developer di berbagai proyek.';

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

export default async function ExperiencesPage() {
  const [experiences, seo] = await Promise.all([
    getPublicExperiences(),
    getSeoByPath('/experiences'),
  ]);

  const subtitleDesc =
    seo?.meta_description ||
    'Jejak pengalaman kerja profesional sebagai Full Stack Developer, Mobile Developer, dan IT Support di berbagai proyek nasional dan mancanegara.';

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-6 space-y-8">
      <BreadcrumbWithJsonLD items={[{ name: 'Experiences', url: '/experiences' }]} />

      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
          Riwayat & Karier
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Work Experience
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          {subtitleDesc}
        </p>
      </div>

      <ExperienceSection experiences={experiences} showAll={true} />
    </div>
  );
}
