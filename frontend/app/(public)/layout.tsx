import React from 'react';
import { cookies } from 'next/headers';
import { MaintenanceScreen } from '@/components/shared/MaintenanceScreen';
import { PublicLayoutClient } from '@/components/public/PublicLayoutClient';
import { getSiteInfo } from '@/lib/api/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteInfo, cookieStore] = await Promise.all([
    getSiteInfo(),
    cookies(),
  ]);

  // Check if admin is logged in (via access_token / refresh_token cookies)
  const hasAdminCookie =
    cookieStore.has('access_token') ||
    cookieStore.has('refresh_token') ||
    cookieStore.has('jwt_token') ||
    cookieStore.has('admin_token') ||
    cookieStore.has('token');

  const isMaintenance = Boolean(siteInfo?.site?.maintenance_mode);

  // Server-side instant guard: Zero flash, zero leak of content to unauthorized visitors
  if (isMaintenance && !hasAdminCookie) {
    return <MaintenanceScreen site={siteInfo?.site} socialLinks={siteInfo?.social_links} />;
  }

  return (
    <PublicLayoutClient
      siteInfo={siteInfo}
      isMaintenance={isMaintenance}
      hasAdminCookie={hasAdminCookie}
    >
      {children}
    </PublicLayoutClient>
  );
}

