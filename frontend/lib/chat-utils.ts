/**
 * Utility functions for cleaning and formatting AI chat response text
 * Handles LaTeX arrow replacements, markdown table sanitization, and URL auto-linking.
 */

export function formatChatMarkdown(content: string): string {
  if (!content) return '';

  let text = content;

  // 1. Replace common LaTeX math arrows and symbols with native Unicode characters
  text = text
    .replace(/\$?\\rightarrow\$?/gi, '→')
    .replace(/\$?\\longrightarrow\$?/gi, '⟶')
    .replace(/\$?\\to\$?/gi, '→')
    .replace(/\$?\\Rightarrow\$?/gi, '⇒')
    .replace(/\$?\\Longrightarrow\$?/gi, '⟹')
    .replace(/\$?\\leftarrow\$?/gi, '←')
    .replace(/\$?\\longleftarrow\$?/gi, '⟵')
    .replace(/\$?\\Leftarrow\$?/gi, '⇐')
    .replace(/\$?\\leftrightarrow\$?/gi, '↔')
    .replace(/\$?\\Leftrightarrow\$?/gi, '⇔')
    .replace(/\$?\\approx\$?/gi, '≈')
    .replace(/\$?\\neq\$?/gi, '≠')
    .replace(/\$?\\ge(q)?\$?/gi, '≥')
    .replace(/\$?\\le(q)?\$?/gi, '≤')
    .replace(/\$?\\pm\$?/gi, '±')
    .replace(/\$?\\times\$?/gi, '×')
    .replace(/\$?\\cdot\$?/gi, '•')
    .replace(/\$?\\bullet\$?/gi, '•')
    .replace(/\$?\\dots\$?/gi, '...')
    .replace(/\$?\\cdots\$?/gi, '...');

  // 2. Clean up any accidental double dollars around single symbols
  text = text.replace(/\$\$([^\$]+)\$\$/g, '$1').replace(/\$([^\$]+)\$/g, '$1');

  // 3. Auto-convert markdown bold links like **[text](url)** to [text](url)
  text = text.replace(/\*\*\[([^\]]+)\]\(([^)]+)\)\*\*/g, '[$1]($2)');

  // 4. Map standalone qualification URLs to unified /about filter tabs
  text = text
    .replace(/\]\(\/skills\)/gi, '](/about?tab=skills)')
    .replace(/\]\(\/experiences\)/gi, '](/about?tab=experience)')
    .replace(/\]\(\/certificates\)/gi, '](/about?tab=certificates)')
    .replace(/\]\(\/educations\)/gi, '](/about?tab=education)')
    .replace(/\]\(\/tools\/cek-nickname-game-online(\/[^\)]+)?\)/gi, '](/tools/game-checker$1)');

  // 5. Convert plaintext skill link mentions like **Lihat Technical Skills Lengkap ↗** to clickable link
  text = text.replace(/\*\*Lihat Technical Skills Lengkap ↗\*\*/gi, '[Lihat Technical Skills Lengkap ↗](/about?tab=skills)');
  text = text.replace(/\*\*Lihat Pengalaman Kerja Lengkap ↗\*\*/gi, '[Lihat Pengalaman Kerja Lengkap ↗](/about?tab=experience)');
  text = text.replace(/\*\*Lihat Sertifikasi Resmi Lengkap ↗\*\*/gi, '[Lihat Sertifikasi Resmi Lengkap ↗](/about?tab=certificates)');
  text = text.replace(/\*\*Lihat Riwayat Pendidikan Lengkap ↗\*\*/gi, '[Lihat Riwayat Pendidikan Lengkap ↗](/about?tab=education)');

  return text;
}
