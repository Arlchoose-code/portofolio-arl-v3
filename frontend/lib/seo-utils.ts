/**
 * SEO & Typography Utilities
 */

/**
 * Extracts a clean plain-text excerpt from an HTML string for SEO Meta Description.
 */
export function extractExcerptFromHtml(html?: string | null, maxLength = 160): string {
  if (!html) return '';

  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/\s+/g, ' ')
    .trim();

  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Strips repeated site name or title separator suffixes from meta titles.
 */
export function cleanMetaTitle(rawTitle?: string | null, siteName?: string, separator = '|'): string {
  if (!rawTitle) return '';
  let cleaned = rawTitle.trim();

  if (siteName) {
    const escapedBrand = siteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedSep = (separator || '|').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(\\s*${escapedSep}\\s*${escapedBrand})+$`, 'gi');
    cleaned = cleaned.replace(pattern, '').trim();
  }

  return cleaned;
}
