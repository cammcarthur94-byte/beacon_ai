import type { SentimentType } from '@/types/database.types';

/**
 * Parse LLM or SERP output to detect brand presence, sentiment, ranking position, and citations.
 */
export function analyzeOutput(
  rawText: string,
  brandName: string,
  domain: string,
  competitors: { name: string; domain: string }[]
): {
  brandMentioned: boolean;
  rankingPosition: number | null;
  visibilityScore: number;
  sentiment: SentimentType;
  sentimentScore: number;
  citedUrls: string[];
} {
  const lowerText = rawText.toLowerCase();
  const lowerBrand = brandName.toLowerCase();
  const lowerDomain = domain.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const brandInText = lowerText.includes(lowerBrand);
  const domainInText = lowerText.includes(lowerDomain);
  const brandMentioned = brandInText || domainInText;

  // Extract all URLs from rawText
  const urlRegex = /(https?:\/\/[^\s\)\],]+)/gi;
  const foundUrls = rawText.match(urlRegex) || [];
  const citedUrls = Array.from(new Set(foundUrls)).slice(0, 8);

  // Check competitor mentions
  const competitorMatches: { name: string; index: number }[] = [];
  competitors.forEach((c) => {
    const idx = lowerText.indexOf(c.name.toLowerCase());
    if (idx !== -1) {
      competitorMatches.push({ name: c.name, index: idx });
    }
  });

  const brandIndex = Math.min(
    lowerText.indexOf(lowerBrand) !== -1 ? lowerText.indexOf(lowerBrand) : Infinity,
    lowerText.indexOf(lowerDomain) !== -1 ? lowerText.indexOf(lowerDomain) : Infinity
  );

  let rankingPosition: number | null = null;
  if (brandMentioned) {
    // Determine ranking based on appearance order relative to competitors
    const priorCompetitors = competitorMatches.filter((c) => c.index < brandIndex);
    rankingPosition = priorCompetitors.length + 1;
  }

  // Sentiment analysis heuristics
  let sentimentScore = 0.5; // neutral baseline
  let sentiment: SentimentType = 'neutral';

  if (brandMentioned) {
    const positiveWords = [
      'leader',
      'leading',
      'best',
      'recommended',
      'top',
      'standout',
      'excellent',
      'powerful',
      'innovative',
      'robust',
      'superior',
      'intuitive',
      'preferred',
    ];
    const negativeWords = [
      'complex',
      'expensive',
      'lacks',
      'limited',
      'drawback',
      'difficult',
      'slow',
      'legacy',
      'missing',
      'outdated',
    ];

    let posCount = 0;
    let negCount = 0;

    positiveWords.forEach((word) => {
      if (lowerText.includes(word)) posCount++;
    });
    negativeWords.forEach((word) => {
      if (lowerText.includes(word)) negCount++;
    });

    const net = posCount - negCount;
    if (net >= 2) {
      sentiment = 'positive';
      sentimentScore = Math.min(0.7 + net * 0.05, 0.98);
    } else if (net <= -2) {
      sentiment = 'negative';
      sentimentScore = Math.max(0.1 + net * 0.05, 0.05);
    } else {
      sentiment = 'neutral';
      sentimentScore = 0.55;
    }
  } else {
    sentimentScore = 0.0;
  }

  // Visibility score calculation (0 - 100)
  let visibilityScore = 0;
  if (brandMentioned) {
    visibilityScore += 40; // Base score for being mentioned
    if (domainInText || citedUrls.some((u) => u.toLowerCase().includes(lowerDomain))) {
      visibilityScore += 25; // Bonus for direct URL citation
    }
    if (rankingPosition === 1) {
      visibilityScore += 25; // #1 ranking bonus
    } else if (rankingPosition === 2) {
      visibilityScore += 15;
    } else if (rankingPosition === 3) {
      visibilityScore += 10;
    }

    if (sentiment === 'positive') {
      visibilityScore += 10;
    } else if (sentiment === 'negative') {
      visibilityScore -= 15;
    }
  }

  visibilityScore = Math.min(Math.max(visibilityScore, 0), 100);

  return {
    brandMentioned,
    rankingPosition,
    visibilityScore,
    sentiment,
    sentimentScore,
    citedUrls,
  };
}

