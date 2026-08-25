'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function ProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => {
      setNavigating(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  if (!navigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-[2.5px] z-[99999] pointer-events-none overflow-hidden">
      <div className="h-full bg-lime-600 dark:bg-brand animate-shimmer w-full shadow-[0_0_8px_rgba(101,163,13,0.8)] dark:shadow-[0_0_8px_#e8ff47]" />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <ProgressBarInner />
    </Suspense>
  );
}
