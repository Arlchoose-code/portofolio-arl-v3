'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BreadcrumbWithJsonLD } from '@/components/shared/BreadcrumbWithJsonLD';
import { PasswordGeneratorTool } from '@/components/tools/PasswordGeneratorTool';
import { ToolDisabledState } from '@/components/tools/ToolDisabledState';
import { ToolSetting } from '@/types';

interface Props {
  initialSetting: ToolSetting | null;
}

export function PasswordGeneratorClient({ initialSetting }: Props) {
  const isEnabled = initialSetting ? initialSetting.is_enabled !== false : true;
  const toolName = initialSetting?.name || 'Password Generator & Strength Meter';
  const toolSlug = initialSetting?.slug || 'password-generator';

  if (!isEnabled) {
    return (
      <div className="pt-28 pb-20 max-w-6xl mx-auto px-6">
        <BreadcrumbWithJsonLD
          items={[
            { name: 'Tools', url: '/tools' },
            { name: toolName, url: `/tools/${toolSlug}` },
          ]}
        />
        <ToolDisabledState
          toolName={toolName}
          message="Layanan Password Generator sedang dinonaktifkan sementara oleh administrator."
        />
      </div>
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
        ]}
      />

      <PasswordGeneratorTool toolSetting={initialSetting} />
    </motion.div>
  );
}

export default PasswordGeneratorClient;
