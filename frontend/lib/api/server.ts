import { ApiResponse, ApiPaginatedResponse, PublicSiteInfo, Project, Certificate, Experience, Education, SkillCategory, Page, SeoSetting, ToolSetting, GameTool } from '@/types';

const SERVER_API_URL = process.env.NEXT_SERVER_API_URL || 'http://localhost:8080/api';

export async function fetchServer<T = any>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const url = `${SERVER_API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const baseTag = cleanEndpoint.split('?')[0].replace(/[\/_]/g, '-');

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const errorText = await res.text();
      try {
        return JSON.parse(errorText);
      } catch {
        return { status: false, message: `Server returned error: ${res.statusText}`, data: null as any };
      }
    }

    return await res.json();
  } catch (err: any) {
    return { status: false, message: err?.message || 'Network error', data: null as any };
  }
}

// Server Fetchers for Public Pages
export async function getSiteInfo(): Promise<PublicSiteInfo | null> {
  const res = await fetchServer<PublicSiteInfo>('/public/settings');
  return res.status ? res.data : null;
}

export async function getPublicProjects(params?: { category?: string; featured?: boolean; per_page?: number }): Promise<Project[]> {
  const query = new URLSearchParams();
  query.set('per_page', String(params?.per_page || 100));
  if (params?.category) query.set('category', params.category);
  if (params?.featured) query.set('featured', 'true');
  const res = await fetchServer<Project[]>(`/public/projects?${query.toString()}`);
  return res.status ? res.data : [];
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  const res = await fetchServer<Project>(`/public/projects/${slug}`);
  return res.status ? res.data : null;
}

export async function getPublicCertificates(params?: { per_page?: number }): Promise<Certificate[]> {
  const perPage = params?.per_page || 100;
  const res = await fetchServer<Certificate[]>(`/public/certificates?per_page=${perPage}`);
  return res.status ? res.data : [];
}

export async function getPublicExperiences(params?: { per_page?: number }): Promise<Experience[]> {
  const perPage = params?.per_page || 100;
  const res = await fetchServer<Experience[]>(`/public/experiences?per_page=${perPage}`);
  return res.status ? res.data : [];
}

export async function getPublicEducations(type?: string): Promise<Education[]> {
  const endpoint = type ? `/public/educations?type=${type}` : '/public/educations';
  const res = await fetchServer<Education[]>(endpoint);
  return res.status ? res.data : [];
}

export async function getPublicSkills(): Promise<SkillCategory[]> {
  const res = await fetchServer<SkillCategory[]>('/public/skills');
  return res.status ? res.data : [];
}

export async function getPublicPageBySlug(slug: string): Promise<Page | null> {
  const res = await fetchServer<Page>(`/public/pages/${slug}`);
  return res.status ? res.data : null;
}

export async function getSeoByPath(path: string): Promise<SeoSetting | null> {
  const res = await fetchServer<SeoSetting>(`/public/seo?path=${encodeURIComponent(path)}`);
  return res.status ? res.data : null;
}

export async function getPublicToolSettings(): Promise<ToolSetting[]> {
  const res = await fetchServer<ToolSetting[]>('/public/tools/settings');
  return res.status ? res.data : [];
}

export async function getPublicToolSettingBySlug(slug: string): Promise<ToolSetting | null> {
  const list = await getPublicToolSettings();
  const cleanSlug = slug.toLowerCase().trim();
  return (
    list.find(
      (s) =>
        s.slug.toLowerCase() === cleanSlug ||
        (s.tool_type && s.tool_type.toLowerCase() === cleanSlug)
    ) || null
  );
}

export async function getPublicGames(): Promise<GameTool[]> {
  const res = await fetchServer<GameTool[]>('/public/tools/games');
  return res.status ? res.data : [];
}

export async function getPublicGameBySlug(slug: string): Promise<GameTool | null> {
  const res = await fetchServer<GameTool>(`/public/tools/games/${encodeURIComponent(slug)}`);
  return res.status ? res.data : null;
}

