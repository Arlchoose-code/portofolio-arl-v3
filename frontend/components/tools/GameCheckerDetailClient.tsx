'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { GameCheckerTool } from '@/components/tools/GameCheckerTool';
import { ToolDisabledState } from '@/components/tools/ToolDisabledState';
import { GameTool, ToolSetting } from '@/types';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  game: GameTool | null;
  toolSetting: ToolSetting | null;
}

export function GameCheckerDetailClient({ game, toolSetting }: Props) {
  const isToolEnabled = toolSetting ? toolSetting.is_enabled !== false : true;

  const toolName = toolSetting?.name || 'Cek Nickname Game Online';
  const toolSlug = toolSetting?.slug || 'game-checker';

  if (!isToolEnabled) {
    return (
      <div className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-6">
        <BreadcrumbWithJsonLD
          items={[
            { name: 'Tools', url: '/tools' },
            { name: toolName, url: `/tools/${toolSlug}` },
          ]}
        />
        <ToolDisabledState
          toolName={toolName}
          message="Layanan Cek Nickname Game sedang dinonaktifkan sementara oleh administrator."
        />
      </div>
    );
  }

  if (!game || !game.is_active) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pt-28 pb-20 max-w-4xl mx-auto px-6 text-center space-y-6"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto text-2xl font-bold">
          <Gamepad2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Game Tidak Ditemukan</h1>
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Game yang Anda cari tidak tersedia atau sedang dinonaktifkan sementara.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/tools/${toolSlug}`} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Pilih Game Lain</span>
          </Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="pt-28 pb-20 max-w-6xl mx-auto px-6 space-y-8"
    >
      <BreadcrumbWithJsonLD
        items={[
          { name: 'Tools', url: '/tools' },
          { name: toolName, url: `/tools/${toolSlug}` },
          { name: game.name, url: `/tools/${toolSlug}/${game.slug}` },
        ]}
      />

      <GameCheckerTool initialSlug={game.slug} toolSetting={toolSetting} isStandalonePage={false} />
    </motion.div>
  );
}

export default GameCheckerDetailClient;
