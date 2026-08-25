'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbWithJsonLD({ items }: BreadcrumbProps) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://arlab.my.id').replace(/\/+$/, '');

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      ...items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: item.name,
        item: `${siteUrl}${item.url.startsWith('/') ? item.url : `/${item.url}`}`,
      })),
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-[var(--text-muted)] py-3">
        <Link
          href="/"
          className="flex items-center hover:text-[var(--text-primary)] transition-colors"
        >
          <Home className="w-3.5 h-3.5 mr-1" />
          <span>Home</span>
        </Link>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <React.Fragment key={index}>
              <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-60" />
              {isLast ? (
                <span className="text-[var(--text-primary)] font-medium truncate max-w-[200px]">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.url}
                  className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[150px]"
                >
                  {item.name}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </nav>
    </>
  );
}
