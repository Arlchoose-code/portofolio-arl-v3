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
