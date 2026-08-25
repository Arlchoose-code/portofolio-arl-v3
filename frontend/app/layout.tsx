import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/shared/ThemeProvider';
import { Toaster } from 'sonner';
import { CustomCursor } from '@/components/shared/CustomCursor';
import { PageLoader } from '@/components/shared/PageLoader';
import { RouteProgressBar } from '@/components/shared/RouteProgressBar';
import { FaviconSync } from '@/components/shared/FaviconSync';
import { getSiteInfo } from '@/lib/api/server';

const geistSans = Geist({
  variable: '--font-geist',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata(): Promise<Metadata> {
  const siteInfo = await getSiteInfo();
  const site = siteInfo?.site;
  const siteName = site?.site_name || 'Syahril Haryono';
  const separator = site?.title_separator || '|';
  const tagline = site?.tagline || 'Full Stack Developer | AI Enthusiast';
  const desc =
    site?.description ||
    'Portofolio profesional Syahril Haryono — Full Stack Developer & AI Enthusiast.';
  const favicon = site?.favicon_url || '';
  const ogImage = site?.og_image_default_url || site?.logo_url || site?.favicon_url || '';

  const formattedFavicon = favicon
    ? favicon.startsWith('http')
      ? favicon
      : `http://localhost:8080${favicon}`
    : undefined;

  const formattedOgImage = ogImage
    ? ogImage.startsWith('http')
      ? ogImage
      : `http://localhost:8080${ogImage}`
    : undefined;

  return {
    title: {
      default: `${siteName} ${separator} ${tagline}`,
      template: `%s ${separator} ${siteName}`,
    },
    description: desc,
    keywords: [
      siteName,
      'Full Stack Developer',
      'AI Engineer',
      'Next.js',
      'Go Developer',
      'Portfolio',
    ],
    authors: [{ name: siteName }],
    creator: siteName,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
    icons: formattedFavicon ? { icon: formattedFavicon, shortcut: formattedFavicon, apple: formattedFavicon } : undefined,
    openGraph: {
      type: 'website',
      locale: 'id_ID',
      title: `${siteName} ${separator} ${tagline}`,
      description: desc,
      siteName: siteName,
      images: formattedOgImage ? [{ url: formattedOgImage }] : [],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)] antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <PageLoader />
          <CustomCursor />
          <RouteProgressBar />
          <FaviconSync />
          {children}
          <Toaster
            position="bottom-right"
            theme="dark"
            toastOptions={{
              style: {
                background: '#111111',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#f5f5f5',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
