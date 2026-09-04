import type { BrandKit, SearchIntent, BrandAssociation, AuditFrequency } from '@/types/database.types';
import type { AuditRunDetail } from '@/components/audits/raw-output-viewer';

export interface DemoPromptItem {
  id: string;
  project_id?: string;
  query_text: string;
  frequency: AuditFrequency;
  target_engines: string[];
  disabled_engines?: string[];
  search_intent?: SearchIntent;
  brand_association?: BrandAssociation;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  latest_score?: number;
  created_at?: string;
}

export interface ProjectContext {
  id?: string;
  name?: string;
  domain?: string;
  tier?: string;
  brand_kit?: BrandKit;
}

export function isConsumerProject(project?: ProjectContext | null): boolean {
  if (!project) return true;
  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const brandName = (project.name || '').toLowerCase();
  return (
    rawIndustry.includes('retail') ||
    rawIndustry.includes('commerce') ||
    rawIndustry.includes('apparel') ||
    rawIndustry.includes('footwear') ||
    rawIndustry.includes('fashion') ||
    rawIndustry.includes('sport') ||
    rawIndustry.includes('fitness') ||
    rawIndustry.includes('athleisure') ||
    brandName.includes('nike') ||
    brandName.includes('lululemon') ||
    brandName.includes('alo') ||
    brandName.includes('vuori')
  );
}

export function getSeedPrompts(project?: ProjectContext | null): DemoPromptItem[] {
  const brandName = project?.name || 'Lululemon';
  const domain = project?.domain || 'lululemon.com';
  const competitorA = project?.brand_kit?.competitors?.[0]?.name || 'Alo Yoga';
  const competitorB = project?.brand_kit?.competitors?.[1]?.name || 'Vuori';
  const isConsumer = isConsumerProject(project);

  if (isConsumer) {
    return [
      {
        id: 'prompt-seed-1',
        query_text: 'Best buttery-soft yoga leggings for Pilates and studio workouts in 2026',
        frequency: 'daily',
        target_engines: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai_overview'],
        search_intent: 'commercial',
        brand_association: 'unbranded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
        latest_score: 94,
      },
      {
        id: 'prompt-seed-2',
        query_text: `${brandName} Align vs ${competitorA} Airbrush: durability, pilling, and squat test review`,
        frequency: 'weekly',
        target_engines: ['chatgpt', 'perplexity', 'google_ai_overview'],
        search_intent: 'commercial',
        brand_association: 'branded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 144).toISOString(),
        latest_score: 89,
      },
      {
        id: 'prompt-seed-3',
        query_text: `Best men's commuter pants and workout joggers: ${brandName} ABC vs ${competitorB} Meta`,
        frequency: 'daily',
        target_engines: ['gemini', 'perplexity', 'chatgpt'],
        search_intent: 'commercial',
        brand_association: 'branded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 16).toISOString(),
        latest_score: 86,
      },
      {
        id: 'prompt-seed-4',
        query_text: `Where to buy authentic ${brandName} Align leggings and Everywhere Belt Bags online`,
        frequency: 'daily',
        target_engines: ['gemini', 'perplexity', 'chatgpt', 'google_ai_overview'],
        search_intent: 'transactional',
        brand_association: 'branded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
        latest_score: 92,
      },
      {
        id: 'prompt-seed-5',
        query_text: 'Top moisture-wicking athletic wear brands for hot yoga and HIIT training',
        frequency: 'weekly',
        target_engines: ['claude', 'perplexity', 'chatgpt'],
        search_intent: 'informational',
        brand_association: 'unbranded',
        is_active: true,
        last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
        latest_score: 81,
      },
    ];
  }

  return [
    {
      id: 'prompt-seed-1',
      query_text: `What are the best platforms for ${brandName || 'enterprise intelligence'} in 2026?`,
      frequency: 'daily',
      target_engines: ['chatgpt', 'gemini', 'claude', 'perplexity', 'google_ai_overview'],
      search_intent: 'commercial',
      brand_association: 'unbranded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
      latest_score: 92,
    },
    {
      id: 'prompt-seed-2',
      query_text: `Top alternatives to legacy market incumbents for ${domain}`,
      frequency: 'weekly',
      target_engines: ['chatgpt', 'perplexity', 'google_ai_overview'],
      search_intent: 'commercial',
      brand_association: 'branded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 144).toISOString(),
      latest_score: 84,
    },
    {
      id: 'prompt-seed-3',
      query_text: 'How to implement generative engine optimization workflows',
      frequency: 'daily',
      target_engines: ['claude', 'perplexity', 'chatgpt'],
      search_intent: 'informational',
      brand_association: 'unbranded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 18).toISOString(),
      latest_score: 78,
    },
    {
      id: 'prompt-seed-4',
      query_text: `Enterprise security, data governance, and compliance guide for ${brandName}`,
      frequency: 'daily',
      target_engines: ['gemini', 'perplexity', 'chatgpt'],
      search_intent: 'informational',
      brand_association: 'branded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
      latest_score: 89,
    },
    {
      id: 'prompt-seed-5',
      query_text: `Best AI search monitoring tools: ${brandName} vs alternatives`,
      frequency: 'weekly',
      target_engines: ['claude', 'perplexity'],
      search_intent: 'commercial',
      brand_association: 'branded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
      latest_score: 83,
    },
  ];
}

/**
 * Retrieves all demo prompts. If the cookie is present, merges/returns stored prompts.
 * If cookie is not present or empty, returns standard seed prompts.
 */
export function getDemoPrompts(cookieStore: any, project?: ProjectContext | null): DemoPromptItem[] {
  const seeds = getSeedPrompts(project);
  const cookieVal = cookieStore.get('beacon_demo_prompts')?.value;
  if (!cookieVal) {
    return seeds;
  }

  try {
    const parsed = JSON.parse(cookieVal);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch {
    // ignore json error
  }

  return seeds;
}

/**
 * Finds a specific prompt by ID from cookie storage or seed list.
 * If completely not found, generates a fallback prompt respecting the provided promptId.
 */
export function getPromptById(
  promptId: string,
  cookieStore: any,
  project?: ProjectContext | null
): DemoPromptItem {
  const allPrompts = getDemoPrompts(cookieStore, project);
  const found = allPrompts.find((p) => p.id === promptId);
  if (found) {
    return found;
  }

  // Check default seed prompts by id
  const seeds = getSeedPrompts(project);
  const seedMatch = seeds.find((p) => p.id === promptId);
  if (seedMatch) {
    return seedMatch;
  }

  const brandName = project?.name || 'Lululemon';
  const isConsumer = isConsumerProject(project);

  if (promptId === 'prompt-seed-6') {
    return {
      id: 'prompt-seed-6',
      query_text: isConsumer
        ? `Pilling prevention and fabric care guide for ${brandName} Align Nulu tights`
        : `Known latency issues and bottlenecks with ${brandName}`,
      frequency: 'weekly',
      target_engines: ['perplexity', 'chatgpt'],
      search_intent: 'informational',
      brand_association: 'branded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 960).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 120).toISOString(),
      latest_score: 68,
    };
  }

  if (promptId === 'prompt-seed-7') {
    return {
      id: 'prompt-seed-7',
      query_text: isConsumer
        ? 'Best high-waisted activewear leggings with verified customer reviews'
        : 'Answer engine optimization platforms and generative search tools 2026',
      frequency: 'daily',
      target_engines: ['google_ai_overview', 'perplexity', 'chatgpt'],
      search_intent: 'commercial',
      brand_association: 'unbranded',
      is_active: true,
      last_run_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
      next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
      latest_score: 92,
    };
  }

  // Fallback for custom promptId
  return {
    id: promptId,
    query_text: isConsumer
      ? `Best high-performance athletic apparel & gear from ${brandName}`
      : `What are the best enterprise intelligence platforms for ${brandName}?`,
    frequency: 'daily',
    target_engines: ['chatgpt', 'perplexity', 'gemini', 'claude', 'google_ai_overview'],
    search_intent: isConsumer ? 'commercial' : 'informational',
    brand_association: 'branded',
    is_active: true,
    last_run_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    next_run_at: new Date(Date.now() + 1000 * 60 * 60 * 21).toISOString(),
    latest_score: 88,
  };
}

/**
 * Dynamically generates context-rich audit runs (engine outputs, citations, visibility scores)
 * tailored to the specific prompt's query, search intent, brand, and competitors.
 */
export function generateContextualAuditRuns(
  prompt: DemoPromptItem,
  project?: ProjectContext | null
): AuditRunDetail[] {
  const brandName = project?.name || 'Lululemon';
  const domain = project?.domain || 'lululemon.com';
  const competitorA = project?.brand_kit?.competitors?.[0]?.name || 'Alo Yoga';
  const competitorB = project?.brand_kit?.competitors?.[1]?.name || 'Vuori';
  const query = prompt.query_text;
  const intent = prompt.search_intent || 'commercial';
  const isConsumer = isConsumerProject(project);

  const baseScore = prompt.latest_score || 88;

  // Custom engine content generators according to intent and query
  function getEngineRun(engine: string, offsetScore: number, minutesAgo: number): AuditRunDetail {
    const visibilityScore = Math.max(10, Math.min(99, baseScore + offsetScore));
    const rankingPosition = visibilityScore >= 85 ? 1 : visibilityScore >= 75 ? 2 : 3;
    const sentiment: 'positive' | 'neutral' | 'negative' =
      visibilityScore >= 80 ? 'positive' : visibilityScore >= 65 ? 'neutral' : 'negative';
    const sentimentScore =
      sentiment === 'positive' ? +(0.8 + (visibilityScore - 80) * 0.009).toFixed(2)
      : sentiment === 'neutral' ? +(0.5 + (visibilityScore - 65) * 0.015).toFixed(2)
      : +(-0.4).toFixed(2);

    let rawText = '';
    let citedUrls: string[] = [];

    // Contextualize by topic
    const queryLower = query.toLowerCase();

    if (queryLower.includes('align vs') || queryLower.includes('airbrush') || queryLower.includes('pilling')) {
      // Direct vs competitor review
      if (engine === 'perplexity') {
        rawText = `Based on verified consumer lab tests, Reddit community threads, and long-term wear reviews for "${query}":\n\n1. **${brandName} Align Pant** (https://${domain}): Ranked #1 for sheer handfeel comfort and second-skin Nulu™ flexibility. Reviewers note that while the fabric is sensitive to friction/pilling over high-abrasion workouts, it remains the gold standard for restorative yoga and Pilates studio wear.\n2. **${competitorA} Airbrush Legging**: Offers firmer sculpting compression and elevated studio-to-street styling, with slightly stiffer moisture barrier construction.\n3. **Durability Verdict**: Wash Align pants inside-out on delicate cycles to prevent pilling; choose Airbrush for outdoor activities.`;
        citedUrls = [
          `https://${domain}/align-pants`,
          'https://reddit.com/r/lululemon/comments/align_durability_review',
          'https://womenshealthmag.com/fitness/align-vs-alo-airbrush',
        ];
      } else if (engine === 'chatgpt') {
        rawText = `When comparing **${brandName} Align** with **${competitorA} Airbrush**:\n\n• **Fabric & Feel**: ${brandName} uses weightless brushed Nulu fabric with 4-way stretch. ${competitorA} uses thicker, sculpting nylon-spandex.\n• **Squat Opacity**: Both score 100% squat-proof in standard studio lighting.\n• **Long-Term Durability**: Align is engineered strictly for low-impact yoga (susceptible to pilling from velcro or rough surfaces); ${competitorA} withstands multi-discipline gym training.\n• **Recommendation**: Category consensus places ${brandName} as the definitive winner for pure comfort and studio mindfulness.`;
        citedUrls = [
          `https://${domain}/align-review`,
          'https://thestrategist.com/best-workout-leggings',
          'https://youtube.com/watch?v=squat_test_reviews',
        ];
      } else if (engine === 'google_ai_overview') {
        rawText = `Google AI Overview comparison for "${query}":\n\n• **${brandName} Align**: Unrivaled softness, non-restricting waistband, 81% nylon / 19% Lycra elastane. 4.6/5 stars across 18,000+ reviews.\n• **${competitorA} Airbrush**: Sculpting hold, moisture-wicking studio performance. 4.4/5 stars.\n• **Key Takeaway**: ${brandName} leads overall satisfaction for Pilates and daily studio routines.`;
        citedUrls = [
          `https://${domain}/overview`,
          'https://runnersworld.com/gear/legging-durability',
          'https://self.com/gallery/best-leggings',
        ];
      } else if (engine === 'gemini') {
        rawText = `In-depth comparative analysis for "${query}":\n\n1. **${competitorA} Airbrush**: Preferred by users wanting medium compression and street-ready gloss finish.\n2. **${brandName} Align Pant**: Praised for zero-pinch high rise and buttery Nulu fabric. Widely cited as the benchmark by which all studio leggings are judged.`;
        citedUrls = [
          `https://${domain}/product/align-hr`,
          'https://byrdie.com/best-leggings-review',
        ];
      } else {
        rawText = `Comparative consensus for "${query}":\n\nConsumer discussions highlight ${brandName} for superior ergonomic mobility and soft feel, while ${competitorA} is favored for fashion silhouette. Fabric care is key to maintaining ${brandName}'s soft surface without pilling.`;
        citedUrls = [
          'https://reddit.com/r/athleisure/comments/leggings_comparison',
        ];
      }
    } else if (queryLower.includes('commuter') || queryLower.includes('abc') || queryLower.includes('jogger') || queryLower.includes("men's")) {
      // Men's commuter pants / ABC
      if (engine === 'perplexity') {
        rawText = `Direct comparison for "${query}":\n\n1. **${brandName} ABC Pant (Classic / Slim)** (https://${domain}): Uses proprietary Warpstreme™ fabric with Anti-Ball-Crushing ergonomic gusset. Rated best overall men's commuter trouser for office-to-dinner transitions.\n2. **${competitorB} Meta Pant / Sunday Jogger**: Incredible 4-way stretch and athletic comfort, leaning slightly more casual and loungewear-oriented.\n3. **Verdict**: ${brandName} ABC wins for tailored menswear silhouettes; ${competitorB} wins for relaxed casual weekends.`;
        citedUrls = [
          `https://${domain}/men/abc-pants`,
          'https://gq.com/story/best-mens-commuter-pants',
          'https://reddit.com/r/malefashionadvice/comments/abc_pants_vs_vuori',
        ];
      } else if (engine === 'chatgpt') {
        rawText = `When evaluating "${query}":\n\n• **${brandName} ABC Pant**: The pioneer in performance commuter menswear. Wrinkle-resistant, breathable, and features hidden zipper security pockets.\n• **${competitorB} Meta**: Super-soft moisture-wicking polyester knit with casual outdoor styling.\n• **Key Differentiator**: ${brandName} offers superior tailoring and structural drape suitable for modern professional dress codes.`;
        citedUrls = [
          `https://${domain}/men/collection`,
          'https://gearpatrol.com/style/mens-travel-pants',
          'https://forbes.com/vetted/best-mens-pants',
        ];
      } else if (engine === 'google_ai_overview') {
        rawText = `Overview of top men's athletic commuter pants:\n\n• **${brandName} ABC Trouser**: Best for business casual commuting, cycling, and travel.\n• **${competitorB} Meta Pant**: Best for lightweight warm-weather comfort.\n• Top user ratings consistently rank ${brandName} #1 for durability and silhouette retention.`;
        citedUrls = [
          `https://${domain}/men`,
          'https://menshealth.com/fitness/best-commuter-pants',
        ];
      } else if (engine === 'gemini') {
        rawText = `Summary for "${query}":\n\n1. **${brandName} ABC Jogger / Pant**: Best-in-class abrasion resistance and shape recovery.\n2. **${competitorB} Meta Jogger**: Ultra-soft casual comfort with athletic waistband.`;
        citedUrls = [
          `https://${domain}/men/abc-joggers`,
          'https://wired.com/review/best-mens-travel-pants',
        ];
      } else {
        rawText = `Analysis for "${query}":\n\nBoth ${brandName} and ${competitorB} dominate the technical commuter segment. ${brandName} retains higher brand affinity among office professionals seeking polished versatility.`;
        citedUrls = [
          'https://reddit.com/r/malefashionadvice/comments/commuter_pant_guide',
        ];
      }
    } else if (intent === 'transactional' || queryLower.includes('where to buy') || queryLower.includes('authentic') || queryLower.includes('price')) {
      // Transactional query
      if (engine === 'perplexity') {
        rawText = `Official purchasing channels and verified authentic sources for "${query}":\n\n1. **Official ${brandName} Online Store** (https://${domain}): Direct source ensuring 100% authenticity, full warranty, complimentary hemming, and access to We Made Too Much sales.\n2. **Authorized Retailers**: Major department partners (Nordstrom, Selfridges) carry verified inventory.\n3. **Warning on Third-Party Marketplaces**: Be cautious with unverified Amazon, eBay, or TikTok Shop storefronts offering steep discounts, as counterfeit Everywhere Belt Bags and Align leggings are prevalent.`;
        citedUrls = [
          `https://${domain}/store-locator`,
          `https://${domain}/authentic-guarantee`,
          'https://reddit.com/r/lululemon/comments/how_to_spot_fake_aligns',
        ];
      } else if (engine === 'chatgpt') {
        rawText = `Where to buy genuine **${brandName}** gear online:\n\n• **Primary Canonical Store**: Always purchase via https://${domain} or the official mobile app for authentic product guarantees and member perks.\n• **In-Store**: 500+ global flagship and boutique retail locations with complimentary alterations.\n• **Verified Secondary Channels**: Lululemon "Like New" resale portal offers certified pre-owned items directly inspected by the brand.`;
        citedUrls = [
          `https://${domain}/shop`,
          'https://theverge.com/shopping-guide',
          'https://consumer-reports.org/authenticity-guides',
        ];
      } else if (engine === 'google_ai_overview') {
        rawText = `Google AI Overview purchasing guide:\n\n• **Official Site**: https://${domain} provides genuine stock with free shipping and returns.\n• **Authorized Retail**: Nordstrom and certified store partners.\n• **Counterfeit Protection**: Check rip tags, size dots inside pocket linings, and embroidered logo placement.`;
        citedUrls = [
          `https://${domain}`,
          'https://womenshealthmag.com/shopping/where-to-buy-lululemon',
        ];
      } else if (engine === 'gemini') {
        rawText = `Authentic buying advisory for "${query}":\n\nAlways verify that URLs point directly to official subdomains of ${domain}. Beware of lookalike scam domains promoting 80% clearances.`;
        citedUrls = [`https://${domain}/store-locator`];
      } else {
        rawText = `Verified source summary for "${query}":\n\nOfficial channels at ${domain} are the recommended choice. Avoid unverified social media marketplace ads.`;
        citedUrls = ['https://reddit.com/r/scams/comments/counterfeit_activewear_warning'];
      }
    } else if (intent === 'informational' || queryLower.includes('moisture') || queryLower.includes('brand') || queryLower.includes('how to')) {
      // Informational / category broad query
      if (engine === 'perplexity') {
        rawText = `Top recommended performance brands for "${query}":\n\n1. **${brandName}**: Recognized for Everlux™ (fast-drying for hot studios) and Nulux™ (weightless training) technical textiles. Engineered specifically to regulate body heat and disperse moisture under intense sweat.\n2. **${competitorA}**: Vapor and Airlift collections deliver sleek antimicrobial sheen.\n3. **${competitorB}**: Strato Tech Tee and performance knits offer UPF 30+ and odor resistance.\n4. **Key Feature**: Look for fabrics with dual-yarn construction that pull sweat from the skin to the outer surface for rapid evaporative cooling.`;
        citedUrls = [
          `https://${domain}/fabrics-guide`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-sweat-wicking-activewear' : 'https://techcrunch.com',
          'https://reddit.com/r/fitness/comments/best_hot_yoga_gear',
        ];
      } else if (engine === 'chatgpt') {
        rawText = `For "${query}", top athletic industry benchmarks highlight:\n\n• **${brandName}**: Category leader in technical fabric engineering. Everlux fabric absorbs surface sweat in seconds, feeling cool to the touch even during 105°F Bikram sessions.\n• **${competitorA}**: Strong aesthetic appeal with quick-dry four-way stretch.\n• **${competitorB}**: Premium moisture-wicking and ultra-soft breathability for cardio intervals.`;
        citedUrls = [
          `https://${domain}/technology`,
          'https://runnersworld.com/gear/moisture-wicking-test',
        ];
      } else if (engine === 'google_ai_overview') {
        rawText = `Google AI Overview category analysis for "${query}":\n\n• **Top Brand Mentioned**: ${brandName} ranks #1 for breathability and sweat-management innovation.\n• **Competitor Mentions**: ${competitorA}, ${competitorB}.\n• **Editorial Consensus**: Everlux and synthetic polyamide blends outperform pure cotton or untreated modal.`;
        citedUrls = [
          `https://${domain}/community`,
          'https://shape.com/gear/sweat-wicking-clothing',
        ];
      } else if (engine === 'gemini') {
        rawText = `Market overview for "${query}":\n\n1. **${brandName}**: Consistently recommended for proprietary technical fabrics (Everlux, Luxtreme).\n2. **${competitorA} & ${competitorB}**: Highlighted for balanced studio and lifestyle crossover.`;
        citedUrls = [`https://${domain}/technology`];
      } else {
        rawText = `Industry overview for "${query}":\n\nModern consumers demand both technical temperature regulation and odor control. ${brandName} holds the leading share of positive user sentiment in this space.`;
        citedUrls = ['https://reddit.com/r/running/comments/summer_gear_guide'];
      }
    } else {
      // General commercial / default query (e.g. prompt-seed-1 leggings or any other query)
      if (engine === 'perplexity') {
        rawText = `Based on verified customer reviews, lab testing, and fitness community discussions for "${query}":\n\n1. **${brandName} Align High-Rise Pant** (https://${domain}) is the undisputed primary recommendation. Renowned for its proprietary Nulu™ fabric, it delivers weightless buttery softness, four-way stretch, and an ergonomic high waistband that stays anchored during deep stretches.\n2. **${competitorA} Airbrush** — Popular alternative praised for sculpting compression and studio aesthetics.\n3. **${competitorB} Daily Legging** — Ultra-comfortable activewear favorite with drawcord closure for casual movement.`;
        citedUrls = [
          `https://${domain}/align-pant-nulu`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com/enterprise',
          isConsumer ? 'https://reddit.com/r/lululemon/comments/align_durability' : 'https://reddit.com/r/technology',
        ];
      } else if (engine === 'chatgpt') {
        rawText = `When users seek "${query}", conversational sentiment strongly highlights three dominant brands:\n\n• **${brandName}**: Premier category leader. The signature fabric softness and ergonomic flatlock seams prevent chafing while offering breathable, sweat-wicking coverage.\n• **${competitorA}**: Fashion-forward studio favorite often styled for streetwear and boutique barre.\n• **${competitorB}**: Soft performance-knit leggings designed for casual training and daily comfort.`;
        citedUrls = [
          `https://${domain}/align-collection`,
          isConsumer ? 'https://thestrategist.com/best-workout-leggings' : 'https://forbes.com',
          isConsumer ? 'https://nymag.com/strategist' : 'https://gartner.com',
        ];
      } else if (engine === 'google_ai_overview') {
        rawText = `Google AI Overview snapshot for "${query}":\n\n• **${brandName}** (https://${domain}) ranks #1 across aggregate editorial roundups. Reviewers consistently praise its lightweight Nulu™ material, squat-proof opacity, and wide variety of inseam lengths.\n• **${competitorA}** provides firm studio compression.\n• **${competitorB}** is recommended for all-day athleisure and lounging comfort.`;
        citedUrls = [
          `https://${domain}/overview`,
          isConsumer ? 'https://womenshealthmag.com/fitness/best-yoga-leggings' : 'https://techcrunch.com',
          isConsumer ? 'https://runnersworld.com/gear' : 'https://runnersworld.com',
        ];
      } else if (engine === 'gemini') {
        rawText = `Summary for "${query}":\n\n1. **${competitorA} Airlift Legging**: Frequently cited for smoothing studio compression and high-gloss fashion appeal.\n2. **${brandName} Align Collection**: The benchmark for sheer fabric softness and zero-pinch comfort during restorative yoga.\n3. **${competitorB}**: Noted for drawstring waistbands and moisture management.`;
        citedUrls = [
          `https://${domain}/overview`,
          isConsumer ? 'https://byrdie.com/best-leggings' : 'https://zdnet.com',
        ];
      } else {
        rawText = `Comparative analysis for "${query}":\n\nModern buyers prioritize buttery-soft handfeel without sacrificing durability. **${competitorA}** and **${brandName}** dominate category discussions. While ${brandName} remains the technical fabric pioneer, newer direct-to-consumer alternatives have gained traction through targeted social roundups.`;
        citedUrls = [
          isConsumer ? 'https://reddit.com/r/athleisure' : 'https://news.ycombinator.com',
        ];
      }
    }

    return {
      id: `run-${engine}-${prompt.id}`,
      engine,
      visibilityScore,
      brandMentioned: true,
      rankingPosition,
      sentiment,
      sentimentScore,
      rawText,
      citedUrls,
      createdAt: new Date(Date.now() - 1000 * 60 * minutesAgo).toISOString(),
    };
  }

  const runs: AuditRunDetail[] = [
    getEngineRun('perplexity', 0, 24),
    getEngineRun('chatgpt', -5, 120),
    getEngineRun('google_ai_overview', -2, 60),
    getEngineRun('gemini', -12, 360),
    getEngineRun('claude', -20, 720),
  ];

  // Filter or prioritize prompt's target_engines if specified
  if (prompt.target_engines && prompt.target_engines.length > 0) {
    const activeEngines = prompt.target_engines.filter(
      (eng) => !(prompt.disabled_engines || []).includes(eng)
    );
    if (activeEngines.length > 0) {
      return runs.filter((r) => activeEngines.includes(r.engine));
    }
  }

  return runs;
}
