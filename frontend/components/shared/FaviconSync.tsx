'use client';

import { useEffect } from 'react';
import { settingsApi } from '@/lib/api';
import { getMediaUrl } from '@/lib/utils';

export function FaviconSync() {
  useEffect(() => {
    const updateFavicon = (url: string) => {
      if (!url) return;
      const fullUrl = getMediaUrl(url);

      // Update or create standard icon links
      const rels = ['icon', 'shortcut icon', 'apple-touch-icon'];
      rels.forEach((rel) => {
        let link: HTMLLinkElement | null = document.querySelector(`link[rel='${rel}']`);
        if (!link) {
          link = document.createElement('link');
          link.rel = rel;
          document.head.appendChild(link);
        }
        link.href = fullUrl;
      });
    };

    const fetchAndSetFavicon = () => {
      settingsApi
        .getPublicSiteInfo()
        .then((res) => {
          if (res.status && res.data?.site?.favicon_url) {
            updateFavicon(res.data.site.favicon_url);
          }
        })
        .catch(() => {});
    };

    fetchAndSetFavicon();

    const onFocus = () => fetchAndSetFavicon();
    const onVisibility = () => {
      if (!document.hidden) fetchAndSetFavicon();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
