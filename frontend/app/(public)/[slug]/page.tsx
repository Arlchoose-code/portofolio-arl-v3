import { getPublicPageBySlug, getSiteInfo } from '@/lib/api/server';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowUpRight, Mail, Sparkles, MapPin, GraduationCap } from 'lucide-react';
import { extractExcerptFromHtml } from '@/lib/seo-utils';
import { getMediaUrl } from '@/lib/utils';

interface StaticPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: StaticPageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublicPageBySlug(slug);
  if (!page) {
    return {
      title: { absolute: 'Page Not Found | Syahril Haryono' },
    };
  }

  const rawTitle = page.meta_title || page.title;
  const title = rawTitle.includes('Syahril Haryono') ? rawTitle : `${rawTitle} | Syahril Haryono`;
  const description = page.meta_description || extractExcerptFromHtml(page.content, 160) || page.title;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: page.image_url ? [page.image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: page.image_url ? [page.image_url] : undefined,
    },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function StaticPage({ params }: StaticPageProps) {
  const { slug } = await params;
  const [page, siteInfo] = await Promise.all([
    getPublicPageBySlug(slug),
    getSiteInfo(),
  ]);

  if (!page) {
    notFound();
  }

  const isAboutPage = slug === 'about';
  const profilePhoto = page.image_url || siteInfo?.site?.hero_background_url || siteInfo?.site?.logo_url;
  const siteName = siteInfo?.site?.site_name || 'Syahril Haryono';
  const tagline = siteInfo?.site?.tagline || 'Full Stack Developer | AI Enthusiast';

  return (
    <article className="pt-28 pb-20 max-w-5xl mx-auto px-6 space-y-10">
      <BreadcrumbWithJsonLD
        items={[{ name: page.title, url: `/${page.slug}` }]}
      />

      {isAboutPage ? (
        <div className="space-y-12">
          {/* Hero Profile Banner for About Page */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center border-b border-[var(--border)] pb-12">
            {/* Left Column: Crisp High-Resolution Portrait Photo Card */}
            {profilePhoto && (
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-sm">
                  {/* Subtle Ambient Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-tr from-lime-500/20 via-emerald-500/15 to-lime-500/20 rounded-3xl blur-xl opacity-75 animate-pulse" />

                  <div className="relative rounded-3xl border border-[var(--border)] bg-[var(--bg-surface)] p-2.5 shadow-xl group hover:border-lime-600/40 dark:hover:border-brand/40 transition-all duration-300">
                    <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-[var(--bg-elevated)] relative">
                      <img
                        src={getMediaUrl(profilePhoto)}
                        alt={siteName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Floating Status Pill */}
                      <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-emerald-400 border border-white/10 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Available for Work</span>
                      </div>
                    </div>

                    {/* Quick Metadata Footer */}
                    <div className="p-4 space-y-1.5">
                      <div className="font-bold text-[var(--text-primary)] text-lg">
                        {siteName}
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-mono">
                        {tagline}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-[var(--text-muted)] pt-2 border-t border-[var(--border)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                          <span>Jakarta, ID</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5 text-lime-600 dark:text-brand" />
                          <span>UNJ</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Right Column: Bio Narrative & Action CTAs */}
            <div className={profilePhoto ? 'lg:col-span-7 space-y-6' : 'lg:col-span-12 space-y-6'}>
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-lime-500/10 dark:bg-brand/10 border border-lime-600/20 dark:border-brand/20 text-xs font-semibold text-lime-700 dark:text-brand">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Profil & Rekam Jejak</span>
                </div>
                <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
                  {page.title}
                </h1>
                <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed">
                  {siteInfo?.site?.description}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" asChild className="gap-2 font-bold shadow-md">
                  <Link href="/contact">
                    <Mail className="w-4 h-4" />
                    <span>Hubungi Saya</span>
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="gap-2">
                  <Link href="/projects">
                    <span>Lihat Proyek</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Formatted Article Body */}
          <div
            className="prose dark:prose-invert max-w-none text-base leading-relaxed text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      ) : (
        <>
          <div className="space-y-4 border-b border-[var(--border)] pb-8">
            <h1 className="text-3xl sm:text-5xl font-black text-[var(--text-primary)] tracking-tight">
              {page.title}
            </h1>
          </div>

          <div
            className="prose dark:prose-invert max-w-none text-base leading-relaxed text-[var(--text-secondary)]"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </>
      )}
    </article>
  );
}
