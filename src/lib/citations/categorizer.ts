import type { CitationSourceType } from '@/types/database.types';

/**
 * Extracts clean hostname/root domain from a full URL.
 * Handles protocol prefixes, subdomains like 'www.', and trims trailing slashes/paths.
 * Example: 'https://www.reddit.com/r/SaaS/comments/...' -> 'reddit.com'
 */
export function extractDomain(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  let urlStr = rawUrl.trim();

  // Add protocol prefix if missing for URL parsing
  if (!urlStr.startsWith('http://') && !urlStr.startsWith('https://')) {
    urlStr = `https://${urlStr}`;
  }

  try {
    const parsed = new URL(urlStr);
    let host = parsed.hostname.toLowerCase();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host;
  } catch {
    // Fallback regex if URL parsing fails
    const match = rawUrl.replace(/^https?:\/\//i, '').split('/')[0].split('?')[0];
    return match.replace(/^www\./i, '').toLowerCase();
  }
}

/**
 * Categorizes a domain/URL into one of the 6 canonical GEO source types:
 * 'news' | 'forum' | 'blog' | 'documentation' | 'social' | 'other'
 */
export function categorizeSource(domain: string, url: string = ''): CitationSourceType {
  const d = domain.toLowerCase();
  const u = url.toLowerCase();

  // 1. FORUM / COMMUNITY
  if (
    d.includes('reddit.com') ||
    d.includes('quora.com') ||
    d.includes('news.ycombinator.com') ||
    d.includes('stackoverflow.com') ||
    d.includes('stackexchange.com') ||
    d.includes('discourse') ||
    d.includes('community.') ||
    d.includes('forum.') ||
    d.includes('forums.') ||
    u.includes('/community/') ||
    u.includes('/forum/') ||
    u.includes('/discussion/')
  ) {
    return 'forum';
  }

  // 2. NEWS & TIER-1 PUBLICATIONS
  if (
    d.includes('techcrunch.com') ||
    d.includes('forbes.com') ||
    d.includes('bloomberg.com') ||
    d.includes('nytimes.com') ||
    d.includes('wsj.com') ||
    d.includes('reuters.com') ||
    d.includes('theverge.com') ||
    d.includes('cnbc.com') ||
    d.includes('wired.com') ||
    d.includes('bbc.com') ||
    d.includes('businessinsider.com') ||
    d.includes('venturebeat.com') ||
    d.includes('zdnet.com') ||
    d.includes('arstechnica.com') ||
    d.includes('fortune.com') ||
    d.includes('inc.com') ||
    d.includes('fastcompany.com') ||
    d.includes('sifted.eu') ||
    d.includes('news.')
  ) {
    return 'news';
  }

  // 3. BLOG & CONTENT PLATFORMS
  if (
    d.includes('medium.com') ||
    d.includes('substack.com') ||
    d.includes('dev.to') ||
    d.includes('hashnode.dev') ||
    d.includes('wordpress.com') ||
    d.includes('ghost.io') ||
    d.includes('blog.') ||
    u.includes('/blog/') ||
    u.includes('/insights/') ||
    u.includes('/articles/')
  ) {
    return 'blog';
  }

  // 4. DOCUMENTATION, REPOSITORIES & API SPECS
  if (
    d.includes('docs.') ||
    d.includes('documentation.') ||
    d.includes('developer.') ||
    d.includes('api.') ||
    d.includes('github.com') ||
    d.includes('gitlab.com') ||
    d.includes('readthedocs.io') ||
    d.includes('gitbook.io') ||
    d.includes('readme.io') ||
    u.includes('/docs/') ||
    u.includes('/documentation/') ||
    u.includes('/api-reference/')
  ) {
    return 'documentation';
  }

  // 5. SOCIAL MEDIA
  if (
    d.includes('twitter.com') ||
    d.includes('x.com') ||
    d.includes('linkedin.com') ||
    d.includes('youtube.com') ||
    d.includes('instagram.com') ||
    d.includes('tiktok.com') ||
    d.includes('facebook.com') ||
    d.includes('threads.net')
  ) {
    return 'social';
  }

  return 'other';
}

/**
 * Returns user-friendly metadata for source type badges.
 */
export function getSourceTypeMeta(sourceType: CitationSourceType) {
  switch (sourceType) {
    case 'news':
      return {
        label: 'News & Press',
        badgeClass: 'border-blue-300 bg-blue-100/90 text-blue-950 font-semibold shadow-2xs',
        iconClass: 'text-blue-700',
        color: '#1a73e8', // GA4 Blue
      };
    case 'forum':
      return {
        label: 'Community Forum',
        badgeClass: 'border-amber-300 bg-amber-100/90 text-amber-950 font-semibold shadow-2xs',
        iconClass: 'text-amber-800',
        color: '#e37400', // GA4 Amber/Orange
      };
    case 'blog':
      return {
        label: 'Industry Blog',
        badgeClass: 'border-purple-300 bg-purple-100/90 text-purple-950 font-semibold shadow-2xs',
        iconClass: 'text-purple-800',
        color: '#9334e6', // GA4 Purple
      };
    case 'documentation':
      return {
        label: 'Documentation / Code',
        badgeClass: 'border-emerald-300 bg-emerald-100/90 text-emerald-950 font-semibold shadow-2xs',
        iconClass: 'text-emerald-800',
        color: '#1e8e3e', // GA4 Green
      };
    case 'social':
      return {
        label: 'Social Media',
        badgeClass: 'border-cyan-300 bg-cyan-100/90 text-cyan-950 font-semibold shadow-2xs',
        iconClass: 'text-cyan-800',
        color: '#0891b2', // GA4 Cyan/Teal
      };
    default:
      return {
        label: 'Other Website',
        badgeClass: 'border-zinc-300 bg-zinc-100 text-zinc-950 font-semibold shadow-2xs',
        iconClass: 'text-zinc-700',
        color: '#70757a', // GA4 Grey
      };
  }
}
