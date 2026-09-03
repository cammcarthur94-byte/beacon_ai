import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { executeMultiEngineAudit } from '@/lib/ai/engine-runner';
import { sendVisibilityDropAlert } from '@/lib/email/resend';
import { extractDomain, categorizeSource } from '@/lib/citations/categorizer';
import { isTierEligibleForGoogleAi } from '@/lib/billing/tier-access';

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // 1. Authenticate with CRON_SECRET
  const authHeader = request.headers.get('authorization');
  const querySecret = request.nextUrl.searchParams.get('secret');
  const cronSecret = process.env.CRON_SECRET || 'dev_cron_secret_beacon_2026';

  const isAuthorized =
    authHeader === `Bearer ${cronSecret}` || querySecret === cronSecret;

  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized. Invalid or missing CRON_SECRET.' },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // If local development with placeholder Supabase credentials
  if (!supabaseUrl || !serviceKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.json({
      success: true,
      message: 'Local development mock cron completed.',
      timestamp: new Date().toISOString(),
      processedCount: 1,
      resultsCreated: 6,
      alertsTriggered: 0,
    });
  }

  const supabase = createClient<Database>(supabaseUrl, serviceKey);

  // 2. Query active prompts where next_run_at <= NOW()
  const { data: duePrompts, error: promptError } = await supabase
    .from('prompts')
    .select(`
      id,
      query_text,
      frequency,
      target_engines,
      projects (
        id,
        name,
        domain,
        tier,
        brand_kit,
        users (
          email
        )
      )
    `)
    .eq('is_active', true)
    .lte('next_run_at', new Date().toISOString());

  if (promptError) {
    return NextResponse.json(
      { error: `Database error querying prompts: ${promptError.message}` },
      { status: 500 }
    );
  }

  if (!duePrompts || duePrompts.length === 0) {
    return NextResponse.json({
      success: true,
      message: 'No prompts currently scheduled for execution.',
      processedCount: 0,
    });
  }

  const summary = {
    processedPrompts: 0,
    resultsCreated: 0,
    alertsTriggered: 0,
  };

  // 3. Process each due prompt
  for (const prompt of duePrompts as any[]) {
    const project = prompt.projects;
    if (!project) continue;

    const brandKit = project.brand_kit || {};
    const competitors = brandKit.competitors || [];
    const brandName = project.name;
    const domain = project.domain;
    
    // Tier-2 Gating: Check project tier access for Google AI engines
    const hasGoogleAiAccess = isTierEligibleForGoogleAi(project.tier);
    let targetEngines = (prompt.target_engines || ['chatgpt', 'gemini', 'claude', 'perplexity']) as string[];

    if (!hasGoogleAiAccess) {
      targetEngines = targetEngines.filter(
        (eng) => eng !== 'google_ai_overview' && eng !== 'google_ai_mode'
      );
      if (targetEngines.length === 0) {
        targetEngines = ['chatgpt', 'gemini', 'claude', 'perplexity'];
      }
    }

    // Fetch the previous result score for each engine to detect drops
    const { data: previousResults } = await supabase
      .from('results')
      .select('engine, visibility_score, brand_mentioned, cited_urls')
      .eq('prompt_id', prompt.id)
      .order('created_at', { ascending: false })
      .limit(targetEngines.length);

    const prevScoreMap = new Map<string, { score: number; brandMentioned: boolean; citedUrls: string[] }>();
    previousResults?.forEach((r) => {
      if (!prevScoreMap.has(r.engine)) {
        prevScoreMap.set(r.engine, {
          score: r.visibility_score,
          brandMentioned: r.brand_mentioned,
          citedUrls: r.cited_urls || [],
        });
      }
    });

    // Concurrently evaluate all target engines
    const evaluationResults = await executeMultiEngineAudit({
      queryText: prompt.query_text,
      brandName,
      domain,
      competitors,
      targetEngines,
    });

    // Accumulate all citation rows for batch insertion
    const allCitationRows: {
      project_id: string;
      run_id: string | null;
      engine: string;
      url: string;
      domain: string;
      source_type: string;
    }[] = [];

    // Save outputs to `results`, insert citations, and inspect drops
    for (const evaluation of evaluationResults) {
      const { data: insertedResult } = await supabase.from('results').insert({
        prompt_id: prompt.id,
        engine: evaluation.engine,
        visibility_score: evaluation.visibilityScore,
        brand_mentioned: evaluation.brandMentioned,
        sentiment: evaluation.sentiment,
        sentiment_score: evaluation.sentimentScore,
        raw_text: evaluation.rawText,
        cited_urls: evaluation.citedUrls,
        ranking_position: evaluation.rankingPosition,
      }).select('id').single();

      // Normalize & collect individual citations for batch insertion into public.citations
      if (evaluation.citedUrls && evaluation.citedUrls.length > 0) {
        const citationRows = evaluation.citedUrls.map((rawUrl) => {
          const domain = extractDomain(rawUrl);
          return {
            project_id: project.id,
            run_id: insertedResult?.id || null,
            engine: evaluation.engine,
            url: rawUrl,
            domain: domain || 'unknown.com',
            source_type: categorizeSource(domain, rawUrl),
          };
        });

        allCitationRows.push(...citationRows);
      }

      summary.resultsCreated++;

      // Check for significant drop (> 15%)
      const previousResult = prevScoreMap.get(evaluation.engine);
      const previousScore = previousResult?.score;
      const lostCitationBlock =
        previousResult !== undefined &&
        (previousResult.brandMentioned || previousResult.citedUrls.length > 0) &&
        !evaluation.brandMentioned &&
        evaluation.citedUrls.length === 0;
      if (
        previousScore !== undefined &&
        (previousScore - evaluation.visibilityScore >= 15 || lostCitationBlock)
      ) {
        summary.alertsTriggered++;
        const topCompetitorName = competitors[0]?.name || 'a competitor';
        const recipientEmail = project.users?.email || 'user@example.com';

        // 1. Resend email alert
        await sendVisibilityDropAlert({
          toEmail: recipientEmail,
          brandName,
          queryText: prompt.query_text,
          engine: evaluation.engine,
          previousScore,
          newScore: evaluation.visibilityScore,
          promptId: prompt.id,
        });

        // 2. Alert-to-Chat Pipeline: Proactive agent coworker message
        const proactiveAgentMessage = `Heads up. We just lost citations on the "${prompt.query_text}" tracker. ${topCompetitorName} took our spot on ${evaluation.engine}. Want me to rewrite ours stronger and update it?`;

        await supabase.from('chat_messages').insert({
          project_id: project.id,
          sender: 'agent',
          content: proactiveAgentMessage,
          metadata: {
            alert_unread: true,
            prompt_id: prompt.id,
            prompt_query_text: prompt.query_text,
            engine: evaluation.engine,
            alert_kind: lostCitationBlock ? 'lost_citation_block' : 'visibility_drop',
            previous_score: previousScore,
            new_score: evaluation.visibilityScore,
            drop: previousScore - evaluation.visibilityScore,
            competitor: topCompetitorName,
            query_text: prompt.query_text,
          },
        });
      }
    }

    if (allCitationRows.length > 0) {
      await supabase.from('citations').insert(allCitationRows);
    }

    // 4. Update prompt's last_run_at and compute next_run_at
    const now = new Date();
    const nextRun = new Date(now);
    if (prompt.frequency === 'daily') {
      nextRun.setDate(now.getDate() + 1);
    } else if (prompt.frequency === 'biweekly') {
      nextRun.setDate(now.getDate() + 14);
    } else {
      // weekly
      nextRun.setDate(now.getDate() + 7);
    }

    await supabase
      .from('prompts')
      .update({
        last_run_at: now.toISOString(),
        next_run_at: nextRun.toISOString(),
      })
      .eq('id', prompt.id);

    summary.processedPrompts++;
  }

  return NextResponse.json({
    success: true,
    message: 'Cron audits execution complete.',
    timestamp: new Date().toISOString(),
    ...summary,
  });
}
