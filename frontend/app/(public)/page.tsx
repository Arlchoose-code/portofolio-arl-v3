import {
  getPublicProjects,
  getPublicExperiences,
  getPublicSkills,
  getPublicCertificates,
  getPublicPageBySlug,
  getPublicToolSettings,
  getSeoByPath,
  getSiteInfo,
} from '@/lib/api/server';
import { HeroSection } from '@/components/public/HeroSection';
import { TechMarquee } from '@/components/shared/TechMarquee';
import { FeaturedProjectsSection } from '@/components/public/FeaturedProjectsSection';
import { ToolsSpotlightSection } from '@/components/public/ToolsSpotlightSection';
import { ExperienceSection } from '@/components/public/ExperienceSection';
import { CertificatesSection } from '@/components/public/CertificatesSection';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const [seo, siteInfo] = await Promise.all([getSeoByPath('/'), getSiteInfo()]);
  const site = siteInfo?.site;
  const siteName = site?.site_name || 'Syahril Haryono';
  const tagline = site?.tagline || 'Full Stack Developer & AI Systems Engineer';
  const title = seo?.meta_title || `${siteName} | ${tagline}`;
  const description =
    seo?.meta_description ||
    site?.description ||
    'Portofolio profesional Syahril Haryono — Full Stack Developer & AI Specialist.';

  return {
    title: { absolute: title },
    description,
    openGraph: {
      title: seo?.og_title || title,
      description: seo?.og_description || description,
      images: seo?.og_image_url ? [seo.og_image_url] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: seo?.og_title || title,
      description: seo?.og_description || description,
    },
  };
}

export default async function HomePage() {
  const [projects, experiences, skills, certificates, tools, aboutPage, siteInfo] =
    await Promise.all([
      getPublicProjects({ per_page: 100 }),
      getPublicExperiences({ per_page: 100 }),
      getPublicSkills(),
      getPublicCertificates({ per_page: 100 }),
      getPublicToolSettings(),
      getPublicPageBySlug('about'),
      getSiteInfo(),
    ]);

  const totalSkillCount = skills.reduce(
    (acc, cat) => acc + (cat.skills?.length || 0),
    0
  );

  const initialPhotoUrl =
    aboutPage?.image_url ||
    siteInfo?.site?.hero_background_url ||
    siteInfo?.site?.logo_url;

  return (
    <div className="space-y-16">
      {/* High-Tech Split Hero Banner with Portrait Photo & 3D Tilt HUD */}
      <HeroSection
        stats={{
          projectsCount: projects.length,
          experiencesCount: experiences.length,
          certificatesCount: certificates.length,
          skillsCount: totalSkillCount,
        }}
        initialPhotoUrl={initialPhotoUrl}
        skills={skills}
      />

      {/* Tech Stack Infinite Marquee */}
      <div className="border-y border-[var(--border)] bg-[var(--bg-surface)]/40">
        <TechMarquee />
      </div>

      {/* Featured Projects (Top Showcase on Homepage) */}
      <FeaturedProjectsSection
        projects={projects}
        showAll={false}
        maxHomeItems={6}
      />

      {/* Interactive Web Tools Spotlight (100% Dynamic from Database) */}
      <ToolsSpotlightSection tools={tools} />

      {/* Career & Experience Timeline Snapshot */}
      <ExperienceSection experiences={experiences} />

      {/* Licenses & Global Certifications */}
      <CertificatesSection
        certificates={certificates}
        showAll={false}
        maxHomeItems={6}
      />
    </div>
  );
}
