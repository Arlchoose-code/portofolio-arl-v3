import { getPublicSkills, getSeoByPath } from '@/lib/api/server';
import { SkillsSection } from '@/components/public/SkillsSection';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/skills');
  const defaultTitle = 'Keahlian Teknis & Tools';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description || 'Penguasaan mendalam dalam arsitektur backend, ekosistem frontend, dan model AI & LLM.';

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

export default async function SkillsPage() {
  const [categories, seo] = await Promise.all([
    getPublicSkills(),
    getSeoByPath('/skills'),
  ]);

  const subtitleDesc =
    seo?.meta_description ||
    'Penguasaan mendalam dalam arsitektur backend, ekosistem frontend reaktif, model AI & LLM, pangkalan data, dan platform komputasi awan.';

  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      <BreadcrumbWithJsonLD items={[{ name: 'Skills', url: '/skills' }]} />

      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
          Keahlian & Penguasaan
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Technical Skills
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          {subtitleDesc}
        </p>
      </div>

      <SkillsSection categories={categories} showAll={true} />
    </div>
  );
}
