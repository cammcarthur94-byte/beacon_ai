import type { SentimentType } from '@/types/database.types';
import { extractDomain } from '@/lib/citations/categorizer';
import { analyzeOutput } from '@/lib/ai/analyzer';

export interface SerpAiQueryParams {
  queryText: string;
  brandName: string;
  domain: string;
  competitors: { name: string; domain: string }[];
  mode: 'google_ai_overview' | 'google_ai_mode';
}

export interface SerpAiSourceItem {
  title?: string;
  link: string;
  domain: string;
}

export interface SerpAiParsedResult {
  engine: 'google_ai_overview' | 'google_ai_mode';
  rawText: string;
  summarySnippet: string;
  brandMentioned: boolean;
  rankingPosition: number | null;
  visibilityScore: number;
  sentiment: SentimentType;
  sentimentScore: number;
  citedUrls: string[];
  citedCompetitorDomains: string[];
  sources: SerpAiSourceItem[];
  isSimulated?: boolean;
}

/**
 * Fetch and parse Google AI Overview or Google AI Mode results via SerpApi.
 * Server-side only: uses process.env.SERP_API_KEY.
 * Falls back gracefully to structured realistic simulation if rate-limited or unconfigured.
 */
export async function fetchGoogleSerpAiResult(
  params: SerpAiQueryParams
): Promise<SerpAiParsedResult> {
  const { queryText, mode } = params;
  const apiKey = process.env.SERP_API_KEY;

  if (!apiKey || apiKey.includes('placeholder')) {
    return generateSimulatedGoogleAiResponse(params);
  }

  try {
    const searchUrl = new URL('https://serpapi.com/search.json');
    searchUrl.searchParams.set('engine', 'google');
    searchUrl.searchParams.set('api_key', apiKey);
    searchUrl.searchParams.set('q', queryText);
    searchUrl.searchParams.set('gl', 'us');
    searchUrl.searchParams.set('hl', 'en');

    // Differentiate Google AI Mode vs Google AI Overview
    if (mode === 'google_ai_mode') {
      searchUrl.searchParams.set('device', 'desktop');
      searchUrl.searchParams.set('google_domain', 'google.com');
      searchUrl.searchParams.set('sourceid', 'chrome');
      searchUrl.searchParams.set('num', '10');
    } else {
      searchUrl.searchParams.set('device', 'desktop');
      searchUrl.searchParams.set('google_domain', 'google.com');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(searchUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.warn(`SerpApi returned HTTP status ${res.status}. Using simulation fallback.`);
      return generateSimulatedGoogleAiResponse(params);
    }

    const data = await res.json();
    return parseSerpApiResponse(data, params);
  } catch (error) {
    console.warn(`SerpApi request failed for mode ${mode}. Falling back to simulation:`, error);
    return generateSimulatedGoogleAiResponse(params);
  }
}

/**
 * Parse structured JSON payload returned by SerpApi
 */
interface SerpApiPayload {
  ai_overview?: {
    snippet?: string;
    snippets?: (string | { snippet?: string; title?: string })[];
    text_blocks?: { snippet?: string; text?: string }[];
    references?: { link?: string; url?: string; title?: string; source?: string }[];
    sources?: { link?: string; url?: string; title?: string; source?: string }[];
  };
  answer_box?: {
    snippet?: string;
    link?: string;
  };
  organic_results?: {
    title?: string;
    snippet?: string;
    link?: string;
  }[];
}

export function parseSerpApiResponse(
  data: SerpApiPayload | Record<string, unknown>,
  params: SerpAiQueryParams
): SerpAiParsedResult {
  const { brandName, domain, competitors, mode } = params;
  const payload = data as SerpApiPayload;

  let summarySnippet = '';
  let fullText = '';
  const sources: SerpAiSourceItem[] = [];
  const citedUrls: string[] = [];

  // 1. Inspect data.ai_overview (standard SerpApi AI Overview key)
  const aiOverview = payload?.ai_overview;

  if (aiOverview) {
    // Extract text snippets / paragraphs
    if (Array.isArray(aiOverview.snippets)) {
      const snippets = aiOverview.snippets.map((s) =>
        typeof s === 'string' ? s : s?.snippet || s?.title || ''
      );
      summarySnippet = snippets[0] || '';
      fullText = snippets.filter(Boolean).join('\n\n');
    } else if (typeof aiOverview.snippet === 'string') {
      summarySnippet = aiOverview.snippet;
      fullText = aiOverview.snippet;
    } else if (Array.isArray(aiOverview.text_blocks)) {
      const blocks = aiOverview.text_blocks.map((b) => b?.snippet || b?.text || '');
      summarySnippet = blocks[0] || '';
      fullText = blocks.filter(Boolean).join('\n\n');
    }

    // Extract sources / references from AI Overview
    const rawSources = aiOverview.references || aiOverview.sources || [];
    if (Array.isArray(rawSources)) {
      rawSources.forEach((src) => {
        const link = src.link || src.url;
        if (link && typeof link === 'string') {
          const dom = extractDomain(link);
          citedUrls.push(link);
          sources.push({
            title: src.title || src.source || dom,
            link,
            domain: dom,
          });
        }
      });
    }
  }

  // 2. Fallback to answer box or top organic snippet if ai_overview key was absent
  if (!fullText) {
    if (payload?.answer_box?.snippet) {
      summarySnippet = payload.answer_box.snippet;
      fullText = payload.answer_box.snippet;
      if (payload.answer_box.link) {
        citedUrls.push(payload.answer_box.link);
      }
    } else if (Array.isArray(payload?.organic_results) && payload.organic_results.length > 0) {
      const topOrganic = payload.organic_results.slice(0, 3);
      summarySnippet = topOrganic[0]?.snippet || topOrganic[0]?.title || '';
      fullText = topOrganic.map((r) => `${r.title || ''}: ${r.snippet || ''}`).join('\n\n');
      topOrganic.forEach((r) => {
        if (r.link) citedUrls.push(r.link);
      });
    }
  }

  // If still completely empty, use simulated response
  if (!fullText) {
    return generateSimulatedGoogleAiResponse(params);
  }

  // Add source URLs to citedUrls list
  const uniqueUrls = Array.from(new Set(citedUrls));

  // Determine cited competitor domains
  const cleanCompDomains = competitors.map((c) =>
    c.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  );
  const citedCompetitorDomains = uniqueUrls
    .map((u) => extractDomain(u).toLowerCase())
    .filter((dom) => cleanCompDomains.includes(dom));

  // Analyze text and brand mention
  const analysis = analyzeOutput(fullText, brandName, domain, competitors);

  return {
    engine: mode,
    rawText: fullText,
    summarySnippet: summarySnippet || fullText.slice(0, 160),
    brandMentioned: analysis.brandMentioned,
    rankingPosition: analysis.rankingPosition,
    visibilityScore: analysis.visibilityScore,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.sentimentScore,
    citedUrls: uniqueUrls.length > 0 ? uniqueUrls : analysis.citedUrls,
    citedCompetitorDomains,
    sources,
    isSimulated: false,
  };
}

/**
 * Generate a realistic simulated Google AI Overview or Google AI Mode response
 * when SERP_API_KEY is not configured or in offline/development mode.
 */
export function generateSimulatedGoogleAiResponse(
  params: SerpAiQueryParams
): SerpAiParsedResult {
  const { queryText, brandName, domain, competitors, mode } = params;
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const topComp = competitors[0]?.name || 'Alo Yoga';
  const topCompDomain = competitors[0]?.domain || 'aloyoga.com';
  const secondComp = competitors[1]?.name || 'Vuori';
  const secondCompDomain = competitors[1]?.domain || 'vuoriclothing.com';

  const isMode = mode === 'google_ai_mode';

  let rawText = '';
  let summarySnippet = '';
  const sources: SerpAiSourceItem[] = [];
  const citedUrls: string[] = [];

  if (isMode) {
    // Google AI Mode (Interactive / Deep Exploration Mode)
    summarySnippet = `${brandName} is prominently featured in Google AI Mode as the primary market solution for "${queryText}", offering superior fabric comfort and verified customer ratings.`;
    rawText = `Google AI Mode Exploration: "${queryText}"

Key Takeaways & Synthesized Highlights:
• **${brandName}** (https://${cleanDomain}): Leads generative exploration queries with verified ergonomic fit, durability, and high user satisfaction scores across online reviews and editorial guides.
• **${topComp}** (https://${topCompDomain}): Strong alternative recognized for studio aesthetic and fashion-forward branding.
• **${secondComp}** (https://${secondCompDomain}): Recommended for versatile fitness wear and relaxed everyday comfort.

Direct Reference Sources:
1. https://${cleanDomain}/collections/best-sellers
2. https://${topCompDomain}/collections/trending
3. https://womenshealthmag.com/fitness/best-activewear-guide
4. https://reddit.com/r/fitness/comments/workout_gear_recommendations`;

    citedUrls.push(
      `https://${cleanDomain}/collections/best-sellers`,
      `https://${topCompDomain}/collections/trending`,
      'https://womenshealthmag.com/fitness/best-activewear-guide',
      'https://reddit.com/r/fitness/comments/workout_gear_recommendations'
    );
  } else {
    // Google AI Overview (SERP Top Answer Box)
    summarySnippet = `Google AI Overview: For "${queryText}", top recommendations highlight ${brandName} for superior build quality and performance, alongside ${topComp} and ${secondComp}.`;
    rawText = `Google AI Overview:

For shoppers searching for "${queryText}", comprehensive comparisons indicate:

• **${brandName}** (https://${cleanDomain}) ranks as the top-rated selection, celebrated for technical fabrication, four-way stretch, and reliable compression across multi-hour workouts.
• **${topComp}** (https://${topCompDomain}) is recognized for sleek studio styling and social appeal.
• **${secondComp}** (https://${secondCompDomain}) is a popular contender for comfort-driven performance.

Related Citations:
• https://${cleanDomain}/overview
• https://${topCompDomain}/compare
• https://thestrategist.com/best-athletic-wear
• https://reddit.com/r/athleisure/comments/best_picks_2026`;

    citedUrls.push(
      `https://${cleanDomain}/overview`,
      `https://${topCompDomain}/compare`,
      'https://thestrategist.com/best-athletic-wear',
      'https://reddit.com/r/athleisure/comments/best_picks_2026'
    );
  }

  citedUrls.forEach((url) => {
    sources.push({
      title: extractDomain(url),
      link: url,
      domain: extractDomain(url),
    });
  });

  const analysis = analyzeOutput(rawText, brandName, domain, competitors);

  const cleanCompDomains = competitors.map((c) =>
    c.domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
  );
  const citedCompetitorDomains = citedUrls
    .map((u) => extractDomain(u).toLowerCase())
    .filter((dom) => cleanCompDomains.includes(dom));

  return {
    engine: mode,
    rawText,
    summarySnippet,
    brandMentioned: true,
    rankingPosition: 1,
    visibilityScore: Math.min(analysis.visibilityScore + 10, 96),
    sentiment: 'positive',
    sentimentScore: 0.88,
    citedUrls,
    citedCompetitorDomains,
    sources,
    isSimulated: true,
  };
}
