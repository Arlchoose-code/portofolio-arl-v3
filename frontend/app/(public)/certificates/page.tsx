import { getPublicCertificates, getSeoByPath } from '@/lib/api/server';
import { CertificatesSection } from '@/components/public/CertificatesSection';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoByPath('/certificates');
  const defaultTitle = 'Sertifikasi & Lisensi';
  const title = seo?.meta_title || defaultTitle;
  const description =
    seo?.meta_description || 'Sertifikasi profesional dari lembaga global seperti Anthropic, Microsoft, IBM, Meta, dan AWS.';

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

export default async function CertificatesPage() {
  const [certificates, seo] = await Promise.all([
    getPublicCertificates(),
    getSeoByPath('/certificates'),
  ]);

  const subtitleDesc =
    seo?.meta_description ||
    'Sertifikasi profesional dari lembaga global seperti Anthropic, Microsoft, IBM, Meta, Google Cloud, dan AWS yang memvalidasi keahlian di bidang rekayasa perangkat lunak dan kecerdasan buatan.';

  return (
    <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8">
      <BreadcrumbWithJsonLD items={[{ name: 'Certificates', url: '/certificates' }]} />

      <div className="space-y-3">
        <div className="text-xs font-mono font-bold uppercase tracking-widest text-lime-700 dark:text-brand">
          Validasi & Kompetensi
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-[var(--text-primary)] tracking-tight">
          Licenses & Certifications
        </h1>
        <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
          {subtitleDesc}
        </p>
      </div>

      <CertificatesSection certificates={certificates} showAll={true} />
    </div>
  );
}
