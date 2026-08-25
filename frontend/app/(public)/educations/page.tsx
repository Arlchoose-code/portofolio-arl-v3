import { getPublicEducations, getSeoByPath } from '@/lib/api/server';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { ScrollReveal, ScrollRevealItem } from '@/components/shared/ScrollReveal';
import { GraduationCap, Users, Calendar, Award } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/educations');
  const defaultTitle = 'Pendidikan & Organisasi';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description || 'Latar belakang pendidikan formal dan kepemimpinan di berbagai organisasi.';

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

export default async function EducationsPage() {
  const [allRecords, seo] = await Promise.all([
    getPublicEducations(),
    getSeoByPath('/educations'),
  ]);

  const educations = allRecords.filter((r) => r.type !== 'organization');
  const organizations = allRecords.filter((r) => r.type === 'organization');

  const subtitleDesc =
    seo?.meta_description ||
    'Latar belakang pendidikan formal di Universitas Negeri Jakarta serta kepemimpinan di berbagai organisasi teknologi dan kemahasiswaan.';

  return (
    <div className="pt-28 pb-20 max-w-5xl mx-auto px-6 space-y-16">
      <BreadcrumbWithJsonLD items={[{ name: 'Education', url: '/educations' }]} />

      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
          Akademik & Organisasi
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Education & Leadership
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          {subtitleDesc}
        </p>
      </div>

      {/* Formal Education */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider">
          <GraduationCap className="w-5 h-5" />
          <span>// Pendidikan Formal</span>
        </div>

        <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {educations.map((edu) => (
            <ScrollRevealItem key={edu.id}>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-[var(--border-hover)] transition-all h-full flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                      {edu.start_year} — {edu.is_current ? 'Present' : edu.end_year || 'Present'}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-lime-500/30 text-lime-700 dark:text-brand bg-lime-500/10 dark:bg-brand/10 font-medium">
                      Formal
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                      {edu.degree} {edu.major ? `— ${edu.major}` : ''}
                    </h3>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">{edu.institution}</p>
                  </div>

                  {edu.description && (
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{edu.description}</p>
                  )}
                </div>

                {edu.gpa && (
                  <div className="pt-3 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                    <span>IPK / GPA</span>
                    <span className="font-bold text-[var(--text-primary)]">{edu.gpa}</span>
                  </div>
                )}
              </div>
            </ScrollRevealItem>
          ))}
        </ScrollReveal>
      </section>

      {/* Organizations */}
      {organizations.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-2 text-sm font-bold font-mono text-lime-700 dark:text-brand uppercase tracking-wider">
            <Users className="w-5 h-5" />
            <span>// Pengalaman Organisasi</span>
          </div>

          <ScrollReveal className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {organizations.map((org) => (
              <ScrollRevealItem key={org.id}>
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 space-y-4 hover:border-[var(--border-hover)] transition-all h-full flex flex-col justify-between group">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-lime-700 dark:text-brand">
                        {org.start_year} — {org.is_current ? 'Present' : org.end_year || 'Present'}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-full border border-sky-500/30 text-sky-700 dark:text-sky-400 bg-sky-500/10 dark:bg-sky-400/10 font-medium">
                        Leadership
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-colors">
                        {org.degree}
                      </h3>
                      <p className="text-sm font-medium text-[var(--text-secondary)]">{org.institution}</p>
                    </div>

                    {org.description && (
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{org.description}</p>
                    )}
                  </div>
                </div>
              </ScrollRevealItem>
            ))}
          </ScrollReveal>
        </section>
      )}
    </div>
  );
}
