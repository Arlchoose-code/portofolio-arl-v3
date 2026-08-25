import {
  getPublicExperiences,
  getPublicSkills,
  getPublicCertificates,
  getPublicEducations,
  getPublicPageBySlug,
  getSiteInfo,
  getSeoByPath,
} from '@/lib/api/server';
import { AboutClient } from '@/components/public/AboutClient';
import { extractExcerptFromHtml } from '@/lib/seo-utils';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [seo, page, siteInfo] = await Promise.all([
    getSeoByPath('/about'),
    getPublicPageBySlug('about'),
    getSiteInfo(),
  ]);

  const defaultTitle = page?.meta_title || page?.title || 'Tentang & Kualifikasi Profesional';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description ||
    page?.meta_description ||
    extractExcerptFromHtml(page?.content, 160) ||
    siteInfo?.site?.description ||
    'Profil profesional, rekam jejak karier, keahlian teknis, sertifikasi global, dan riwayat pendidikan Syahril Haryono.';

  const image = page?.image_url || siteInfo?.site?.hero_background_url || seo?.og_image_url;

  return {
    title: { absolute: title.includes('Syahril Haryono') ? title : `${title} | Syahril Haryono` },
    description,
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function AboutPage() {
  const [experiences, skills, certificates, educations, aboutPage, siteInfo, seo] = await Promise.all([
    getPublicExperiences({ per_page: 100 }),
    getPublicSkills(),
    getPublicCertificates({ per_page: 100 }),
    getPublicEducations(),
    getPublicPageBySlug('about'),
    getSiteInfo(),
    getSeoByPath('/about'),
  ]);

  return (
    <AboutClient
      experiences={experiences}
      skills={skills}
      certificates={certificates}
      educations={educations}
      aboutPage={aboutPage}
      siteSetting={siteInfo?.site}
      seoTitle={seo?.meta_title || aboutPage?.title}
      seoDescription={seo?.meta_description || aboutPage?.meta_description}
    />
  );
}
