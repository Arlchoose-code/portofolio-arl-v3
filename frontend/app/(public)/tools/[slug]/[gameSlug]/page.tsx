import { getPublicGameBySlug, getPublicToolSettings } from '@/lib/api/server';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameCheckerDetailClient } from '@/components/tools/GameCheckerDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ slug: string; gameSlug: string }>;
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
  const { slug, gameSlug } = await params;
  const game = await getPublicGameBySlug(gameSlug);

  if (!game) {
    return {
      title: { absolute: 'Game Tidak Ditemukan | Syahril Haryono' },
      description: 'Game checker tidak ditemukan.',
    };
  }

  const title = `Cek Akun & Nickname ${game.name} | Syahril Haryono`;
  const description =
    game.description ||
    `Pemeriksaan nickname dan validasi ID akun game ${game.name} secara instan, cepat, dan resmi.`;

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      images: game.icon_url ? [game.icon_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: game.icon_url ? [game.icon_url] : undefined,
    },
  };
}

export default async function DynamicGameCheckerDetailPage({ params }: PageProps) {
  const { slug, gameSlug } = await params;
  const [game, toolSetting] = await Promise.all([
    getPublicGameBySlug(gameSlug),
    findTool(slug),
  ]);

  if (!game) {
    notFound();
  }

  return <GameCheckerDetailClient game={game} toolSetting={toolSetting} />;
}
