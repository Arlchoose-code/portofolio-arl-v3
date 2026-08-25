import { MetadataRoute } from 'next';
import { getPublicProjects, fetchServer } from '@/lib/api/server';
import { Page } from '@/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arlab.my.id';

  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/certificates`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/experiences`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/skills`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/educations`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const projects = await getPublicProjects();
    projects.forEach((p) => {
      routes.push({
        url: `${baseUrl}/projects/${p.slug}`,
        lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.8,
      });
    });

    const pagesRes = await fetchServer<Page[]>('/public/pages');
    if (pagesRes.status && pagesRes.data) {
      pagesRes.data.forEach((page) => {
        routes.push({
          url: `${baseUrl}/${page.slug}`,
          lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      });
    }
  } catch (err) {
    console.error('Failed to generate full sitemap:', err);
  }

  return routes;
}
