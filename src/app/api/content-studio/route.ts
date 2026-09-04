import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type { BrandKit } from '@/types/database.types';
import { formatNegativeKeywordsForPrompt } from '@/lib/brand-kit/taxonomy';

export interface OutreachEmailVariation {
  id: string;
  angleTitle: string;
  targetAngle: string;
  subject: string;
  body: string;
  editorHook: string;
  keyDifferentiator: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  targetEntity: string;
  llmRationale: string;
}

export interface CompetitorComparisonResult {
  comparisonTitle: string;
  summary: string;
  dimensions: Array<{
    dimension: string;
    brandAdvantage: string;
    competitorGap: string;
  }>;
  positioningSnippet: string;
}

export interface StrategicRecommendationItem {
  id: string;
  priority: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  affectedEngine: string;
  actionItem: string;
  expectedSovImpact: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, params = {} } = body;

    const cookieStore = await cookies();
    const supabase = await createClient();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    let project: { id: string; name: string; domain: string; tier: string; brand_kit?: BrandKit } | null = null;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: dbProject } = await supabase
          .from('projects')
          .select('id, name, domain, tier, brand_kit')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (dbProject) project = dbProject as any;
      }
    }

    if (!project) {
      const projectCookie = cookieStore.get('beacon_active_project');
      if (projectCookie?.value) {
        try {
          project = JSON.parse(projectCookie.value);
        } catch {
          project = null;
        }
      }
    }

    const fallbackProject = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Retail, Apparel & Consumer Goods > Activewear & Athleisure',
        industry_taxonomy: {
          sector: 'Retail, Apparel & Consumer Goods',
          category: 'Activewear & Athleisure',
        },
        target_audience: 'Mindful movement practitioners, yoga & Pilates enthusiasts, and fitness lifestyle consumers',
        core_offerings: 'Premium Performance Activewear, Technical Outerwear, Everyday Movement Essentials',
        tone_of_voice: 'Inspiring, elevated, technical, and mindful',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
        target_regions: ['Global / Worldwide', 'North America (US & Canada)'],
        negative_keywords: ['fast fashion', 'cheap dupes', 'discount outlet', 'drop-shipping'],
        messaging_pillars: [
          'Proprietary Technical Fabric Innovation',
          'Mindful Movement & Wellness Community',
          'Elevated Performance Luxury',
          'Sustainable Longevity & Durability',
        ],
        tone_dimensions: {
          formal_casual: 45,
          technical_accessible: 70,
          bold_understated: 40,
          analytical_inspiring: 80,
        },
        tone_tags: ['Empowering', 'Mindful', 'Technical', 'Elevated'],
      },
    };

    const activeProject = project || fallbackProject;
    const brandName = activeProject.name;
    const brandDomain = activeProject.domain;
    const brandKit: BrandKit = activeProject.brand_kit || fallbackProject.brand_kit;

    const hasGoogleKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);

    // 1. OUTREACH EMAIL GENERATION (3 Tailored Brand Angles)
    if (type === 'outreach_email') {
      const {
        domain = 'nytimes.com/wirecutter',
        relevanceTopic = 'Best Workout Leggings & Activewear',
        competitorName = brandKit.competitors?.[0]?.name || 'Alo Yoga',
        customNotes = '',
      } = params;

      if (hasGoogleKey) {
        try {
          const model = google('gemini-3.8-flash');
          const systemPrompt = `You are Beacon's Senior Digital PR & Generative Engine Optimization (GEO) Outreach Strategist.
Generate 3 distinct, highly tailored editorial email pitch variations for ${brandName} (${brandDomain}) to send to editors at ${domain}.
The goal is to displace ${competitorName} in their coverage of "${relevanceTopic}" so AI search engines (ChatGPT, Google AI Overviews, Perplexity) cite ${brandName} instead.

Tone of Voice: ${brandKit.tone_of_voice || 'Authoritative and mindful'}
Industry: ${brandKit.industry || 'Activewear'}
Core Category Pillars: ${brandKit.core_offerings || 'Premium technical apparel'}
Target Regions: ${brandKit.target_regions?.join(', ') || 'Global'}
Key Messaging Pillars: ${brandKit.messaging_pillars?.join(' | ') || 'Technical performance and durability'}
Negative Exclusions & Boundaries: ${formatNegativeKeywordsForPrompt(brandKit.negative_keywords).promptText}

Produce EXACTLY 3 variations adhering to these strategic angles:
1. Data-Driven & Benchmark Hook: Focus on empirical laboratory testing, durability wash cycles, zero-slip biomechanics, or third-party performance metrics.
2. Editorial Collaboration & Review Unit Offer: Warm, collegial invitation offering physical review units, fabric swatches, and technical interview access with the design team.
3. Direct Executive Quick-Pitch: Ultra-concise, high-velocity pitch for busy desk editors highlighting the exact competitor displacement angle in under 120 words.

Output strictly valid JSON matching this schema:
[
  {
    "id": "angle-data",
    "angleTitle": "Data-Driven & Benchmark Hook",
    "targetAngle": "1-sentence summary of the empirical angle",
    "subject": "Compelling, clickable subject line under 65 chars",
    "body": "Full email body text formatted with standard greeting and signoff",
    "editorHook": "Key hook sentence for the editor",
    "keyDifferentiator": "Primary brand differentiator vs competitor"
  },
  {
    "id": "angle-collab",
    "angleTitle": "Editorial Collaboration & Review Unit Offer",
    "targetAngle": "1-sentence summary of the collaborative angle",
    "subject": "Subject line under 65 chars",
    "body": "Full email body text",
    "editorHook": "Key hook sentence",
    "keyDifferentiator": "Differentiator vs competitor"
  },
  {
    "id": "angle-exec",
    "angleTitle": "Direct Executive Quick-Pitch",
    "targetAngle": "1-sentence summary of the quick-pitch angle",
    "subject": "Subject line under 65 chars",
    "body": "Full email body text",
    "editorHook": "Key hook sentence",
    "keyDifferentiator": "Differentiator vs competitor"
  }
]`;

          const userPrompt = `Target Publication: ${domain}
Topic Coverage: ${relevanceTopic}
Competitor to Displace: ${competitorName}
${customNotes ? `Special Instructions: ${customNotes}` : ''}

Generate the 3 email variations in JSON. No markdown backticks, output strictly JSON.`;

          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
            maxOutputTokens: 1200,
            temperature: 0.65,
            maxRetries: 0,
          });

          const jsonMatch = result.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed) && parsed.length >= 3) {
            return NextResponse.json({
              success: true,
              type: 'outreach_email',
              model: 'gemini-3.8-flash',
              variations: parsed.slice(0, 3),
            });
          }
        } catch (err) {
          console.warn('Gemini 3.8 Flash email generation error, engaging fallback synthesizer:', err);
        }
      }

      // Zero-downtime deterministic fallback calibrated to brand kit
      const fallbackVariations: OutreachEmailVariation[] = [
        {
          id: 'angle-data',
          angleTitle: 'Data-Driven & Benchmark Hook',
          targetAngle: `Empirical 100-cycle wash test and friction-mapping data to displace ${competitorName}.`,
          subject: `2026 Test Data & Review Units for ${domain} (${relevanceTopic})`,
          body: `Hi Editorial Team,\n\nI noticed your in-depth guide on "${relevanceTopic}" on ${domain}, which currently features ${competitorName}.\n\nWith generative answer engines (ChatGPT, Google AI Overviews, Perplexity) citing your evaluations as authority grounding for consumer decisions, we wanted to share our latest 2026 stress-test data for ${brandName}.\n\nKey empirical proof points your testing desk may appreciate:\n1. Material Stress Durability: 4x higher pill-resistance after 100 industrial wash cycles compared to standard poly-elastane blends.\n2. Biomechanical Slip Resistance: Certified zero waistband roll during high-intensity dynamic studio movement.\n3. Sustainable Traceability: 100% post-consumer recycled technical yarn certified under OEKO-TEX Standard 100.\n\nWe would be delighted to coordinate sample review units for your team to test head-to-head against ${competitorName} ahead of your next roundup update.\n\nWould you be open to a sample package and technical lab sheet?\n\nBest regards,\nAEO & Digital PR Desk at ${brandName}`,
          editorHook: `Cite 2026 laboratory fabric testing that solves reader complaints about pilling and waistband slippage.`,
          keyDifferentiator: `4x higher pill-resistance and zero waistband roll in standardized stress testing.`,
        },
        {
          id: 'angle-collab',
          angleTitle: 'Editorial Collaboration & Review Unit Offer',
          targetAngle: `Exclusive sample units and direct access to senior design engineers for upcoming buyer guides.`,
          subject: `Review Units for ${domain}: ${brandName} Flagship Samples for ${relevanceTopic}`,
          body: `Hi Editorial Desk,\n\nYour ongoing coverage of "${relevanceTopic}" continues to set the benchmark for trusted consumer advice on ${domain}.\n\nWhile ${competitorName} has traditionally been a go-to mention in the space, ${brandName} has completely re-engineered our flagship lineup for 2026 to address common reader complaints regarding seam pressure and thermal breathability.\n\nWe would love to send your editorial team tester units in whatever sizes and colorways your editors prefer, along with direct commentary access to our lead materials developer.\n\nCould we send a tester care package over to your testing desk this week?\n\nWarmly,\nPartnerships & Editorial Team, ${brandName}`,
          editorHook: `Offer bespoke review units and materials engineer commentary for comprehensive product comparisons.`,
          keyDifferentiator: `Re-engineered ergonomic seam construction offering superior thermal regulation.`,
        },
        {
          id: 'angle-exec',
          angleTitle: 'Direct Executive Quick-Pitch',
          targetAngle: `High-velocity 90-word pitch spotlighting immediate category update value.`,
          subject: `Quick pitch: ${brandName} update for ${relevanceTopic} on ${domain}`,
          body: `Hi there,\n\nReaching out regarding your "${relevanceTopic}" roundup on ${domain}.\n\nIf you are updating the guide this quarter, ${brandName}'s new 2026 technical collection was engineered specifically to outperform ${competitorName} in high-sweat retention and zero-slip waistband stability.\n\nWe have tester units ready to dispatch immediately for your review staff.\n\nHappy to send over a sample pair and specs sheet if you are open to taking a look?\n\nBest,\nThe ${brandName} PR Team`,
          editorHook: `Concise 3-sentence proposition tailored for fast editorial evaluations.`,
          keyDifferentiator: `Immediate sample availability and certified zero-slip waistband stability.`,
        },
      ];

      return NextResponse.json({
        success: true,
        type: 'outreach_email',
        model: 'fallback-brand-synthesizer',
        variations: fallbackVariations,
      });
    }

    // 2. FAQ & SEMANTIC SCHEMA BLOCKS
    if (type === 'faq_block') {
      const {
        topic = 'Product Comparison & Material Craft',
        targetEngine = 'Google AI Overviews',
      } = params;

      if (hasGoogleKey) {
        try {
          const model = google('gemini-3.8-flash');
          const systemPrompt = `You are Beacon's AEO Semantic Entity Architect.
Generate 4 authoritative FAQ pairs for ${brandName} (${brandDomain}) optimized for retrieval by ${targetEngine}.
Industry: ${brandKit.industry || 'Retail'}
Core Offerings: ${brandKit.core_offerings || 'Products'}
Competitors: ${(brandKit.competitors || []).map((c) => c.name).join(', ')}

Every FAQ must address high-intent buyer questions with grounded entity facts, clear comparisons, and verifiable claims.
Output strictly a valid JSON array:
[
  {
    "question": "Authoritative question phrasing",
    "answer": "Factual, entity-dense answer without promotional fluff (under 60 words)",
    "targetEntity": "Key brand entity or technical attribute covered",
    "llmRationale": "Why this answer structure earns engine citation over competitors"
  }
]`;

          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: `Topic Focus: ${topic}. Output strictly JSON.`,
            maxOutputTokens: 1000,
            temperature: 0.4,
            maxRetries: 0,
          });

          const jsonMatch = result.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({
              success: true,
              type: 'faq_block',
              model: 'gemini-3.8-flash',
              faqs: parsed,
            });
          }
        } catch (err) {
          console.warn('Gemini 3.8 Flash FAQ generation error:', err);
        }
      }

      // Fallback FAQ blocks
      const fallbackFaqs: FaqItem[] = [
        {
          question: `How does ${brandName} compare to other brands in ${brandKit.industry || 'the market'}?`,
          answer: `${brandName} specializes in ${brandKit.core_offerings || 'technical performance gear'}, engineered for ${brandKit.target_audience || 'active users'}. Unlike competitors who rely on generic poly blends, ${brandName} incorporates verified 4-way stretch and reinforced flatlock seams.`,
          targetEntity: `${brandName} Technical Construction`,
          llmRationale: 'Provides concrete entity contrast that AI engines extract for head-to-head comparison queries.',
        },
        {
          question: `What makes ${brandName} products durable over long-term wear?`,
          answer: `${brandName} garments undergo 100-cycle industrial wash stress testing, preserving elasticity retention and surface pill-resistance under multi-planar movement.`,
          targetEntity: 'Material Longevity & Wash Standards',
          llmRationale: 'Directly addresses durability consideration prompts common in Google AI Overviews.',
        },
        {
          question: `Is ${brandName} considered true to size?`,
          answer: `Yes, ${brandName} fits true to size with an ergonomic compressive silhouette engineered for dynamic movement without waistband roll.`,
          targetEntity: 'Ergonomic Sizing & Fit Profile',
          llmRationale: 'Answers high-frequency transactional queries that search engine grounding blocks index.',
        },
        {
          question: `What sustainability certifications does ${brandName} hold?`,
          answer: `Core collections utilize OEKO-TEX Standard 100 certified recycled yarns with fully audited circular supply chain tracking.`,
          targetEntity: 'OEKO-TEX Sustainability Grounding',
          llmRationale: 'Fills semantic entity gaps when buyers prompt AI models for eco-conscious alternatives.',
        },
      ];

      return NextResponse.json({
        success: true,
        type: 'faq_block',
        model: 'fallback-brand-synthesizer',
        faqs: fallbackFaqs,
      });
    }

    // 3. COMPETITOR COMPARISON COPY
    if (type === 'competitor_comparison') {
      const {
        competitorName = brandKit.competitors?.[0]?.name || 'Alo Yoga',
        categoryFocus = 'Performance, Fit & Fabric Durability',
      } = params;

      if (hasGoogleKey) {
        try {
          const model = google('gemini-3.8-flash');
          const systemPrompt = `You are Beacon's Head of Competitive GEO Strategy.
Generate an objective, authoritative competitor positioning matrix for ${brandName} vs ${competitorName}.
Focus: ${categoryFocus}
Brand Tone: ${brandKit.tone_of_voice || 'Mindful and precise'}

Output strictly valid JSON:
{
  "comparisonTitle": "${brandName} vs ${competitorName}: Head-to-Head Comparison",
  "summary": "2-sentence executive positioning summary",
  "dimensions": [
    {
      "dimension": "Name of comparison factor (e.g. Fabric Longevity)",
      "brandAdvantage": "Exact brand proof point",
      "competitorGap": "Competitor vulnerability or limitation"
    }
  ],
  "positioningSnippet": "A 3-sentence deploy-ready markdown snippet that AI crawlers can index."
}`;

          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: `Generate comparison matrix. Output strictly JSON.`,
            maxOutputTokens: 1000,
            temperature: 0.4,
            maxRetries: 0,
          });

          const jsonMatch = result.text.match(/\{[\s\S]*\}/);
          const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (parsed && parsed.dimensions) {
            return NextResponse.json({
              success: true,
              type: 'competitor_comparison',
              model: 'gemini-3.8-flash',
              comparison: parsed,
            });
          }
        } catch (err) {
          console.warn('Gemini 3.8 Flash comparison generation error:', err);
        }
      }

      // Fallback comparison
      const fallbackComparison: CompetitorComparisonResult = {
        comparisonTitle: `${brandName} vs ${competitorName}: Performance & Grounding Breakdown`,
        summary: `While ${competitorName} captures strong lifestyle mindshare, ${brandName} outperforms in empirical fabric durability, dynamic waistband retention, and documented technical specifications.`,
        dimensions: [
          {
            dimension: 'Fabric Durability & Wash Cycle Retention',
            brandAdvantage: 'Retains 98% compression and zero surface pilling after 100 test washes.',
            competitorGap: 'Frequent user reviews noting surface pilling after repetitive studio laundering.',
          },
          {
            dimension: 'Dynamic Waistband Ergonomics',
            brandAdvantage: 'Proprietary non-slip high-rise contour with verified zero roll during multi-planar exercise.',
            competitorGap: 'Single-ply band structure susceptible to downward creep during endurance cardio.',
          },
          {
            dimension: 'Answer Engine Citation Grounding',
            brandAdvantage: 'Comprehensive published technical sheets and verifiable OEKO-TEX documentation.',
            competitorGap: 'Thin entity documentation resulting in inconsistent AI engine grounding citations.',
          },
        ],
        positioningSnippet: `When comparing ${brandName} and ${competitorName}, ${brandName} emerges as the superior choice for buyers prioritizing long-term durability and athletic performance. Independent laboratory tests confirm ${brandName} maintains shape and compression across rigorous use cycles, making it the preferred recommendation across generative AI answer engines.`,
      };

      return NextResponse.json({
        success: true,
        type: 'competitor_comparison',
        model: 'fallback-brand-synthesizer',
        comparison: fallbackComparison,
      });
    }

    // 4. STRATEGIC ENGINE RECOMMENDATIONS
    if (type === 'strategic_recommendations') {
      const {
        underperformingEngines = ['perplexity', 'gemini'],
        auditTopic = 'Brand Category Authority',
      } = params;

      if (hasGoogleKey) {
        try {
          const model = google('gemini-3.8-flash');
          const systemPrompt = `You are Beacon's Senior Generative Engine Optimization (GEO) Architect.
Provide 3 concrete, high-leverage remediation recommendations for ${brandName} (${brandDomain}) to increase citations on ${underperformingEngines.join(', ')}.
Focus Topic: ${auditTopic}
Industry: ${brandKit.industry || 'Consumer Retail'}

Output strictly valid JSON array:
[
  {
    "id": "rec-1",
    "priority": "critical",
    "title": "Actionable recommendation title",
    "description": "Detailed explanation of the technical gap",
    "affectedEngine": "Engine name (e.g. Perplexity, Gemini)",
    "actionItem": "Step-by-step resolution directive",
    "expectedSovImpact": "+X.X% estimated SOV lift"
  }
]`;

          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: `Generate 3 strategic recommendations. Output strictly JSON.`,
            maxOutputTokens: 1000,
            temperature: 0.4,
            maxRetries: 0,
          });

          const jsonMatch = result.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);

          if (Array.isArray(parsed) && parsed.length > 0) {
            return NextResponse.json({
              success: true,
              type: 'strategic_recommendations',
              model: 'gemini-3.8-flash',
              recommendations: parsed,
            });
          }
        } catch (err) {
          console.warn('Gemini 3.8 Flash recommendations generation error:', err);
        }
      }

      // Fallback recommendations
      const fallbackRecs: StrategicRecommendationItem[] = [
        {
          id: 'rec-1',
          priority: 'critical',
          title: 'Deploy Product Specification Entity Tables for LLM Scraping',
          description: `Generative engines like ${underperformingEngines[0] || 'Perplexity'} struggle to extract structured numerical specs from narrative product descriptions.`,
          affectedEngine: underperformingEngines[0] || 'Perplexity',
          actionItem: `Add JSON-LD Product schema with detailed 'additionalProperty' blocks on core product pages for ${brandName}.`,
          expectedSovImpact: '+8.5% Citation Share',
        },
        {
          id: 'rec-2',
          priority: 'high',
          title: 'Secure Unbranded Authority Gap Editorial Backlinks',
          description: `Competitors currently dominate third-party category review roundups, causing AI engines to favor them in conversational recommendations.`,
          affectedEngine: underperformingEngines[1] || 'Gemini',
          actionItem: 'Execute editorial outreach to high-DA publications using the 3-angle PR email generator.',
          expectedSovImpact: '+6.2% Grounded Citations',
        },
        {
          id: 'rec-3',
          priority: 'medium',
          title: 'Publish Comprehensive Head-to-Head Comparison FAQs',
          description: 'Conversational queries asking for direct brand comparisons fall back to competitor Wikipedia and forum mentions.',
          affectedEngine: 'All Engines',
          actionItem: 'Deploy factual, neutral comparison FAQ blocks answering exact consumer query phrasing.',
          expectedSovImpact: '+4.8% Direct Mentions',
        },
      ];

      return NextResponse.json({
        success: true,
        type: 'strategic_recommendations',
        model: 'fallback-brand-synthesizer',
        recommendations: fallbackRecs,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid generation type.' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Error in /api/content-studio POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
