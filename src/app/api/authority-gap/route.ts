import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type { BrandKit } from '@/types/database.types';
import { parseActiveProjectCookie, isLegacyMockProject } from '@/lib/project-utils';

export interface AuthorityGapItem {
  id: string;
  domain: string;
  sourceType: 'news' | 'forum' | 'blog' | 'documentation';
  domainAuthority: number;
  competitorsCited: Array<{
    name: string;
    domain: string;
    mentions: number;
  }>;
  competitorTotalMentions: number;
  brandMentions: number;
  opportunityScore: number;
  recentCompetitorUrl: string;
  relevanceTopic: string;
  recommendedAngle: string;
}

export async function GET(request: NextRequest) {
  try {
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
        project = parseActiveProjectCookie(projectCookie.value);
        if (!project) {
          cookieStore.delete('beacon_active_project');
        }
      }
    } else if (isLegacyMockProject(project)) {
      project = null;
    }

    const fallbackProject = {
      id: 'default-workspace-project',
      name: 'My Brand',
      domain: 'example.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Technology & Business',
        target_audience: 'Modern enterprise teams and decision makers',
        core_offerings: 'Autonomous AI Search & Brand Optimization',
        tone_of_voice: 'Professional, Authoritative, and Direct',
        competitors: [],
      },
    };

    const activeProject = project || fallbackProject;
    const brandName = activeProject.name;
    const competitors = activeProject.brand_kit?.competitors || [];

    const gaps: AuthorityGapItem[] = [];

    return NextResponse.json({
      success: true,
      brandName,
      competitors,
      gaps,
      summary: {
        totalGaps: 0,
        avgDomainAuthority: 0,
        topCompetitorAdvantage: 'No competitor gaps detected yet',
        estimatedSovOpportunity: '0% SOV',
      },
    });
  } catch (error: any) {
    console.error('Error in /api/authority-gap GET:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domain, relevanceTopic, competitorName, brandName = 'Our Brand' } = body;

    const hasGoogleKey = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY);

    let variations: Array<{
      id: string;
      angleTitle: string;
      targetAngle: string;
      subject: string;
      body: string;
      editorHook: string;
      keyDifferentiator: string;
    }> = [];

    if (hasGoogleKey) {
      const candidates = ['gemini-3.8-flash', 'gemini-3.5-flash'];
      for (const candidate of candidates) {
        if (variations.length >= 3) break;
        try {
          const model = google(candidate);
          const systemPrompt = `You are Beacon's Senior Digital PR Strategist.
Generate 3 distinct, highly tailored email pitches for ${brandName} to send to editors at ${domain}.
Goal: Displace ${competitorName || 'competitors'} in coverage of "${relevanceTopic || 'category roundup'}".

Provide 3 variations:
1. Data-Driven & Benchmark Hook (empirical stress data, durability wash metrics)
2. Editorial Collaboration & Review Unit Offer (samples, materials expert commentary)
3. Direct Executive Quick-Pitch (concise 80-word pitch)

Output strictly valid JSON array:
[
  {
    "id": "angle-data",
    "angleTitle": "Data-Driven & Benchmark Hook",
    "targetAngle": "Summary of empirical data hook",
    "subject": "Subject under 60 chars",
    "body": "Full professional email body",
    "editorHook": "Hook for editor",
    "keyDifferentiator": "Primary proof point"
  },
  {
    "id": "angle-collab",
    "angleTitle": "Editorial Collaboration & Review Unit Offer",
    "targetAngle": "Summary of collaboration angle",
    "subject": "Subject line",
    "body": "Full email body",
    "editorHook": "Hook for editor",
    "keyDifferentiator": "Primary proof point"
  },
  {
    "id": "angle-exec",
    "angleTitle": "Direct Executive Quick-Pitch",
    "targetAngle": "Summary of quick pitch",
    "subject": "Subject line",
    "body": "Full email body",
    "editorHook": "Hook for editor",
    "keyDifferentiator": "Primary proof point"
  }
]`;

          const result = await generateText({
            model,
            system: systemPrompt,
            prompt: `Publication: ${domain}\nTopic: ${relevanceTopic}\nCompetitor: ${competitorName}\nOutput strictly JSON array.`,
            maxOutputTokens: 1200,
            temperature: 0.65,
            maxRetries: 0,
          });

          const jsonMatch = result.text.match(/\[\s*\{[\s\S]*\}\s*\]/);
          const cleanJson = jsonMatch ? jsonMatch[0] : result.text.replace(/```json/g, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed) && parsed.length >= 3) {
            variations = parsed.slice(0, 3);
            break;
          }
        } catch (err) {
          console.warn(`Gemini generation (${candidate}) in authority-gap fallback:`, err);
        }
      }
    }

    if (variations.length === 0) {
      variations = [
        {
          id: 'angle-data',
          angleTitle: 'Data-Driven & Benchmark Hook',
          targetAngle: `Empirical 100-cycle wash test and friction-mapping data to displace ${competitorName}.`,
          subject: `2026 Test Data & Review Units for ${domain} (${relevanceTopic || 'Gear Feature'})`,
          body: `Hi Editorial Team,\n\nI noticed your in-depth coverage on "${relevanceTopic || 'gear comparisons'}" on ${domain}, specifically highlighting ${competitorName || 'industry alternatives'}.\n\nWith AI search models like ChatGPT, Perplexity, and Google AI Overviews increasingly citing your review blocks as grounding authority for consumer recommendations, we wanted to share our latest 2026 performance testing data from ${brandName}.\n\nKey differentiator angles your readers and test editors may find valuable:\n1. Proprietary Material Testing: 4x higher pill-resistance in 100-wash stress tests compared to standard poly-elastane blends.\n2. Verified Grounding Proof: Independent biomechanical pressure mapping confirming zero waistband slip during multi-planar studio movement.\n3. Sustainable Circularity: Fully traceable post-consumer recycled yarn certified under OEKO-TEX Standard 100.\n\nWe would love to coordinate review units of our flagship collection for your testing team to evaluate in your next update or head-to-head comparison piece.\n\nWould you be open to receiving a tester package and technical product one-sheet?\n\nBest regards,\nAEO & Digital PR Team at ${brandName}`,
          editorHook: `Offer exclusive test units and empirical durability stress data to displace ${competitorName} in the next publication update.`,
          keyDifferentiator: `4x higher pill-resistance and zero waistband roll in standardized stress testing.`,
        },
        {
          id: 'angle-collab',
          angleTitle: 'Editorial Collaboration & Review Unit Offer',
          targetAngle: `Complimentary tester package and direct interview access to materials design team.`,
          subject: `Review Units: ${brandName} Flagship Samples for ${domain} (${relevanceTopic || 'Testing'})`,
          body: `Hi Editorial Desk,\n\nYour recent evaluations of "${relevanceTopic || 'gear'}" on ${domain} continue to serve as the benchmark guide for prospective buyers.\n\nAhead of your upcoming category refresh, ${brandName} has released our 2026 flagship collection engineered specifically to address common user frustrations regarding fabric pilling and compression loss.\n\nWe would be thrilled to provide your testing staff with full-range sample units and direct access to our materials engineers for any background commentary.\n\nCould we dispatch a review package to your testing desk this week?\n\nWarm regards,\nPR & Editorial Team at ${brandName}`,
          editorHook: `Provide bespoke review units and materials engineer commentary for comprehensive product comparisons.`,
          keyDifferentiator: `Re-engineered ergonomic seam construction offering superior thermal regulation.`,
        },
        {
          id: 'angle-exec',
          angleTitle: 'Direct Executive Quick-Pitch',
          targetAngle: `Concise 3-sentence pitch highlighting immediate category update value.`,
          subject: `Quick pitch: ${brandName} update for ${relevanceTopic || 'roundup'} on ${domain}`,
          body: `Hi there,\n\nReaching out regarding your "${relevanceTopic || 'gear roundup'}" on ${domain}.\n\nIf you are refreshing the piece this season, ${brandName}'s new 2026 lineup was engineered to outperform ${competitorName || 'the current alternatives'} in durability and waistband slip resistance.\n\nWe have tester units ready to dispatch immediately for your testing staff.\n\nWould you be open to receiving a test pair?\n\nBest,\nThe ${brandName} Team`,
          editorHook: `Concise 3-sentence proposition tailored for fast editorial evaluations.`,
          keyDifferentiator: `Immediate sample availability and certified zero-slip waistband stability.`,
        },
      ];
    }

    const primary = variations[0];

    return NextResponse.json({
      success: true,
      domain,
      pitchSubject: primary.subject,
      pitchBody: primary.body,
      editorAngle: primary.editorHook,
      suggestedHook: primary.keyDifferentiator,
      variations,
    });
  } catch (error: any) {
    console.error('Error in /api/authority-gap POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
