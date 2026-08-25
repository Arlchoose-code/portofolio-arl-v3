'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const isTouchRef = useRef(false);

  useEffect(() => {
    // Detect touch device
    if (window.matchMedia('(pointer: coarse)').matches) {
      isTouchRef.current = true;
      return;
    }

    const cursor = cursorRef.current;
    if (!cursor) return;

    const xTo = gsap.quickTo(cursor, 'x', { duration: 0.15, ease: 'power3' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: 0.15, ease: 'power3' });

    const handleMouseMove = (e: MouseEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.getAttribute('role') === 'button'
      ) {
        gsap.to(cursor, {
          width: 44,
          height: 44,
          backgroundColor: '#ffffff',
          mixBlendMode: 'difference',
          duration: 0.2,
        });
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.getAttribute('role') === 'button'
      ) {
        gsap.to(cursor, {
          width: 8,
          height: 8,
          backgroundColor: '#ffffff',
          mixBlendMode: 'difference',
          duration: 0.2,
        });
      }
    };

    const handleIframeMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'IFRAME_MOUSE_MOVE' && typeof e.data.clientX === 'number') {
        xTo(e.data.clientX);
        yTo(e.data.clientY);
        if (e.data.isInteractive) {
          gsap.to(cursor, {
            width: 44,
            height: 44,
            backgroundColor: '#ffffff',
            mixBlendMode: 'difference',
            duration: 0.2,
          });
        } else {
          gsap.to(cursor, {
            width: 8,
            height: 8,
            backgroundColor: '#ffffff',
            mixBlendMode: 'difference',
            duration: 0.2,
          });
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('message', handleIframeMessage);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('message', handleIframeMessage);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
    };
  }, []);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
    return null;
  }

  return (
    <div
      ref={cursorRef}
      className="fixed top-0 left-0 w-2 h-2 rounded-full bg-white pointer-events-none z-[99999] -translate-x-1/2 -translate-y-1/2 mix-blend-difference hidden md:block"
      style={{ willChange: 'transform, width, height' }}
    />
  );
}
