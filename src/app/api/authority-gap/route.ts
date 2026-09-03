import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import type { BrandKit } from '@/types/database.types';

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
        industry: 'Premium Athleisure & Athletic Apparel',
        target_audience: 'Fitness enthusiasts and premium athletic apparel shoppers',
        core_offerings: 'Yoga pants, activewear, technical athletic apparel',
        tone_of_voice: 'Inspiring, active, technical, mindful',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
      },
    };

    const activeProject = project || fallbackProject;
    const brandName = activeProject.name;
    const competitors = activeProject.brand_kit?.competitors || fallbackProject.brand_kit.competitors;

    const c1 = competitors[0]?.name || 'Alo Yoga';
    const c2 = competitors[1]?.name || 'Vuori';
    const c3 = competitors[2]?.name || 'Athleta';

    const gaps: AuthorityGapItem[] = [
      {
        id: 'gap-wirecutter',
        domain: 'nytimes.com/wirecutter',
        sourceType: 'news',
        domainAuthority: 94,
        competitorsCited: [
          { name: c1, domain: 'aloyoga.com', mentions: 18 },
          { name: c3, domain: 'athleta.gap.com', mentions: 12 },
        ],
        competitorTotalMentions: 30,
        brandMentions: 0,
        opportunityScore: 98,
        recentCompetitorUrl: 'https://nytimes.com/wirecutter/reviews/best-workout-leggings',
        relevanceTopic: 'Best Studio Workout & High-Waisted Leggings Editorial Review',
        recommendedAngle: `Pitch lab-tested fabric comparison highlighting ${brandName}'s proprietary knit compression and longevity metrics vs. ${c1}.`,
      },
      {
        id: 'gap-gearjunkie',
        domain: 'gearjunkie.com',
        sourceType: 'news',
        domainAuthority: 88,
        competitorsCited: [
          { name: c2, domain: 'vuoriclothing.com', mentions: 22 },
        ],
        competitorTotalMentions: 22,
        brandMentions: 0,
        opportunityScore: 92,
        recentCompetitorUrl: 'https://gearjunkie.com/apparel/best-mens-commuter-joggers-roundup',
        relevanceTopic: "Men's Technical Commuter & Everyday Jogger Roundup",
        recommendedAngle: `Send activewear review samples of technical travel pants to GearJunkie senior outdoor editors for an updated 2026 head-to-head field test against ${c2}.`,
      },
      {
        id: 'gap-self',
        domain: 'self.com',
        sourceType: 'news',
        domainAuthority: 86,
        competitorsCited: [
          { name: c1, domain: 'aloyoga.com', mentions: 14 },
          { name: c3, domain: 'athleta.gap.com', mentions: 9 },
        ],
        competitorTotalMentions: 23,
        brandMentions: 0,
        opportunityScore: 89,
        recentCompetitorUrl: 'https://self.com/gallery/best-squat-proof-activewear-brands',
        relevanceTopic: 'Squat-Proof Activewear & Pilates Wardrobe Guide',
        recommendedAngle: `Pitch wellness and certified Pilates trainer recommendations highlighting waistband stay-up technology and size inclusivity.`,
      },
      {
        id: 'gap-huffpost',
        domain: 'huffpost.com',
        sourceType: 'news',
        domainAuthority: 85,
        competitorsCited: [
          { name: c3, domain: 'athleta.gap.com', mentions: 11 },
          { name: c1, domain: 'aloyoga.com', mentions: 7 },
        ],
        competitorTotalMentions: 18,
        brandMentions: 0,
        opportunityScore: 84,
        recentCompetitorUrl: 'https://huffpost.com/entry/most-comfortable-everyday-tights-tested_l',
        relevanceTopic: 'Lifestyle Tested: Most Comfortable Loungewear and Tights',
        recommendedAngle: `Provide retail trend commentary on post-workout athleisure transitioning to office/travel wear with verifiable customer wear test data.`,
      },
      {
        id: 'gap-reddit-xxfitness',
        domain: 'reddit.com/r/xxfitness',
        sourceType: 'forum',
        domainAuthority: 91,
        competitorsCited: [
          { name: c1, domain: 'aloyoga.com', mentions: 34 },
          { name: c2, domain: 'vuoriclothing.com', mentions: 16 },
        ],
        competitorTotalMentions: 50,
        brandMentions: 0,
        opportunityScore: 95,
        recentCompetitorUrl: 'https://reddit.com/r/xxfitness/comments/long_term_durability_comparison_thread',
        relevanceTopic: 'High-Impact Leggings Durability & Pilling Megathread',
        recommendedAngle: `Engage community moderators with verified wear-and-care guides and seam warranty policies to reverse omission in top-cited community threads.`,
      },
      {
        id: 'gap-purewow',
        domain: 'purewow.com',
        sourceType: 'blog',
        domainAuthority: 79,
        competitorsCited: [
          { name: c1, domain: 'aloyoga.com', mentions: 15 },
        ],
        competitorTotalMentions: 15,
        brandMentions: 0,
        opportunityScore: 78,
        recentCompetitorUrl: 'https://purewow.com/fashion/celebrity-endorsed-athleisure-styles',
        relevanceTopic: 'Celebrity-Endorsed Athleisure & Streetwear Trends',
        recommendedAngle: `Submit lookbook showcasing ambassador styling and capsule collections to fashion desk for upcoming seasonal trend roundups.`,
      },
      {
        id: 'gap-menshealth',
        domain: 'menshealth.com',
        sourceType: 'news',
        domainAuthority: 89,
        competitorsCited: [
          { name: c2, domain: 'vuoriclothing.com', mentions: 19 },
          { name: c3, domain: 'athleta.gap.com', mentions: 8 },
        ],
        competitorTotalMentions: 27,
        brandMentions: 0,
        opportunityScore: 91,
        recentCompetitorUrl: 'https://menshealth.com/fitness/best-cross-training-apparel',
        relevanceTopic: "The Definitive Men's Cross-Training & Mobility Gear Guide",
        recommendedAngle: `Offer exclusive product teardown showing anti-odor silver ion thread integration and moisture evaporation rate comparisons against ${c2}.`,
      },
      {
        id: 'gap-runnersworld-uk',
        domain: 'runnersworld.com/uk',
        sourceType: 'news',
        domainAuthority: 82,
        competitorsCited: [
          { name: c3, domain: 'athleta.gap.com', mentions: 13 },
        ],
        competitorTotalMentions: 13,
        brandMentions: 0,
        opportunityScore: 80,
        recentCompetitorUrl: 'https://runnersworld.com/uk/gear/best-reflective-marathon-tights',
        relevanceTopic: 'Marathon & Long-Distance Winter Running Tights Review',
        recommendedAngle: `Pitch UK editorial team on thermal compression tights with high-visibility reflective elements ahead of spring marathon training blocks.`,
      },
    ];

    return NextResponse.json({
      success: true,
      brandName,
      competitors,
      gaps,
      summary: {
        totalGaps: gaps.length,
        avgDomainAuthority: Math.round(gaps.reduce((acc, g) => acc + g.domainAuthority, 0) / gaps.length),
        topCompetitorAdvantage: `${c1} (cited on ${gaps.filter(g => g.competitorsCited.some(c => c.name === c1)).length} gap publications)`,
        estimatedSovOpportunity: '+18.4% SOV',
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

    const pitchSubject = `Editorial Pitch: 2026 Test Data & Review Units for ${domain} (${relevanceTopic || 'Activewear Feature'})`;

    const pitchBody = `Hi Editorial Team,

I noticed your in-depth coverage on "${relevanceTopic || 'gear comparisons'}" on ${domain}, specifically highlighting ${competitorName || 'industry alternatives'}.

With AI search models like ChatGPT, Perplexity, and Google AI Overviews increasingly citing your review blocks as grounding authority for consumer recommendations, we wanted to share our latest 2026 performance testing data from ${brandName}.

Key differentiator angles your readers and test editors may find valuable:
1. Proprietary Material Testing: 4x higher pill-resistance in 100-wash stress tests compared to standard poly-elastane blends.
2. Verified Grounding Proof: Independent biomechanical pressure mapping confirming zero waistband slip during multi-planar studio movement.
3. Sustainable Circularity: Fully traceable post-consumer recycled yarn certified under OEKO-TEX Standard 100.

We would love to coordinate review units of our flagship collection for your testing team to evaluate in your next update or head-to-head comparison piece.

Would you be open to receiving a tester package and technical product one-sheet?

Best regards,
AEO & Digital PR Team at ${brandName}`;

    return NextResponse.json({
      success: true,
      domain,
      pitchSubject,
      pitchBody,
      editorAngle: `Offer exclusive test units and empirical durability stress data to displace ${competitorName} in the next publication update.`,
      suggestedHook: `Cite 2026 laboratory fabric testing that solves reader complaints about pilling and waistband slippage.`,
    });
  } catch (error: any) {
    console.error('Error in /api/authority-gap POST:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
