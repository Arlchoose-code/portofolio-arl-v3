import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString?: string): string {
  if (!dateString) return '';
  return dateString;
}

export function truncate(text: string, length = 100): string {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.slice(0, length) + '...';
}

export function getMediaUrl(path?: string | null): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (path.includes('localhost:8080') || path.includes('127.0.0.1:8080')) {
      return path.replace(/^https?:\/\/(localhost|127\.0\.0\.1):8080/, '');
    }
    return path;
  }
  return path.startsWith('/') ? path : `/${path}`;
}

export function getAbsoluteMediaUrl(path?: string | null): string {
  const rel = getMediaUrl(path);
  if (!rel) return '';
  if (rel.startsWith('http://') || rel.startsWith('https://')) {
    return rel;
  }
  const siteUrl = (
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'https://arlab.my.id'
  ).replace(/\/+$/, '');
  return `${siteUrl}${rel}`;
}


