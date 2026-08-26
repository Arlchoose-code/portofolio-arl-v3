import { getSeoByPath, getPublicPageBySlug, getSiteInfo } from '@/lib/api/server';
import { ContactClient } from '@/components/public/ContactClient';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [seo, page, siteInfo] = await Promise.all([
    getSeoByPath('/contact'),
    getPublicPageBySlug('contact'),
    getSiteInfo(),
  ]);

  const defaultTitle = page?.meta_title || page?.title || 'Hubungi Saya';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description ||
    page?.meta_description ||
    siteInfo?.site?.description ||
    'Hubungi Syahril Haryono untuk kolaborasi proyek, konsultasi teknologi, atau peluang karier.';

  const image =
    seo?.og_image_url ||
    page?.image_url ||
    siteInfo?.site?.og_image_default_url ||
    siteInfo?.site?.favicon_url;

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

export default async function ContactPage() {
  const [seo, page, siteInfo] = await Promise.all([
    getSeoByPath('/contact'),
    getPublicPageBySlug('contact'),
    getSiteInfo(),
  ]);

  return (
    <ContactClient
      seoTitle={seo?.meta_title || page?.title}
      seoDescription={seo?.meta_description || page?.meta_description}
      initialSite={siteInfo?.site}
      initialSocials={siteInfo?.social_links}
    />
  );
}
