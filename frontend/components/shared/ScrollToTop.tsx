'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function ScrollToTop() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const calculateScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100));
        setScrollProgress(Math.round(progress));
        // Show button after scrolling past 15% or 200px
        setIsVisible(scrollTop > 200 || progress > 15);
      } else {
        setIsVisible(false);
        setScrollProgress(0);
      }
    };

    // Calculate immediately and on scroll/resize
    calculateScroll();
    window.addEventListener('scroll', calculateScroll, { passive: true });
    window.addEventListener('resize', calculateScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', calculateScroll);
      window.removeEventListener('resize', calculateScroll);
    };
  }, [pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // SVG Circular progress dimensions
  const size = 46;
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;
  const isMax = scrollProgress >= 98;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 15 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed bottom-[88px] right-6 z-40"
        >
          <button
            type="button"
            onClick={scrollToTop}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label={`Scroll to top (${scrollProgress}% scrolled)`}
            className={`group relative w-14 h-14 rounded-full flex items-center justify-center bg-[var(--bg-surface)]/90 backdrop-blur-md border border-[var(--border)] shadow-xl hover:shadow-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-lime-500/50 dark:focus:ring-brand/50 ${
              isMax
                ? 'ring-2 ring-lime-600/60 dark:ring-brand/60 shadow-lime-500/10'
                : 'hover:border-lime-600/40 dark:hover:border-brand/40'
            }`}
            title={`Scroll to top (${scrollProgress}% dibaca)`}
          >
            {/* SVG Circular Scroll Progress Ring */}
            <svg
              width={size}
              height={size}
              className="absolute inset-0 m-auto -rotate-90 pointer-events-none"
            >
              {/* Background Track Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-[var(--border)] opacity-30"
                strokeWidth={strokeWidth}
                fill="none"
              />
              {/* Active Progress Circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                className="stroke-lime-600 dark:stroke-brand transition-all duration-150 ease-out"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            {/* Center Content: Percentage on hover / Arrow Icon by default */}
            <div className="relative z-10 flex flex-col items-center justify-center">
              {isHovered ? (
                <span className="text-[11px] font-mono font-bold text-lime-700 dark:text-brand tracking-tight">
                  {scrollProgress}%
                </span>
              ) : (
                <ArrowUp
                  className={`w-4 h-4 text-[var(--text-secondary)] group-hover:text-lime-700 dark:group-hover:text-brand transition-all duration-300 group-hover:-translate-y-0.5 ${
                    isMax ? 'text-lime-700 dark:text-brand animate-bounce' : ''
                  }`}
                />
              )}
            </div>

            {/* Max Bottom Reached Glow Indicator */}
            {isMax && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 dark:bg-brand opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-lime-500 dark:bg-brand text-[8px] font-black text-black items-center justify-center">
                  ✓
                </span>
              </span>
            )}
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
