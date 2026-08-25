export * from './common';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectCategory {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectImage {
  id: number;
  project_id: number;
  thumbnail_url: string;
  medium_url: string;
  original_url: string;
  caption?: string;
  sort_order: number;
}

export interface Project {
  id: number;
  title: string;
  slug: string;
  short_description?: string;
  description?: string;
  category_id?: number;
  category?: ProjectCategory;
  tech_stack: string | string[]; // JSON string or parsed array
  repo_url?: string;
  demo_url?: string;
  is_featured: boolean;
  status: 'published' | 'draft' | 'archived';
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  images?: ProjectImage[];
}

export interface Certificate {
  id: number;
  name: string;
  issuer: string;
  issue_date: string;
  credential_id?: string;
  credential_url?: string;
  thumbnail_url?: string;
  medium_url?: string;
  original_url?: string;
  description?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Experience {
  id: number;
  company: string;
  position: string;
  type: 'full-time' | 'freelance' | 'contract' | 'internship' | 'self-employed' | 'part-time';
  location?: string;
  work_mode: 'remote' | 'on-site' | 'hybrid';
  start_date: string;
  end_date?: string | null;
  is_current: boolean;
  tech_stack?: string | string[];
  description?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface Education {
  id: number;
  institution: string;
  degree?: string;
  major?: string;
  field_of_study?: string;
  start_year: string;
  end_year?: string | null;
  is_current: boolean;
  gpa?: string | null;
  grade?: string | null;
  description?: string;
  thumbnail_url?: string;
  medium_url?: string;
  original_url?: string;
  type: 'education' | 'organization';
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface SkillCategory {
  id: number;
  name: string;
  sort_order: number;
  skills?: Skill[];
}

export interface Skill {
  id: number;
  name: string;
  category_id: number;
  category?: SkillCategory;
  icon_url?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  sort_order: number;
}

export interface Media {
  id: number;
  filename: string;
  original_name: string;
  thumbnail_url: string;
  medium_url: string;
  original_url: string;
  mime_type: string;
  size_bytes: number;
  width: number;
  height: number;
  created_at?: string;
}

export interface Page {
  id: number;
  title: string;
  slug: string;
  content: string;
  image_url?: string;
  status: 'published' | 'draft';
  meta_title?: string;
  meta_description?: string;
  og_image_url?: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject?: string;
  message: string;
  ip_address?: string;
  user_agent?: string;
  is_read: boolean;
  status: 'unread' | 'read' | 'archived' | 'replied';
  created_at: string;
  updated_at?: string;
}

export interface SiteSetting {
  id: number;
  site_name: string;
  title_separator?: string;
  tagline?: string;
  description?: string;
  logo_url?: string;
  hero_background_url?: string;
  favicon_url?: string;
  footer_text?: string;
  robots_txt?: string;
  og_image_default_url?: string;
  google_analytics_id?: string;
  available_status?: string;
  available_badge_text?: string;
  custom_badge_text?: string;
  turnstile_enabled?: boolean;
  turnstile_site_key?: string;
  turnstile_secret_key?: string;
  maintenance_mode: boolean;
}

export interface SocialLink {
  id: number;
  platform: string;
  url: string;
  icon?: string;
  sort_order: number;
  is_active: boolean;
}

export interface SeoSetting {
  id?: number;
  path: string;
  meta_title?: string;
  meta_description?: string;
  og_title?: string;
  og_description?: string;
  og_image_url?: string;
  canonical?: string;
  json_ld?: string;
}

export interface AISetting {
  id?: number;
  provider: 'ollama' | 'openai_compatible';
  ollama_base_url: string;
  ollama_api_key_masked?: string;
  ollama_api_key?: string;
  ollama_model: string;
  ollama_available_models: string[];
  openai_base_url: string;
  openai_api_key_masked?: string;
  openai_api_key?: string;
  openai_model: string;
  active_provider: 'ollama' | 'openai_compatible';
  persona_name: string;
  persona_greeting: string;
  persona_language: string;
  persona_tone: string;
  persona_description: string;
  system_prompt: string;
  guardrail_enabled: boolean;
  guardrail_message: string;
  max_history_messages: number;
  max_messages_per_hour: number;
}

export interface ChatMessage {
  id?: number;
  session_id?: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  is_rejected?: boolean;
  thinking_steps?: string;
  created_at?: string;
}

export interface ChatSession {
  id: number;
  session_key: string;
  ip_address?: string;
  user_agent?: string;
  messages_this_hour: number;
  created_at: string;
  last_activity_at: string;
  messages?: ChatMessage[];
}

export interface ThinkingStep {
  action: string;
  label: string;
}

export interface PublicSiteInfo {
  site: SiteSetting;
  social_links: SocialLink[];
  chatbot?: {
    persona_name?: string;
    persona_greeting?: string;
    persona_language?: string;
    persona_tone?: string;
    persona_description?: string;
  };
}

export interface EmailThread {
  id: number;
  subject: string;
  snippet: string;
  last_message_at: string;
  message_count: number;
  has_unread: boolean;
  is_starred: boolean;
  is_archived: boolean;
  is_trash: boolean;
  messages?: EmailMessage[];
  created_at: string;
  updated_at?: string;
}

export interface EmailMessage {
  id: number;
  thread_id: number;
  direction: 'inbound' | 'outbound';
  from_email: string;
  from_name?: string;
  to_email: string;
  to_name?: string;
  cc?: string;
  bcc?: string;
  subject: string;
  body_html: string;
  body_text?: string;
  message_id?: string;
  in_reply_to?: string;
  status: 'inbox' | 'sent' | 'draft' | 'trash';
  is_read: boolean;
  is_starred: boolean;
  is_trash: boolean;
  created_at: string;
  updated_at?: string;
}

export interface EmailSetting {
  id?: number;
  active_provider?: 'brevo' | 'resend' | 'hybrid';
  brevo_api_key?: string;
  brevo_api_key_masked?: string;
  resend_api_key?: string;
  resend_api_key_masked?: string;
  default_sender_email: string;
  default_sender_name: string;
  inbound_domain?: string;
  is_configured: boolean;
}

export interface MailboxStats {
  unread_count: number;
  inbox_count: number;
  sent_count: number;
  starred_count: number;
  trash_count: number;
}

export interface ToolSetting {
  id: number;
  slug: string;
  tool_type?: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  is_enabled: boolean;
  is_popular?: boolean;
  badge?: string;
  badge_color?: string;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GameServerOption {
  label: string;
  value: string;
}

export interface GameTool {
  id: number;
  name: string;
  slug: string;
  game_code: string;
  icon_url?: string;
  description?: string;
  category?: string;
  user_id_label: string;
  user_id_placeholder?: string;
  has_zone_id: boolean;
  zone_id_label?: string;
  zone_id_placeholder?: string;
  has_server_list: boolean;
  server_options?: string; // JSON string e.g. '[{"label":"Asia","value":"os_asia"}]'
  guide_text?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
}

export interface GameCheckResult {
  game_code: string;
  game_name?: string;
  user_id: string;
  zone_id?: string;
  nickname: string;
}

export interface YouTubeConvertResult {
  title: string;
  format: 'mp4' | 'mp3' | string;
  video_id: string;
  download_url: string;
  thumbnail: string;
}

