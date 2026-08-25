import { getPublicToolSettingBySlug, getPublicToolSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { QRISManipulatorClient } from '@/components/tools/QRISManipulatorClient';
import { GameCheckerClient } from '@/components/tools/GameCheckerClient';
import { YouTubeDownloaderClient } from '@/components/tools/YouTubeDownloaderClient';
import { TwoFactorClient } from '@/components/tools/TwoFactorClient';
import { Base64Client } from '@/components/tools/Base64Client';
import { PasswordGeneratorClient } from '@/components/tools/PasswordGeneratorClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string }>;
}

const slugify = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

async function findTool(slug: string) {
  const clean = slug.toLowerCase().trim();
  const all = await getPublicToolSettings();
  if (!all || all.length === 0) return null;

  return (
    all.find((s) => s.slug.toLowerCase() === clean) ||
    all.find((s) => s.tool_type && s.tool_type.toLowerCase() === clean) ||
    all.find((s) => slugify(s.name) === clean) ||
    all.find((s) => clean.includes(s.slug.toLowerCase())) ||
    all.find((s) => s.tool_type && clean.includes(s.tool_type.toLowerCase())) ||
    null
  );
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const setting = await findTool(slug);

  if (!setting) {
    return {
      title: { absolute: 'Tool Tidak Ditemukan | Syahril Haryono' },
      description: 'Halaman tool tidak ditemukan.',
    };
  }

  const title = `${setting.name} | Syahril Haryono`;
  const description = setting.description || `Gunakan tool ${setting.name} secara gratis, cepat, dan aman online.`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Syahril Haryono Portfolio',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function DynamicToolPage({ params }: PageProps) {
  const { slug } = await params;
  const setting = await findTool(slug);

  if (!setting) {
    notFound();
  }

  const toolType = setting.tool_type || setting.slug;

  if (toolType === 'qris-manipulator' || toolType.includes('qris')) {
    return <QRISManipulatorClient initialSetting={setting} />;
  }

  if (toolType === 'game-checker' || toolType.includes('game')) {
    return <GameCheckerClient initialSetting={setting} />;
  }

  if (toolType === 'youtube-downloader' || toolType.includes('youtube')) {
    return <YouTubeDownloaderClient initialSetting={setting} />;
  }

  if (
    toolType === '2fa-generator' ||
    toolType.includes('2fa') ||
    toolType.includes('totp') ||
    toolType.includes('authenticator')
  ) {
    return <TwoFactorClient initialSetting={setting} />;
  }

  if (toolType === 'base64' || toolType.includes('base64')) {
    return <Base64Client initialSetting={setting} />;
  }

  if (toolType === 'password-generator' || toolType.includes('password')) {
    return <PasswordGeneratorClient initialSetting={setting} />;
  }

  // Fallback to QRIS if unknown
  return <QRISManipulatorClient initialSetting={setting} />;
}
