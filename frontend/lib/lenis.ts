'use client';

import Lenis from 'lenis';

let lenisInstance: Lenis | null = null;

export function initLenis(): Lenis {
  if (typeof window === 'undefined') return null as any;

  if (!lenisInstance) {
    lenisInstance = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    function raf(time: number) {
      lenisInstance?.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
  }

  return lenisInstance;
}

export function getLenis(): Lenis | null {
  return lenisInstance;
}
