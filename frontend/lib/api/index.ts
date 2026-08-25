import { client } from './client';
import {
  Project,
  ProjectCategory,
  Certificate,
  Experience,
  Education,
  Skill,
  SkillCategory,
  Media,
  Page,
  SiteSetting,
  SocialLink,
  SeoSetting,
  AISetting,
  ChatSession,
  ChatMessage,
  ContactMessage,
  EmailThread,
  EmailMessage,
  EmailSetting,
  MailboxStats,
  User,
  PaginationParams,
  PublicSiteInfo,
  ThinkingStep,
  GameTool,
  ToolSetting,
  GameCheckResult,
  YouTubeConvertResult,
} from '@/types';

// Auth
export const authApi = {
  login: (credentials: { email: string; password: string; cf_turnstile_token?: string }) =>
    client.post<{ user: User; access_token: string }>('admin/auth/login', credentials),
  logout: () => client.post('admin/auth/logout'),
  me: () => client.get<User>('admin/auth/me'),
  refresh: () => client.post<{ access_token: string }>('admin/auth/refresh'),
};

// Projects
export const projectsApi = {
  list: (params?: PaginationParams & { category?: string; featured?: boolean }) =>
    client.getPaginated<Project>('admin/projects', params),
  get: (id: number) => client.get<Project>(`admin/projects/${id}`),
  create: (data: Partial<Project>) => client.post<Project>('admin/projects', data),
  update: (id: number, data: Partial<Project>) => client.put<Project>(`admin/projects/${id}`, data),
  delete: (id: number) => client.delete(`admin/projects/${id}`),
  listCategories: () => client.get<ProjectCategory[]>('admin/project-categories'),
  createCategory: (data: Partial<ProjectCategory>) => client.post<ProjectCategory>('admin/project-categories', data),
  updateCategory: (id: number, data: Partial<ProjectCategory>) =>
    client.put<ProjectCategory>(`admin/project-categories/${id}`, data),
  deleteCategory: (id: number) => client.delete(`admin/project-categories/${id}`),
  addImage: (id: number, data: any) => client.post(`admin/projects/${id}/images`, data),
  deleteImage: (id: number, imageId: number) => client.delete(`admin/projects/${id}/images/${imageId}`),
};

// Certificates
export const certificatesApi = {
  list: (params?: PaginationParams) => client.getPaginated<Certificate>('admin/certificates', params),
  get: (id: number) => client.get<Certificate>(`admin/certificates/${id}`),
  create: (data: Partial<Certificate>) => client.post<Certificate>('admin/certificates', data),
  update: (id: number, data: Partial<Certificate>) => client.put<Certificate>(`admin/certificates/${id}`, data),
  delete: (id: number) => client.delete(`admin/certificates/${id}`),
};

// Experiences
export const experiencesApi = {
  list: (params?: PaginationParams) => client.getPaginated<Experience>('admin/experiences', params),
  get: (id: number) => client.get<Experience>(`admin/experiences/${id}`),
  create: (data: Partial<Experience>) => client.post<Experience>('admin/experiences', data),
  update: (id: number, data: Partial<Experience>) => client.put<Experience>(`admin/experiences/${id}`, data),
  delete: (id: number) => client.delete(`admin/experiences/${id}`),
};

// Educations
export const educationsApi = {
  list: (params?: PaginationParams & { type?: string }) => client.getPaginated<Education>('admin/educations', params),
  get: (id: number) => client.get<Education>(`admin/educations/${id}`),
  create: (data: Partial<Education>) => client.post<Education>('admin/educations', data),
  update: (id: number, data: Partial<Education>) => client.put<Education>(`admin/educations/${id}`, data),
  delete: (id: number) => client.delete(`admin/educations/${id}`),
};

// Skills
export const skillsApi = {
  list: (params?: PaginationParams) => client.getPaginated<Skill>('admin/skills', params),
  get: (id: number) => client.get<Skill>(`admin/skills/${id}`),
  create: (data: Partial<Skill>) => client.post<Skill>('admin/skills', data),
  update: (id: number, data: Partial<Skill>) => client.put<Skill>(`admin/skills/${id}`, data),
  delete: (id: number) => client.delete(`admin/skills/${id}`),
  listCategories: () => client.get<SkillCategory[]>('admin/skill-categories'),
  createCategory: (data: Partial<SkillCategory>) => client.post<SkillCategory>('admin/skill-categories', data),
  updateCategory: (id: number, data: Partial<SkillCategory>) =>
    client.put<SkillCategory>(`admin/skill-categories/${id}`, data),
  deleteCategory: (id: number) => client.delete(`admin/skill-categories/${id}`),
};

// Media
export const mediaApi = {
  list: (params?: PaginationParams) => client.getPaginated<Media>('admin/media', params),
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.upload<Media>('admin/media/upload', formData);
  },
  delete: (id: number) => client.delete(`admin/media/${id}`),
};

// Pages
export const pagesApi = {
  list: (params?: PaginationParams) => client.getPaginated<Page>('admin/pages', params),
  get: (id: number) => client.get<Page>(`admin/pages/${id}`),
  create: (data: Partial<Page>) => client.post<Page>('admin/pages', data),
  update: (id: number, data: Partial<Page>) => client.put<Page>(`admin/pages/${id}`, data),
  delete: (id: number) => client.delete(`admin/pages/${id}`),
};

// Site & SEO Settings
export const settingsApi = {
  getSiteSetting: () => client.get<SiteSetting>('admin/site-settings'),
  updateSiteSetting: (data: Partial<SiteSetting>) => client.put<SiteSetting>('admin/site-settings', data),
  getPublicSiteInfo: () => client.get<PublicSiteInfo>('public/settings'),
  listSocialLinks: () => client.get<SocialLink[]>('admin/social-links'),
  createSocialLink: (data: Partial<SocialLink>) => client.post<SocialLink>('admin/social-links', data),
  updateSocialLink: (id: number, data: Partial<SocialLink>) => client.put<SocialLink>(`admin/social-links/${id}`, data),
  deleteSocialLink: (id: number) => client.delete(`admin/social-links/${id}`),
  getSeoSettings: () => client.get<SeoSetting[]>('admin/seo-settings'),
  getSeoSettingByPath: (path: string) => client.get<SeoSetting>(`admin/seo-settings/by-path?path=${encodeURIComponent(path)}`),
  getPublicSeo: (path: string) => client.get<SeoSetting>(`public/seo?path=${encodeURIComponent(path)}`),
  upsertSeoSetting: (data: Partial<SeoSetting>) => client.post<SeoSetting>('admin/seo-settings', data),
};

// AI & Chat
export const aiApi = {
  getSettings: () => client.get<AISetting>('admin/ai-settings'),
  updateSettings: (data: Partial<AISetting>) => client.put('admin/ai-settings', data),
  listChatSessions: (params?: PaginationParams) => client.getPaginated<ChatSession>('admin/chat-sessions', params),
  getChatSession: (id: number) => client.get<ChatSession>(`admin/chat-sessions/${id}`),
  deleteChatSession: (id: number) => client.delete(`admin/chat-sessions/${id}`),
  deleteAllChatSessions: () => client.delete('admin/chat-sessions'),
};

// Contacts & Inquiries
export const publicContactApi = {
  submit: (data: { name: string; email: string; subject?: string; message: string; honeypot?: string }) =>
    client.post<{ id: number; created_at: string }>('public/contact', data),
};

export const contactsApi = {
  list: (params?: PaginationParams & { search?: string; status?: string; is_read?: string }) =>
    client.getPaginated<ContactMessage>('admin/contacts', params),
  get: (id: number) => client.get<ContactMessage>(`admin/contacts/${id}`),
  updateStatus: (id: number, data: { is_read?: boolean; status?: string }) =>
    client.put<ContactMessage>(`admin/contacts/${id}/status`, data),
  delete: (id: number) => client.delete(`admin/contacts/${id}`),
  getStats: () => client.get<{ unread_count: number; total_count: number }>('admin/contacts/stats'),
};

// Users Management
export const usersApi = {
  list: (params?: PaginationParams & { role?: string }) => client.getPaginated<User>('admin/users', params),
  get: (id: number) => client.get<User>(`admin/users/${id}`),
  create: (data: { name: string; email: string; password: string; role?: string }) =>
    client.post<User>('admin/users', data),
  update: (id: number, data: { name: string; email: string; role?: string; password?: string }) =>
    client.put<User>(`admin/users/${id}`, data),
  delete: (id: number) => client.delete(`admin/users/${id}`),
};

// Webmail & Mailbox (Brevo / Resend)
export const mailboxApi = {
  listThreads: (params?: PaginationParams & { folder?: string; account?: string }) =>
    client.getPaginated<EmailThread>('admin/mailbox/threads', params),
  getThread: (id: number) => client.get<EmailThread>(`admin/mailbox/threads/${id}`),
  send: (data: {
    sender_email?: string;
    sender_name?: string;
    reply_to_email?: string;
    reply_to_name?: string;
    to_email: string;
    to_name?: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body_html: string;
    body_text?: string;
    attachments?: import('@/types').EmailAttachment[];
  }) => client.post<{ thread_id: number; message_id: string; sender?: string }>('admin/mailbox/send', data),
  reply: (data: {
    thread_id: number;
    sender_email?: string;
    sender_name?: string;
    body_html: string;
    body_text?: string;
    attachments?: import('@/types').EmailAttachment[];
  }) => client.post<{ thread_id: number; message_id: string; sender?: string }>('admin/mailbox/reply', data),
  uploadAttachment: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post<import('@/types').EmailAttachment>('admin/mailbox/attachments', formData);
  },
  updateStatus: (id: number, data: { is_read?: boolean; is_starred?: boolean; is_trash?: boolean }) =>
    client.put<EmailThread>(`admin/mailbox/threads/${id}/status`, data),
  deleteThread: (id: number) => client.delete(`admin/mailbox/threads/${id}`),
  getStats: (account?: string) =>
    client.get<MailboxStats>(account && account !== 'all' ? `admin/mailbox/stats?account=${encodeURIComponent(account)}` : 'admin/mailbox/stats'),
  getSenders: () =>
    client.get<{
      senders: import('@/types').SenderItem[];
      default_sender_email: string;
      default_sender_name: string;
      reply_to_email?: string;
      reply_to_name?: string;
      allowed_inbound_emails?: string;
    }>('admin/mailbox/senders'),
  addSender: (data: { name: string; email: string }) =>
    client.post<{ senders: import('@/types').SenderItem[] }>('admin/mailbox/senders', data),
  deleteSender: (idOrEmail: number | string) =>
    client.delete<{ senders: import('@/types').SenderItem[] }>(
      typeof idOrEmail === 'number'
        ? `admin/mailbox/senders/${idOrEmail}`
        : `admin/mailbox/senders/0?email=${encodeURIComponent(idOrEmail)}`
    ),
  setDefaultSender: (data: { email: string; name?: string }) =>
    client.put<{
      senders: import('@/types').SenderItem[];
      default_sender_email: string;
      default_sender_name: string;
    }>('admin/mailbox/senders/default', data),
  syncBrevoSenders: () =>
    client.post<{ senders: import('@/types').SenderItem[] }>('admin/mailbox/sync-senders', {}),
  getSettings: () => client.get<EmailSetting>('admin/mailbox/settings'),
  updateSettings: (data: Partial<EmailSetting>) => client.put<EmailSetting>('admin/mailbox/settings', data),
};

// Password Reset via Brevo
export const authResetApi = {
  forgotPassword: (email: string, cf_turnstile_token?: string) =>
    client.post<{ reset_link_dev?: string }>('admin/auth/forgot-password', { email, cf_turnstile_token }),
  resetPassword: (token: string, password: string) =>
    client.post('admin/auth/reset-password', { token, password }),
};

// Public Chat Client Helper
export const chatApi = {
  createSession: () => client.post<{ session_key: string }>('public/chat/session'),
  getHistory: (sessionKey: string) => client.get<ChatMessage[]>(`public/chat/history?session_key=${sessionKey}`),
  deleteSession: (sessionKey: string) => client.delete(`public/chat/session?session_key=${sessionKey}`),
  deleteHistory: (sessionKey: string) => client.delete(`public/chat/session?session_key=${sessionKey}`),
  streamMessage: async (
    sessionKey: string,
    message: string,
    onThinking: (step: ThinkingStep) => void,
    onToken: (token: string) => void,
    onComplete: (data: { is_rejected?: boolean; full_response?: string }) => void,
    onError: (err: Error) => void
  ) => {
    try {
      const res = await fetch('/api/proxy/public/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          session_key: sessionKey,
          message: message,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}: ${res.statusText}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No readable stream available');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) {
            currentEvent = 'message';
            continue;
          }

          if (trimmed.startsWith('event:')) {
            currentEvent = trimmed.replace(/^event:\s*/, '').trim();
            continue;
          }

          if (trimmed.startsWith('data:')) {
            const jsonStr = trimmed.replace(/^data:\s*/, '').trim();
            if (!jsonStr) continue;

            try {
              const payload = JSON.parse(jsonStr);
              if (currentEvent === 'thinking') {
                onThinking({
                  action: payload.action || 'thinking',
                  label: payload.label || 'Menganalisis pertanyaan...',
                });
              } else if (currentEvent === 'done') {
                onComplete({
                  is_rejected: payload.is_rejected,
                  full_response: payload.content || '',
                });
              } else {
                // message event
                if (payload.content !== undefined) {
                  onToken(payload.content);
                } else if (payload.token !== undefined) {
                  onToken(payload.token);
                }
              }
            } catch {
              if (currentEvent === 'message') {
                onToken(jsonStr);
              }
            }
          }
        }
      }

      onComplete({});
    } catch (err: any) {
      onError(err);
    }
  },
};

// Game Tools (Public & Admin)
export const gameToolsApi = {
  // Public
  listPublicGames: () => client.get<GameTool[]>('public/tools/games'),
  getPublicGameBySlug: (slug: string) => client.get<GameTool>(`public/tools/games/${encodeURIComponent(slug)}`),
  checkNickname: (gameCode: string, userId: string, zoneId?: string) => {
    let url = `public/tools/game-check?game_code=${encodeURIComponent(gameCode)}&user_id=${encodeURIComponent(userId)}`;
    if (zoneId) url += `&zone_id=${encodeURIComponent(zoneId)}`;
    return client.get<GameCheckResult>(url);
  },

  // Admin
  list: (params?: PaginationParams) => client.getPaginated<GameTool>('admin/game-tools', params),
  get: (id: number) => client.get<GameTool>(`admin/game-tools/${id}`),
  create: (data: Partial<GameTool>) => client.post<GameTool>('admin/game-tools', data),
  update: (id: number, data: Partial<GameTool>) => client.put<GameTool>(`admin/game-tools/${id}`, data),
  delete: (id: number) => client.delete(`admin/game-tools/${id}`),
  toggleActive: (id: number) => client.patch<{ id: number; is_active: boolean }>(`admin/game-tools/${id}/toggle`),
};

// YouTube Downloader Tool (Public)
export const youtubeToolApi = {
  convert: (url: string, format: 'mp4' | 'mp3' = 'mp4') => {
    return client.get<YouTubeConvertResult>(
      `public/tools/youtube/convert?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`
    );
  },
};

// Global Tool Settings (Public & Admin)
export const toolSettingsApi = {
  // Public
  getPublicToolSettings: () => client.get<ToolSetting[]>('public/tools/settings'),

  // Admin
  list: () => client.get<ToolSetting[]>('admin/tool-settings'),
  update: (slug: string, data: Partial<ToolSetting>) => client.put<ToolSetting>(`admin/tool-settings/${slug}`, data),
  toggle: (slug: string) => client.patch<{ slug: string; is_enabled: boolean }>(`admin/tool-settings/${slug}/toggle`),
  togglePopular: (slug: string) => client.patch<{ slug: string; is_popular: boolean }>(`admin/tool-settings/${slug}/popular`),
};

