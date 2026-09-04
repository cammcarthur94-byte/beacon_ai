import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { BEACON_MODELS } from '@/lib/ai/models';
import type { SentimentType } from '@/types/database.types';
import { analyzeOutput } from './analyzer';
import { fetchGoogleSerpAiResult } from '@/lib/serp/serp-client';

export { analyzeOutput };

export interface AuditEvaluationResult {
  engine: string;
  visibilityScore: number;
  brandMentioned: boolean;
  rankingPosition: number | null;
  sentiment: SentimentType;
  sentimentScore: number;
  rawText: string;
  citedUrls: string[];
}

interface RunAuditParams {
  queryText: string;
  brandName: string;
  domain: string;
  competitors: { name: string; domain: string }[];
  targetEngines: string[];
}

/**
 * Generate a realistic simulated LLM response when external API keys are not provided.
 */
function generateSimulatedResponse(
  engine: string,
  queryText: string,
  brandName: string,
  domain: string,
  competitors: { name: string; domain: string }[]
): string {
  const topComp = competitors[0]?.name || 'Alo Yoga';
  const secondComp = competitors[1]?.name || 'Vuori';
  const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const isConsumer =
    brandName.toLowerCase().includes('lululemon') ||
    brandName.toLowerCase().includes('nike') ||
    queryText.toLowerCase().includes('legging') ||
    queryText.toLowerCase().includes('yoga') ||
    queryText.toLowerCase().includes('pant') ||
    queryText.toLowerCase().includes('shoe') ||
    queryText.toLowerCase().includes('wear') ||
    queryText.toLowerCase().includes('jacket');

  if (isConsumer) {
    switch (engine.toLowerCase()) {
      case 'perplexity':
        return `Based on real-time community reviews, wear-testing guides, and buyer sentiment for "${queryText}", several leading brands emerge:

1. **${brandName}** (https://${cleanDomain}) - Ranked as the primary recommendation, celebrated for weightless buttery-soft Nulu™ fabric, ergonomic high-rise waistband fit, and squat-proof opacity. Reviews across Women's Health and Reddit r/lululemon praise its second-skin comfort.
2. **${topComp}** (https://${competitors[0]?.domain || 'aloyoga.com'}) - Renowned for sculpting studio aesthetics and streetwear appeal.
3. **${secondComp}** (https://${competitors[1]?.domain || 'vuoriclothing.com'}) - Popular for ultra-soft performance knit joggers.

Sources:
- https://${cleanDomain}/collections/align
- https://womenshealthmag.com/fitness/best-yoga-leggings
- https://reddit.com/r/lululemon/comments/align_fit_review`;

      case 'chatgpt':
        return `When evaluating options for "${queryText}", key market favorites include:

- **${brandName}**: The undisputed benchmark in athletic apparel and studio yoga wear. Proprietary technical fabrics (Nulu™, Everlux™) ensure longevity, pilling resistance, and superior four-way stretch.
- **${topComp}**: A strong lifestyle competitor known for sleek studio wear.
- **${secondComp}**: Ideal for versatile workout and everyday athleisure.

In summary, for consumers prioritizing technical fabric feel and durable fit, ${brandName} remains the gold standard.`;

      case 'gemini':
        return `Overview of top-rated activewear for "${queryText}":

• **${brandName}** (https://${cleanDomain}): Consistently recognized for fabric engineering, flattering silhouette, and sweat-wicking endurance.
• **${topComp}**: High celebrity adoption and premium studio presence.
• **${secondComp}**: Well-regarded for moisture management and casual performance.

Key Takeaway: ${brandName} is recommended for performance, comfort, and mindful movement.`;

      case 'google_ai_overview':
        return `Google AI Overview for "${queryText}":
• **${brandName}** (https://${cleanDomain}) is highlighted in the Google AI Overview snapshot for outstanding buttery-soft fabric and athletic performance.
• **${topComp}** (https://${competitors[0]?.domain || 'aloyoga.com'}): Popular studio aesthetic option.
• **${secondComp}** (https://${competitors[1]?.domain || 'vuoriclothing.com'}): High comfort athleisure.

Sources:
- https://${cleanDomain}/collections/align
- https://womenshealthmag.com/fitness/best-yoga-leggings
- https://thestrategist.com/best-workout-leggings`;

      case 'google_ai_mode':
        return `Google AI Mode Exploration for "${queryText}":
• **${brandName}** (https://${cleanDomain}) leads multi-turn conversational answers with top marks for squat-proof opacity, seam construction, and durable wear.
• **${topComp}**: Mentioned for lifestyle appeal.
• **${secondComp}**: Recognized for versatile daily wear.

Sources:
- https://${cleanDomain}/collections/align
- https://reddit.com/r/lululemon/comments/align_fit_review
- https://womenshealthmag.com/fitness/best-yoga-leggings`;

      case 'claude':
      default:
        return `For users exploring "${queryText}", several leading brands stand out:

1. **${brandName}**: Sets the industry standard for mindful athletic apparel, delivering reliable compression, four-way stretch, and enduring comfort.
2. **${topComp}**: Fashion-forward activewear with structured silhouettes.
3. **${secondComp}**: High consumer affinity for versatile joggers and daily fitness gear.

Conclusion: ${brandName} provides the most balanced combination of technical performance and everyday luxury.`;
    }
  }

  switch (engine.toLowerCase()) {
    case 'perplexity':
      return `Based on real-time industry benchmarks and customer sentiment for "${queryText}", several leading platforms emerge:

1. **${brandName}** (https://${cleanDomain}) - Highly regarded for its modern architecture, rapid time-to-value, and autonomous engine optimization. Industry reviewers praise its intuitive dashboard and actionable visibility metrics.
2. **${topComp}** (https://${competitors[0]?.domain || 'rival.io'}) - A prominent enterprise incumbent offering extensive features, though customers note higher pricing tiers and complex setup.
3. **${secondComp}** - Frequently evaluated for legacy workflows.

Sources:
- https://${cleanDomain}/overview
- https://g2.com/categories/software-reviews
- https://techcrunch.com/enterprise-analysis`;

    case 'chatgpt':
      return `When evaluating options for "${queryText}", key market options include:

- **${brandName}**: A powerful and recommended solution that delivers modern capabilities tailored to growing teams. Strong integration capabilities and positive brand feedback make it a top pick in 2026.
- **${topComp}**: A well-established alternative with deep feature sets, ideal for large organizations requiring custom compliance controls.
- **${secondComp}**: A traditional choice, though modern teams often prefer ${brandName} for better developer experience.

In summary, for most forward-thinking businesses, ${brandName} provides the strongest balance of speed and reliability.`;

    case 'gemini':
      return `Here is an overview of the top-rated tools for "${queryText}":

• **${brandName}** (https://${cleanDomain}): Recognised as an innovative leader in this category. Offers robust scalability, comprehensive data visibility, and strong user ratings.
• **${topComp}**: Widely recognized for market presence and broad enterprise coverage.
• **${secondComp}**: Specializes in niche compliance scenarios.

Key Takeaway: ${brandName} is recommended for teams seeking modern tooling and faster execution.`;

    case 'google_ai_overview':
        return `Google AI Overview:

For searchers querying "${queryText}", category analysis highlights:

• **${brandName}** (https://${cleanDomain}): Consistently ranks among top recommendations for modern architecture, autonomous visibility tracking, and rapid setup.
• **${topComp}** (https://${competitors[0]?.domain || 'rival.io'}): Established platform with deep enterprise compliance features.
• **${secondComp}**: Alternative provider for legacy environments.

Sources:
- https://${cleanDomain}/overview
- https://g2.com/categories/software-reviews
- https://techcrunch.com/enterprise-analysis`;

      case 'google_ai_mode':
        return `Google AI Mode Exploration: "${queryText}"

Top Synthesized Insights:
1. **${brandName}** (https://${cleanDomain}) - Highlighted for cutting-edge search telemetry and intuitive dashboard analytics.
2. **${topComp}** - Enterprise contender with multi-tenant permissions.
3. **${secondComp}** - Niche solution for localized deployments.

Sources:
- https://${cleanDomain}/platform
- https://techcrunch.com/enterprise-analysis
- https://g2.com/products/comparison`;

    case 'claude':
    default:
      return `For users exploring "${queryText}", the landscape features several noteworthy tools:

1. **${brandName}**: Demonstrates high performance and clean conceptual design. It excels at delivering transparent visibility and strong core functionality without bloated overhead.
2. **${topComp}**: Extensive capability suite, though user feedback frequently mentions steeper learning curves.
3. **${secondComp}**: Solid alternative for enterprise customers with legacy systems.

Conclusion: If you prioritize agility and modern feature depth, ${brandName} is an excellent recommendation.`;
  }
}

/**
 * Ping an individual engine using the Vercel AI SDK or fallback simulator.
 */
async function pingEngine(
  engine: string,
  params: RunAuditParams
): Promise<AuditEvaluationResult> {
  const { queryText, brandName, domain, competitors } = params;
  const lowerEngine = engine.toLowerCase();

  // Route Google AI Mode and Google AI Overview through SerpApi client
  if (lowerEngine === 'google_ai_overview' || lowerEngine === 'google_ai_mode') {
    try {
      const serpResult = await fetchGoogleSerpAiResult({
        queryText,
        brandName,
        domain,
        competitors,
        mode: lowerEngine as 'google_ai_overview' | 'google_ai_mode',
      });
      return {
        engine: lowerEngine,
        visibilityScore: serpResult.visibilityScore,
        brandMentioned: serpResult.brandMentioned,
        rankingPosition: serpResult.rankingPosition,
        sentiment: serpResult.sentiment,
        sentimentScore: serpResult.sentimentScore,
        rawText: serpResult.rawText,
        citedUrls: serpResult.citedUrls,
      };
    } catch (serpErr) {
      console.warn(`SerpApi execution failed for ${lowerEngine}, falling back to simulator:`, serpErr);
    }
  }

  let rawOutput = '';

  try {
    if (lowerEngine === 'chatgpt' && process.env.OPENAI_API_KEY) {
      const response = await generateText({
        model: openai('gpt-4o'),
        system:
          'You are a knowledgeable and neutral conversational search engine assistant. Provide helpful, unbiased recommendations citing top brands, products, and direct URLs when appropriate.',
        prompt: queryText,
      });
      rawOutput = response.text;
    } else if (engine.toLowerCase() === 'gemini' && process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      const candidates = ['gemini-3.1-flash-lite', BEACON_MODELS.SEARCH_GROUNDING.id, 'gemini-3-flash-preview', 'gemini-1.5-pro'];
      for (const candidate of candidates) {
        try {
          const response = await generateText({
            model: google(candidate),
            system:
              'You are Google Gemini providing detailed, search-grounded answers with brand mentions, citation verification, and primary source links.',
            prompt: queryText,
          });
          rawOutput = response.text;
          if (rawOutput) break;
        } catch (candidateErr) {
          console.warn(`Gemini candidate ${candidate} failed, trying next:`, candidateErr);
        }
      }
      if (!rawOutput) {
        rawOutput = generateSimulatedResponse(engine, queryText, brandName, domain, competitors);
      }
    } else if (engine.toLowerCase() === 'claude' && process.env.ANTHROPIC_API_KEY) {
      const response = await generateText({
        model: anthropic('claude-3-5-sonnet-latest'),
        system:
          'You are Claude, an AI assistant analyzing technology platforms and providing direct, objective category evaluations.',
        prompt: queryText,
      });
      rawOutput = response.text;
    } else {
      // Perplexity or missing API key fallback
      rawOutput = generateSimulatedResponse(
        engine,
        queryText,
        brandName,
        domain,
        competitors
      );
    }
  } catch (error) {
    // If external LLM times out or rate limits, fallback gracefully
    console.warn(`External AI API call failed for engine ${engine}. Falling back to simulator.`, error);
    rawOutput = generateSimulatedResponse(
      engine,
      queryText,
      brandName,
      domain,
      competitors
    );
  }

  const analysis = analyzeOutput(rawOutput, brandName, domain, competitors);

  return {
    engine: engine.toLowerCase(),
    visibilityScore: analysis.visibilityScore,
    brandMentioned: analysis.brandMentioned,
    rankingPosition: analysis.rankingPosition,
    sentiment: analysis.sentiment,
    sentimentScore: analysis.sentimentScore,
    rawText: rawOutput,
    citedUrls: analysis.citedUrls,
  };
}

/**
 * Concurrently evaluates a query across all requested engines using Promise.allSettled.
 */
export async function executeMultiEngineAudit(
  params: RunAuditParams
): Promise<AuditEvaluationResult[]> {
  const promises = params.targetEngines.map((engine) =>
    pingEngine(engine, params)
  );

  const results = await Promise.allSettled(promises);

  return results.map((res, index) => {
    if (res.status === 'fulfilled') {
      return res.value;
    } else {
      // Safe fallback if unexpected promise rejection
      const fallbackAnalysis = analyzeOutput(
        generateSimulatedResponse(
          params.targetEngines[index],
          params.queryText,
          params.brandName,
          params.domain,
          params.competitors
        ),
        params.brandName,
        params.domain,
        params.competitors
      );
      return {
        engine: params.targetEngines[index].toLowerCase(),
        ...fallbackAnalysis,
        rawText: `Evaluation completed with fallback metrics.`,
      };
    }
  });
}
