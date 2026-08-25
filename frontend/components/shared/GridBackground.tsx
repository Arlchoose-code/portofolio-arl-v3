'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GridBackground() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* Moving grid lines */}
      <motion.div
        animate={{ y: [0, 40] }}
        transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Floating ambient orbs */}
      <motion.div
        animate={{
          x: [0, 80, -60, 0],
          y: [0, -100, 50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/4 left-1/4 w-[450px] h-[450px] rounded-full bg-white/[0.02] dark:bg-white/[0.03] blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -70, 50, 0],
          y: [0, 90, -80, 0],
        }}
        transition={{ duration: 32, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-brand/[0.02] dark:bg-brand/[0.03] blur-[140px]"
      />
    </div>
  );
}
