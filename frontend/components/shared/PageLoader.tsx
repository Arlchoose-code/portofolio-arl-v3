'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only show screen wipe on fresh session
    const hasLoaded = sessionStorage.getItem('arl_has_loaded');
    if (hasLoaded) {
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(false);
      sessionStorage.setItem('arl_has_loaded', 'true');
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {loading && (
        <div className="fixed inset-0 z-[100000] pointer-events-none flex flex-col">
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="flex-1 bg-[#0a0a0a] border-b border-[var(--border)]"
          />
          <motion.div
            initial={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
            className="flex-1 bg-[#0a0a0a] border-t border-[var(--border)]"
          />
        </div>
      )}
    </AnimatePresence>
  );
}
