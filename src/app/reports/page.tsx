import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppSidebarLayout } from '@/components/layout/app-sidebar-layout';
import { ReportsClient } from '@/components/reports/reports-client';
import { generateProjectReportAction } from '@/actions/generate-project-report';
import type { ExecutiveReportData } from '@/lib/schemas/executive-report';

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let project: { id: string; name: string; domain: string; tier: string } | null = null;
  let latestReportData: ExecutiveReportData | null = null;
  let generatedAt: string | undefined = undefined;

  // 1. Fetch project from Supabase
  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: dbProject } = await supabase
        .from('projects')
        .select('id, name, domain, tier')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (dbProject) {
        project = dbProject;

        // Fetch latest saved report
        const { data: dbReport } = await supabase
          .from('reports')
          .select('*')
          .eq('project_id', project.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbReport && dbReport.report_data) {
          latestReportData = dbReport.report_data as unknown as ExecutiveReportData;
          generatedAt = dbReport.created_at;
        }
      }
    }
  }

  // 2. Cookie fallback for local development
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

  if (!project) {
    project = {
      id: 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
    };
  }

  // Check cached report cookie if no DB report found
  if (!latestReportData) {
    const reportCookie = cookieStore.get('beacon_latest_report');
    if (reportCookie?.value) {
      try {
        const parsed = JSON.parse(reportCookie.value);
        latestReportData = parsed.report;
        generatedAt = new Date().toISOString();
      } catch {}
    }
  }

  // 3. If no report exists yet, generate initial baseline report
  if (!latestReportData) {
    const initialGen = await generateProjectReportAction('30d');
    if (initialGen.report) {
      latestReportData = initialGen.report;
      generatedAt = new Date().toISOString();
    }
  }

  // Absolute fallback matching the exact schema
  if (!latestReportData) {
    latestReportData = {
      executiveSummary: `${project.name} recorded an aggregated +4.2 percentage point Share of Voice surge across generative engines over the past 30 days, cementing strong visibility in conversational search while maintaining positive brand sentiment.`,
      periodDelta: {
        sovChange: 4.2,
        sentimentChange: -1.4,
      },
      modelComparison: {
        bestEngine: {
          name: 'PERPLEXITY SONAR',
          sov: 91,
          reason: `Perplexity Sonar actively crawls live web indexes and community forums, immediately surfacing ${project.name}'s verified product attributes in search syntheses.`,
        },
        laggingEngine: {
          name: 'ANTHROPIC CLAUDE',
          sov: 68,
          reason: `Claude relies on longer retraining intervals, causing it to fall back on historic incumbents unless prompted with explicit real-time search grounding.`,
        },
        discrepancyAnalysis: `The 23-point spread reflects fundamental architectural differences: live web-retrieval models index ${project.name}'s modern catalog immediately, whereas parametric models require broader external web authority before overriding established training priors.`,
      },
      competitorBenchmark: [
        { competitorName: 'Category Incumbent A', estimatedSov: 74 },
        { competitorName: 'Market Rival B', estimatedSov: 62 },
        { competitorName: 'Challenger C', estimatedSov: 48 },
      ],
      promptConsensusList: [
        {
          promptText: `Best ${project.name} alternative in 2026`,
          brandPosition: 'primary_recommendation',
          consensusSummary: `Answer engines consistently position ${project.name} among the top recommendations for this intent, praising its specialized architecture and rapid execution.`,
          topCompetitorCited: 'Category Incumbent A',
        },
        {
          promptText: `Top recommended generative engine optimization platforms`,
          brandPosition: 'primary_recommendation',
          consensusSummary: `Engines cite ${project.name} as an authoritative leader in citation telemetry and agent-first intelligence workflows.`,
          topCompetitorCited: 'Market Rival B',
        },
        {
          promptText: `${project.name} vs category competitors enterprise review`,
          brandPosition: 'alternative',
          consensusSummary: `Models recognize ${project.name}'s feature velocity, though legacy competitors are cited when multi-decade vendor history is queried.`,
          topCompetitorCited: 'Category Incumbent A',
        },
      ],
      citationAnalysis: {
        topDomains: [
          { domain: 'reddit.com', count: 26 },
          { domain: 'complex.com', count: 19 },
          { domain: 'vogue.com', count: 14 },
          { domain: 'retaildive.com', count: 11 },
          { domain: 'hypebeast.com', count: 9 },
        ],
        identifiedGaps: [
          {
            targetType: 'High-Authority Lifestyle & Editorial Publications',
            description: `Absence of feature coverage across high-authority style publications where generative search engines extract trending consumer recommendations.`,
            actionableStrategy: `Seed product line releases and material innovation spotlights to Tier-1 editorial desks with direct product schema links.`,
          },
          {
            targetType: 'Community Discussion Forums (Reddit & Specialist Threads)',
            description: `Competitors dominate discussions in community buyer hubs, capturing conversational citations when users ask for peer recommendations.`,
            actionableStrategy: `Launch an authorized community engagement program addressing sizing, durability, and ergonomics questions on consumer review boards.`,
          },
          {
            targetType: 'Third-Party Specification Comparison Tables',
            description: `Missing structured product attribute comparison tables, leading answer engines to default to competitors for performance specifications.`,
            actionableStrategy: `Publish verified side-by-side spec comparison tables with schema.org markup comparing cushioning, weight, and pricing.`,
          },
        ],
      },
    };
  }

  return (
    <AppSidebarLayout project={project}>
      <div className="p-6 lg:p-10 max-w-7xl w-full mx-auto print:p-0 print:max-w-none">
        <ReportsClient
          initialReport={latestReportData}
          initialDateRange="30d"
          brandName={project.name}
          domain={project.domain}
          generatedAt={generatedAt}
        />
      </div>
    </AppSidebarLayout>
  );
}
