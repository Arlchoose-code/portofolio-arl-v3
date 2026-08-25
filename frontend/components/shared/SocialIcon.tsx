import React from 'react';
import {
  Github,
  Linkedin,
  Instagram,
  Twitter,
  Youtube,
  Facebook,
  Globe,
  Mail,
  Send,
  MessageSquare,
  MessageCircle,
  Gitlab,
  Dribbble,
  Tv,
  BookOpen,
  Phone,
  Video,
  Music,
  Share2,
} from 'lucide-react';

export const availableSocialIcons = [
  { id: 'github', label: 'GitHub', icon: Github },
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'discord', label: 'Discord', icon: MessageSquare },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'mail', label: 'Email', icon: Mail },
  { id: 'tiktok', label: 'TikTok', icon: Music },
  { id: 'whatsapp', label: 'WhatsApp', icon: Phone },
  { id: 'gitlab', label: 'GitLab', icon: Gitlab },
  { id: 'dribbble', label: 'Dribbble', icon: Dribbble },
  { id: 'medium', label: 'Medium', icon: BookOpen },
  { id: 'twitch', label: 'Twitch', icon: Tv },
  { id: 'globe', label: 'Website / Portofolio', icon: Globe },
];

export function SocialIcon({
  icon,
  platform,
  className = 'w-4 h-4',
}: {
  icon?: string;
  platform?: string;
  className?: string;
}) {
  const key = (icon || platform || '').toLowerCase().trim();

  if (key.includes('github') || key.includes('git')) return <Github className={className} />;
  if (key.includes('linkedin')) return <Linkedin className={className} />;
  if (key.includes('instagram') || key.includes('ig')) return <Instagram className={className} />;
  if (key.includes('twitter') || key === 'x' || key.includes('x.com')) return <Twitter className={className} />;
  if (key.includes('youtube') || key.includes('yt')) return <Youtube className={className} />;
  if (key.includes('facebook') || key.includes('fb')) return <Facebook className={className} />;
  if (key.includes('discord')) return <MessageSquare className={className} />;
  if (key.includes('telegram') || key.includes('t.me') || key.includes('send')) return <Send className={className} />;
  if (key.includes('mail') || key.includes('email') || key.includes('mailto')) return <Mail className={className} />;
  if (key.includes('tiktok')) return <Music className={className} />;
  if (key.includes('whatsapp') || key.includes('wa.me')) return <Phone className={className} />;
  if (key.includes('gitlab')) return <Gitlab className={className} />;
  if (key.includes('dribbble')) return <Dribbble className={className} />;
  if (key.includes('medium')) return <BookOpen className={className} />;
  if (key.includes('twitch')) return <Tv className={className} />;

  return <Globe className={className} />;
}
