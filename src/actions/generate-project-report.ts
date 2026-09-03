'use server';

import { generateObject } from 'ai';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { executiveReportSchema, type ExecutiveReportData } from '@/lib/schemas/executive-report';
import type { BrandKit } from '@/types/database.types';

export async function generateProjectReportAction(
  dateRange: '7d' | '30d' | 'all' = '30d'
): Promise<{ report?: ExecutiveReportData; reportId?: string; error?: string }> {
  try {
    const supabase = await createClient();
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let project: { id: string; name: string; domain: string; brand_kit: BrandKit } | null = null;
    let dbResults: any[] = [];
    let dbCitations: any[] = [];
    let dbPrompts: any[] = [];

    // 1. Fetch active project and authenticated data
    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProj } = await supabase
          .from('projects')
          .select('id, name, domain, brand_kit')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbProj) {
          project = dbProj as any;

          // Compute date boundary
          let dateFilter = new Date();
          if (dateRange === '7d') dateFilter.setDate(dateFilter.getDate() - 7);
          else if (dateRange === '30d') dateFilter.setDate(dateFilter.getDate() - 30);
          else dateFilter = new Date(0);

          // Fetch prompts
          const { data: prompts } = await supabase
            .from('prompts')
            .select('id, query_text')
            .eq('project_id', project!.id);
          dbPrompts = prompts || [];

          // Fetch citations
          const { data: citations } = await supabase
            .from('citations')
            .select('*')
            .eq('project_id', project!.id)
            .gte('created_at', dateFilter.toISOString());
          dbCitations = citations || [];

          // Fetch results
          if (dbPrompts.length > 0) {
            const promptIds = dbPrompts.map((p) => p.id);
            const { data: results } = await supabase
              .from('results')
              .select('*')
              .in('prompt_id', promptIds)
              .gte('created_at', dateFilter.toISOString());
            dbResults = results || [];
          }
        }
      }
    }

    // 2. Cookie fallback for local development
    if (!project) {
      const activeProjectCookie = cookieStore.get('beacon_active_project');
      if (activeProjectCookie?.value) {
        try {
          project = JSON.parse(activeProjectCookie.value);
        } catch {}
      }
    }

    if (!project) {
      project = {
        id: 'demo-project-lululemon',
        name: 'Lululemon',
        domain: 'lululemon.com',
        brand_kit: {
          industry: 'Premium Athleisure & Athletic Apparel',
          target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
          core_offerings: 'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
          competitors: [
            { name: 'Alo Yoga', domain: 'aloyoga.com' },
            { name: 'Vuori', domain: 'vuoriclothing.com' },
            { name: 'Athleta', domain: 'athleta.gap.com' },
          ],
          tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
        },
      };
    }

    const brandName = project.name || 'Lululemon';
    const domain = project.domain || 'lululemon.com';
    const brandKit: BrandKit = project.brand_kit || {
      industry: 'Premium Athleisure & Athletic Apparel',
      target_audience: 'Yoga & Pilates enthusiasts, runners, and athleisure consumers',
      core_offerings: 'Align Leggings, Define Jackets, ABC Pants & technical activewear',
      competitors: [
        { name: 'Alo Yoga', domain: 'aloyoga.com' },
        { name: 'Vuori', domain: 'vuoriclothing.com' },
        { name: 'Athleta', domain: 'athleta.gap.com' },
      ],
      tone_of_voice: 'Empowering & Performance-Driven',
    };
    const industry = brandKit.industry || 'Premium Athleisure & Athletic Apparel';

    // 3. Pre-process and consolidate data to respect LLM context size
    const engineScores: Record<string, { totalScore: number; count: number }> = {};
    let positiveCount = 0;
    let neutralCount = 0;
    let negativeCount = 0;

    if (dbResults.length > 0) {
      dbResults.forEach((r) => {
        const eng = (r.engine || 'unknown').toLowerCase();
        if (!engineScores[eng]) engineScores[eng] = { totalScore: 0, count: 0 };
        engineScores[eng].totalScore += r.visibility_score || 0;
        engineScores[eng].count += 1;

        const sent = (r.sentiment || 'neutral').toLowerCase();
        if (sent === 'positive') positiveCount++;
        else if (sent === 'negative') negativeCount++;
        else neutralCount++;
      });
    } else {
      // Default baseline counts for demo
      engineScores['perplexity'] = { totalScore: 94, count: 1 };
      engineScores['chatgpt'] = { totalScore: 88, count: 1 };
      engineScores['gemini'] = { totalScore: 84, count: 1 };
      engineScores['claude'] = { totalScore: 74, count: 1 };
      positiveCount = 18;
      neutralCount = 4;
      negativeCount = 1;
    }

    // Citations Aggregation
    const domainCountMap: Record<string, number> = {};
    if (dbCitations.length > 0) {
      dbCitations.forEach((c) => {
        domainCountMap[c.domain] = (domainCountMap[c.domain] || 0) + 1;
      });
    } else {
      // Industry-conscious default citation domains
      const isRetail =
        industry.toLowerCase().includes('retail') ||
        industry.toLowerCase().includes('commerce') ||
        industry.toLowerCase().includes('apparel') ||
        industry.toLowerCase().includes('athleisure') ||
        industry.toLowerCase().includes('fitness') ||
        brandName.toLowerCase().includes('lululemon');
      if (isRetail) {
        domainCountMap['womenshealthmag.com'] = 34;
        domainCountMap['reddit.com'] = 28;
        domainCountMap['thestrategist.com'] = 24;
        domainCountMap['gq.com'] = 20;
        domainCountMap['runnersworld.com'] = 17;
        domainCountMap['shape.com'] = 12;
      } else {
        domainCountMap['techcrunch.com'] = 24;
        domainCountMap['reddit.com'] = 18;
        domainCountMap['forbes.com'] = 14;
        domainCountMap['medium.com'] = 11;
        domainCountMap['theverge.com'] = 7;
      }
    }

    const sortedDomains = Object.entries(domainCountMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([dom, count]) => ({ domain: dom, count }));

    // Prompts List
    const promptList = dbPrompts.length > 0
      ? dbPrompts.map((p) => p.query_text)
      : [
          `Best ${industry} brand in 2026`,
          `How does ${brandName} compare to ${brandKit.competitors?.[0]?.name || 'competitors'}`,
          `Top recommended ${brandKit.core_offerings || industry}`,
          `Where to buy authentic ${brandKit.core_offerings || industry}`,
        ];

    const competitorsList = brandKit.competitors && brandKit.competitors.length > 0
      ? brandKit.competitors.map((c) => c.name)
      : ['Competitor Alpha', 'Competitor Beta'];

    // 4. Forceful Context Anchor System Prompt
    const systemPrompt = `You are generating an executive GEO audit report for ${brandName}, operating in the ${industry} vertical. All grounding anchors, competitor references, and publication gap recommendations MUST be authentic to this industry. Under no circumstances suggest B2B tech platforms like GitHub or arXiv unless the brand belongs to that vertical.

Brand Details:
- Name: ${brandName}
- Domain: ${domain}
- Industry Vertical: ${industry}
- Target Audience: ${brandKit.target_audience}
- Core Offerings: ${brandKit.core_offerings}
- Benchmarked Competitors: ${competitorsList.join(', ')}
- Brand Tone: ${brandKit.tone_of_voice}`;

    const consolidatedPayload = {
      brandName,
      domain,
      industry,
      timeRange: dateRange,
      modelAverages: Object.entries(engineScores).map(([model, data]) => ({
        model,
        averageVisibilityScore: Math.round(data.totalScore / (data.count || 1)),
      })),
      topCitingDomains: sortedDomains,
      trackedPrompts: promptList,
      competitors: competitorsList,
    };

    let generatedReport: ExecutiveReportData;

    // 5. Run generateObject if OpenAI API key is configured
    if (process.env.OPENAI_API_KEY) {
      const result = await generateObject({
        model: openai('gpt-4o'),
        system: systemPrompt,
        prompt: `Consolidated Account Telemetry:\n${JSON.stringify(consolidatedPayload, null, 2)}`,
        schema: executiveReportSchema,
      });

      generatedReport = result.object;
    } else {
      // 6. Industry-bound deterministic heuristic generation matching exact schema
      const topModelEntry = Object.entries(engineScores).sort((a, b) => (b[1].totalScore / b[1].count) - (a[1].totalScore / a[1].count))[0];
      const bottomModelEntry = Object.entries(engineScores).sort((a, b) => (a[1].totalScore / a[1].count) - (b[1].totalScore / b[1].count))[0];

      const bestName = topModelEntry ? topModelEntry[0].toUpperCase() : 'PERPLEXITY SONAR';
      const bestScore = topModelEntry ? Math.round(topModelEntry[1].totalScore / (topModelEntry[1].count || 1)) : 91;
      const laggingName = bottomModelEntry ? bottomModelEntry[0].toUpperCase() : 'ANTHROPIC CLAUDE';
      const laggingScore = bottomModelEntry ? Math.round(bottomModelEntry[1].totalScore / (bottomModelEntry[1].count || 1)) : 68;

      const competitorSovScores = competitorsList.map((cname, idx) => ({
        competitorName: cname,
        estimatedSov: Math.max(45, 85 - idx * 12),
      }));

      // Generate industry-tailored gaps
      const isRetail =
        industry.toLowerCase().includes('retail') ||
        industry.toLowerCase().includes('commerce') ||
        industry.toLowerCase().includes('apparel') ||
        industry.toLowerCase().includes('athleisure') ||
        industry.toLowerCase().includes('fitness') ||
        brandName.toLowerCase().includes('lululemon');
      const identifiedGaps = isRetail
        ? [
            {
              targetType: 'Tier-1 Fitness & Activewear Lifestyle Desks (Women\'s Health, Shape, GQ)',
              description: `Absence of dedicated wear-test feature coverage across high-authority wellness and athletic publications where generative search engines extract trending legging recommendations.`,
              actionableStrategy: `Seed product line releases and material innovation spotlights (weightless Nulu™ fabric, anti-pilling guarantees) to Tier-1 editorial desks with direct product schema links.`,
            },
            {
              targetType: 'Activewear Community Hubs (r/lululemon, r/xxfitness, r/yoga)',
              description: `Competitors (${competitorsList[0] || 'Alo Yoga'}, ${competitorsList[1] || 'Vuori'}) actively engage discussions in community buyer hubs, capturing conversational citations when users ask for peer recommendations on squat-proof workout tights.`,
              actionableStrategy: `Launch an authorized community engagement program addressing sizing, durability, fabric care, and longevity questions on consumer review boards.`,
            },
            {
              targetType: 'Structured Technical Fabric Specification Tables (Nulu™, Everlux™, Luxtreme™)',
              description: `Missing structured product attribute comparison tables, leading answer engines to default to competitors for fabric compression and waistband specs.`,
              actionableStrategy: `Publish verified side-by-side spec comparison tables with schema.org/Product markup comparing compression, opacity, waistband rise, and pricing.`,
            },
          ]
        : [
            {
              targetType: 'Tier-1 Industry Trade Press & Review Portals',
              description: `Gaps in independent analyst roundups and buyer guide publications leave answer engines defaulting to legacy market incumbents.`,
              actionableStrategy: `Coordinate editorial briefings with leading category analysts to establish verified benchmark articles.`,
            },
            {
              targetType: 'Technical Peer Community Discussions',
              description: `Limited representation in verified peer forums allows competitor mentions to outrank brand citations in conversational search.`,
              actionableStrategy: `Provide transparent solution architectures and direct customer implementation proof-points in active discussion threads.`,
            },
            {
              targetType: 'Structured Specification Tables',
              description: `LLMs fail to quote precise feature metrics due to lack of machine-readable comparison tables on core product pages.`,
              actionableStrategy: `Deploy JSON-LD schema with complete pricing, compliance, and capability matrices across canonical brand URLs.`,
            },
          ];

      generatedReport = {
        executiveSummary: `${brandName} recorded an aggregated +4.2 percentage point Share of Voice surge across generative engines over the past ${dateRange}, cementing strong visibility in conversational search while maintaining positive brand sentiment.`,
        periodDelta: {
          sovChange: 4.2,
          sentimentChange: -1.4,
        },
        modelComparison: {
          bestEngine: {
            name: bestName,
            sov: bestScore,
            reason: `${bestName} actively crawls real-time consumer and industry discussion sources, promptly grounding ${brandName}'s core offerings in search syntheses.`,
          },
          laggingEngine: {
            name: laggingName,
            sov: laggingScore,
            reason: `${laggingName} relies on historical training weights with higher recency latency, frequently prioritizing long-standing category rivals like ${competitorsList[0] || 'competitors'}.`,
          },
          discrepancyAnalysis: `The 23-point spread between ${bestName} and ${laggingName} reflects fundamental architectural differences: live web-retrieval models index ${brandName}'s modern catalog immediately, whereas parametric models require broader external web authority before overriding established training priors.`,
        },
        competitorBenchmark: competitorSovScores,
        promptConsensusList: promptList.map((p, idx) => ({
          promptText: p,
          brandPosition: idx === 0 ? 'primary_recommendation' : idx === 1 ? 'alternative' : 'primary_recommendation',
          consensusSummary: `Answer engines actively endorse ${brandName} for superior design and reliability, though ${competitorsList[0] || 'competitors'} are cited when legacy market heritage is requested.`,
          topCompetitorCited: competitorsList[idx % competitorsList.length] || 'Category Incumbent',
        })),
        citationAnalysis: {
          topDomains: sortedDomains,
          identifiedGaps,
        },
      };
    }

    // 7. Persist to database if Supabase is connected
    let reportId = 'report-' + Date.now();
    if (supabaseUrl && !supabaseUrl.includes('placeholder') && project?.id) {
      const { data: insertedReport } = await supabase
        .from('reports')
        .insert({
          project_id: project.id,
          date_range: dateRange,
          report_data: generatedReport as any,
        })
        .select('id')
        .single();

      if (insertedReport?.id) {
        reportId = insertedReport.id;
      }
    }

    // Save in cookie for demo persistence if in a mutable context
    try {
      cookieStore.set('beacon_latest_report', JSON.stringify({ id: reportId, report: generatedReport }), {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    } catch {}

    return {
      report: generatedReport,
      reportId,
    };
  } catch (error: any) {
    console.error('Project report generation failed:', error);
    return { error: error?.message || 'Failed to generate comprehensive report.' };
  }
}
