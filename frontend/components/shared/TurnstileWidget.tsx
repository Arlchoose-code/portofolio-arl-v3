'use client';

import React, { useEffect, useRef, useState } from 'react';

interface TurnstileWidgetProps {
  siteKey?: string;
  onSuccess: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
  theme?: 'auto' | 'light' | 'dark';
  className?: string;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'auto' | 'light' | 'dark';
          size?: 'normal' | 'compact' | 'flexible';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onloadTurnstileCallback?: () => void;
  }
}

export function TurnstileWidget({
  siteKey,
  onSuccess,
  onError,
  onExpire,
  theme = 'auto',
  className = '',
}: TurnstileWidgetProps) {
  const effectiveSiteKey = siteKey || process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);

  useEffect(() => {
    if (!effectiveSiteKey) return;

    // Check if script already exists
    const scriptId = 'cf-turnstile-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        setIsScriptLoaded(true);
      };
      document.head.appendChild(script);
    } else if (window.turnstile) {
      setIsScriptLoaded(true);
    } else {
      script.addEventListener('load', () => setIsScriptLoaded(true));
    }
  }, [effectiveSiteKey]);

  useEffect(() => {
    if (!isScriptLoaded || !window.turnstile || !containerRef.current || !effectiveSiteKey) return;

    // If a widget was already rendered, remove it first
    if (widgetIdRef.current) {
      try {
        window.turnstile.remove(widgetIdRef.current);
      } catch {
        // Ignore removal error
      }
    }

    try {
      const widgetId = window.turnstile.render(containerRef.current, {
        sitekey: effectiveSiteKey,
        callback: (token: string) => {
          onSuccess(token);
        },
        'error-callback': () => {
          if (onError) onError();
        },
        'expired-callback': () => {
          if (onExpire) onExpire();
        },
        theme,
        size: 'flexible',
      });

      widgetIdRef.current = widgetId;
    } catch {
      // Ignore rendering error
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal error
        }
        widgetIdRef.current = null;
      }
    };
  }, [isScriptLoaded, effectiveSiteKey, theme]);

  if (!effectiveSiteKey) return null;

  return (
    <div className={`min-h-[65px] flex items-center justify-center my-2 ${className}`}>
      <div ref={containerRef} />
    </div>
  );
}
