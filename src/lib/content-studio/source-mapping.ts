import type { ContentStudioFormat } from '@/types/database.types';

/**
 * Maps source types and domain patterns to the ideal content format.
 *
 * Rules:
 * - 'news' / editorial publications (e.g. NYT Wirecutter, GearJunkie, TechCrunch, WSJ, Forbes)
 *   -> 'Outreach Email' (Editorial Outreach Pitch to journalists/editors)
 * - 'forum' / communities (e.g. Reddit, Quora)
 *   -> 'Reddit Post' (Community discussion / practitioner reply)
 * - 'blog' / independent reviewers
 *   -> 'Blog Post' (Authority Blog & Guide)
 * - 'documentation' / technical specifications / analysts (e.g. Gartner)
 *   -> 'FAQ' (FAQ & Q&A Blocks)
 * - Default for PR & citation gap targets is 'Outreach Email'
 */
export function inferContentTypeFromSource(
  sourceType?: string,
  domain?: string,
  recommendedAngleOrTopic?: string
): ContentStudioFormat {
  const normalizedType = (sourceType || '').toLowerCase().trim();
  const normalizedDomain = (domain || '').toLowerCase().trim();
  const normalizedContext = (recommendedAngleOrTopic || '').toLowerCase().trim();

  // Explicit News / Editorial Source (always Outreach Email as requested)
  if (
    normalizedType === 'news' ||
    normalizedType === 'editorial' ||
    normalizedType === 'press' ||
    normalizedDomain.includes('nytimes') ||
    normalizedDomain.includes('wirecutter') ||
    normalizedDomain.includes('gearjunkie') ||
    normalizedDomain.includes('techcrunch') ||
    normalizedDomain.includes('forbes') ||
    normalizedDomain.includes('wsj') ||
    normalizedDomain.includes('bloomberg') ||
    normalizedDomain.includes('reuters') ||
    normalizedDomain.includes('theverge') ||
    normalizedDomain.includes('cnet') ||
    normalizedDomain.includes('insider') ||
    normalizedDomain.includes('businessinsider') ||
    normalizedContext.includes('pitch') ||
    normalizedContext.includes('send review samples') ||
    normalizedContext.includes('editorial')
  ) {
    return 'Outreach Email';
  }

  // Forum / Community Source
  if (
    normalizedType === 'forum' ||
    normalizedType === 'community' ||
    normalizedDomain.includes('reddit') ||
    normalizedDomain.includes('quora') ||
    normalizedDomain.includes('discord') ||
    normalizedDomain.includes('stackoverflow')
  ) {
    return 'Reddit Post';
  }

  // Documentation / Knowledge Base / Analyst Briefing
  if (
    normalizedType === 'documentation' ||
    normalizedType === 'docs' ||
    normalizedDomain.includes('gartner') ||
    normalizedDomain.includes('docs.') ||
    normalizedContext.includes('documentation') ||
    normalizedContext.includes('vendor briefing')
  ) {
    return 'FAQ';
  }

  // Industry Blogs / Content Publications
  if (
    normalizedType === 'blog' ||
    normalizedDomain.includes('medium.com') ||
    normalizedDomain.includes('substack.com') ||
    normalizedDomain.includes('blog')
  ) {
    return 'Blog Post';
  }

  // Default for authority gap resolution:
  // Since authority gaps represent high-DA publishers citing competitors,
  // pitching their editorial team via email is the primary action.
  return 'Outreach Email';
}

/**
 * Returns human-readable label for a given source type.
 */
export function getSourceTypeBadgeInfo(sourceType?: string): {
  label: string;
  badgeClass: string;
  recommendation: string;
} {
  const norm = (sourceType || 'news').toLowerCase().trim();

  switch (norm) {
    case 'news':
    case 'editorial':
      return {
        label: 'News & Editorial',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        recommendation: 'Editorial Outreach Pitch (Journalist Email)',
      };
    case 'forum':
    case 'community':
      return {
        label: 'Forums & Communities',
        badgeClass: 'bg-orange-50 text-orange-700 border-orange-200',
        recommendation: 'Reddit Community Post',
      };
    case 'blog':
      return {
        label: 'Industry Blogs',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
        recommendation: 'Authority Blog & Guide',
      };
    case 'documentation':
    case 'docs':
      return {
        label: 'Documentation & Analysts',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        recommendation: 'FAQ & Q&A Blocks',
      };
    default:
      return {
        label: 'Publisher Target',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        recommendation: 'Editorial Outreach Pitch',
      };
  }
}
