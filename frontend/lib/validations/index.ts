import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
});

export const projectSchema = z.object({
  title: z.string().min(1, 'Judul project wajib diisi'),
  slug: z.string().optional(),
  short_description: z.string().optional(),
  description: z.string().optional(),
  category_id: z.number().nullable().optional(),
  tech_stack: z.array(z.string()).default([]),
  repo_url: z.string().url('URL repositori tidak valid').or(z.literal('')).optional(),
  demo_url: z.string().url('URL demo tidak valid').or(z.literal('')).optional(),
  is_featured: z.boolean().default(false),
  status: z.enum(['published', 'draft', 'archived']).default('published'),
  sort_order: z.number().default(0),
});

export const certificateSchema = z.object({
  name: z.string().min(1, 'Nama sertifikat wajib diisi'),
  issuer: z.string().min(1, 'Penerbit sertifikat wajib diisi'),
  issue_date: z.string().min(1, 'Tanggal/Tahun penerbitan wajib diisi'),
  credential_id: z.string().optional(),
  credential_url: z.string().url('URL kredensial tidak valid').or(z.literal('')).optional(),
  thumbnail_url: z.string().optional(),
  medium_url: z.string().optional(),
  original_url: z.string().optional(),
  description: z.string().optional(),
  sort_order: z.number().default(0),
});

export const experienceSchema = z.object({
  company: z.string().min(1, 'Nama perusahaan wajib diisi'),
  position: z.string().min(1, 'Posisi/Jabatan wajib diisi'),
  type: z.enum(['full-time', 'freelance', 'contract', 'internship', 'self-employed', 'part-time']),
  location: z.string().optional(),
  work_mode: z.enum(['remote', 'on-site', 'hybrid']).default('remote'),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().default(false),
  tech_stack: z.array(z.string()).default([]),
  description: z.string().optional(),
  sort_order: z.number().default(0),
});

export const educationSchema = z.object({
  institution: z.string().min(1, 'Nama institusi/organisasi wajib diisi'),
  degree: z.string().optional(),
  major: z.string().optional(),
  start_year: z.string().min(1, 'Tahun mulai wajib diisi'),
  end_year: z.string().nullable().optional(),
  is_current: z.boolean().default(false),
  gpa: z.string().nullable().optional(),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  medium_url: z.string().optional(),
  original_url: z.string().optional(),
  type: z.enum(['education', 'organization']).default('education'),
  sort_order: z.number().default(0),
});

export const skillSchema = z.object({
  name: z.string().min(1, 'Nama skill wajib diisi'),
  category_id: z.number().min(1, 'Kategori skill wajib dipilih'),
  icon_url: z.string().optional(),
  level: z.enum(['beginner', 'intermediate', 'advanced', 'expert']).default('intermediate'),
  sort_order: z.number().default(0),
});

export const pageSchema = z.object({
  title: z.string().min(1, 'Judul halaman wajib diisi'),
  slug: z.string().optional(),
  content: z.string().default(''),
  status: z.enum(['published', 'draft']).default('published'),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image_url: z.string().optional(),
  sort_order: z.number().default(0),
});

export const siteSettingSchema = z.object({
  site_name: z.string().min(1, 'Nama website wajib diisi'),
  tagline: z.string().optional(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  footer_text: z.string().optional(),
  robots_txt: z.string().optional(),
  og_image_default_url: z.string().optional(),
  google_analytics_id: z.string().optional(),
  maintenance_mode: z.boolean().default(false),
});

export const socialLinkSchema = z.object({
  platform: z.string().min(1, 'Platform wajib diisi'),
  url: z.string().url('URL tidak valid'),
  icon: z.string().optional(),
  sort_order: z.number().default(0),
  is_active: z.boolean().default(true),
});

export const aiSettingSchema = z.object({
  provider: z.enum(['ollama', 'openai_compatible']).default('ollama'),
  ollama_base_url: z.string().default('http://localhost:11434'),
  ollama_api_key: z.string().optional(),
  ollama_model: z.string().default('gemma4:31b-cloud'),
  openai_base_url: z.string().default('https://api.openai.com/v1'),
  openai_api_key: z.string().optional(),
  openai_model: z.string().default('gpt-4o'),
  active_provider: z.enum(['ollama', 'openai_compatible']).default('ollama'),
  persona_name: z.string().min(1, 'Nama persona wajib diisi'),
  persona_greeting: z.string().min(1, 'Pesan sambutan wajib diisi'),
  persona_language: z.string().default('id'),
  persona_tone: z.string().default('friendly'),
  persona_description: z.string().optional(),
  system_prompt: z.string().min(10, 'System prompt minimal 10 karakter'),
  guardrail_enabled: z.boolean().default(true),
  guardrail_message: z.string().min(1, 'Pesan guardrail wajib diisi'),
  max_history_messages: z.number().min(1).max(50).default(20),
  max_messages_per_hour: z.number().min(1).max(200).default(30),
});
