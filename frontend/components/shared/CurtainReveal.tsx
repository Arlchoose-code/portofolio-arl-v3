'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CurtainRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function CurtainReveal({ children, className = '', delay = 0 }: CurtainRevealProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {children}
      <motion.div
        initial={{ scaleX: 1 }}
        whileInView={{ scaleX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1], delay }}
        style={{ originX: 1 }}
        className="absolute inset-0 bg-brand/30 dark:bg-brand/20 z-20 pointer-events-none"
      />
    </div>
  );
}
