import { MetadataRoute } from 'next';
import {
  getPublicProjects,
  getPublicToolSettings,
  getPublicGames,
  fetchServer,
} from '@/lib/api/server';
import { Page, ToolSetting, GameTool } from '@/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.arlab.my.id').replace(/\/+$/, '');

  // Base static primary routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  try {
    // 1. Dynamic Projects
    const projects = await getPublicProjects();
    if (Array.isArray(projects)) {
      projects.forEach((p) => {
        if (p.slug) {
          routes.push({
            url: `${baseUrl}/projects/${p.slug}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }

    // 2. Dynamic Web Tools & Utilities
    const toolSettings = await getPublicToolSettings();
    let gameToolSlug = 'game-checker';
    if (Array.isArray(toolSettings)) {
      toolSettings.forEach((tool: ToolSetting) => {
        if (tool.slug) {
          if (tool.tool_type === 'game-checker' || tool.slug.toLowerCase().includes('game')) {
            gameToolSlug = tool.slug;
          }
          routes.push({
            url: `${baseUrl}/tools/${tool.slug}`,
            lastModified: tool.updated_at ? new Date(tool.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
          });
        }
      });
    }

    // 3. Dynamic Game Checker Sub-Tools & Detail Games
    const games = await getPublicGames();
    if (Array.isArray(games)) {
      games.forEach((game: GameTool) => {
        if (game.slug && game.is_active) {
          routes.push({
            url: `${baseUrl}/tools/${gameToolSlug}/${game.slug}`,
            lastModified: game.updated_at ? new Date(game.updated_at) : new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
          });
        }
      });
    }

    // 4. Dynamic Pages (from DB)
    const pagesRes = await fetchServer<Page[]>('/public/pages');
    if (pagesRes.status && Array.isArray(pagesRes.data)) {
      const staticSlugs = new Set(['', 'about', 'projects', 'tools', 'certificates', 'experiences', 'skills', 'educations', 'contact']);
      pagesRes.data.forEach((page) => {
        if (page.slug && !staticSlugs.has(page.slug.toLowerCase())) {
          routes.push({
            url: `${baseUrl}/${page.slug}`,
            lastModified: page.updated_at ? new Date(page.updated_at) : new Date(),
            changeFrequency: 'monthly',
            priority: 0.7,
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to generate full comprehensive sitemap:', err);
  }

  return routes;
}
