import { getSeoByPath, getPublicToolSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { ToolsHubClient } from '@/components/public/ToolsHubClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/tools');
  const title = seo?.meta_title || 'Pusat Tools & Utilitas Praktis';
  const description =
    seo?.meta_description ||
    'Kumpulan perkakas daring gratis yang cepat, aman, dan tanpa iklan: QRIS Price Manipulator, Cek Nickname Game Online, YouTube Downloader, 2FA Authenticator, Base64 Converter, dan Password Generator.';

  return {
    title: seo?.meta_title ? { absolute: seo.meta_title } : 'Pusat Tools & Utilitas Praktis',
    description,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: seo?.og_image_url ? [seo.og_image_url] : undefined,
    },
  };
}

export default async function ToolsHubPage() {
  const [seo, initialToolSettings] = await Promise.all([
    getSeoByPath('/tools'),
    getPublicToolSettings(),
  ]);

  return (
    <ToolsHubClient
      seoTitle={seo?.meta_title}
      seoDescription={seo?.meta_description}
      initialToolSettings={initialToolSettings}
    />
  );
}
