import { cookies } from 'next/headers';
import {
  streamText,
  tool,
  convertToModelMessages,
  createUIMessageStreamResponse,
  createUIMessageStream,
  type UIMessage,
  type ToolSet,
} from 'ai';
import { z } from 'zod';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { createClient } from '@/lib/supabase/server';
import type { BrandKit } from '@/types/database.types';
import {
  buildSentinelSystemPrompt,
  alertContextToPromptLine,
  type WorkspaceGrounding,
} from '@/lib/consultant/system-prompt';
import {
  executeQueryAuditTelemetry,
  executeAnalyzeCitationGap,
  executeDraftRewrite,
  pickDefaultEntities,
} from '@/lib/consultant/tools';
import { generateDraftRewrite } from '@/lib/consultant/draft-generator';
import { persistChatMessage } from '@/lib/consultant/chat-store';

export const maxDuration = 30;

interface ChatRequestBody {
  messages: UIMessage[];
  projectId?: string;
  unreadAlerts?: Array<{
    id: string;
    promptQueryText?: string | null;
    engine?: string | null;
    competitor?: string | null;
    drop?: number | null;
  }>;
}

type WorkspaceProject = {
  id: string;
  name: string;
  domain: string;
  tier: string;
  brand_kit: BrandKit;
};

/**
 * Null-object Supabase stub used when no Supabase credentials are configured
 * (pristine local dev). Tools then return "no data available" instead of
 * crashing, and the agent still answers from the grounded brand kit.
 */
function createNoopSupabase(): never {
  const fail = (): never => {
    throw new Error('SUPABASE_NOT_CONFIGURED');
  };
  return new Proxy(
    {},
    {
      get() {
        return fail;
      },
    }
  ) as never;
}

function resolveWorkspace(
  brandKit: BrandKit,
  fallbackProjectId: string
): WorkspaceGrounding {
  return {
    projectId: fallbackProjectId,
    brandName: brandKit.name || 'Lululemon',
    domain: brandKit.domain || 'lululemon.com',
    tier: brandKit.tier || 'starter',
    brandKit,
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequestBody;
  const uiMessages = Array.isArray(body.messages) ? body.messages : [];

  // ---------------------------------------------------------------------------
  // 1. Identity + workspace resolution (RLS-scoped)
  // ---------------------------------------------------------------------------
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseConfigured =
    !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');

  let project: {
    id: string;
    name: string;
    domain: string;
    tier: string;
    brand_kit: BrandKit;
  } | null = null;

  const supabase = supabaseConfigured ? await createClient() : null;

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Authentication required.' }, { status: 401 });
    }

    const { data: projects } = await supabase
      .from('projects')
      .select('id, name, domain, tier, brand_kit')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);
    if (projects && projects.length > 0) {
      project = projects[0] as WorkspaceProject;
    }

    if (!project) {
      return Response.json({ error: 'No workspace is available for this account.' }, { status: 404 });
    }
  }

  // Demo mode fallback: mirror the active-project cookie used across the app.
  if (!project) {
    const activeProjectCookie = cookieStore.get('beacon_active_project')?.value;
    if (activeProjectCookie) {
      try {
        const parsed = JSON.parse(activeProjectCookie);
        if (parsed?.id && parsed?.brand_kit) {
          project = {
            id: parsed.id,
            name: parsed.name || 'Lululemon',
            domain: parsed.domain || 'lululemon.com',
            tier: parsed.tier || 'starter',
            brand_kit: parsed.brand_kit as BrandKit,
          };
        }
      } catch {
        project = null;
      }
    }
  }

  // Hard fallback so the agent remains functional in pristine local dev.
  if (!project) {
    project = {
      id: body.projectId || 'demo-project-lululemon',
      name: 'Lululemon',
      domain: 'lululemon.com',
      tier: 'enterprise',
      brand_kit: {
        industry: 'Premium Athleisure & Athletic Apparel',
        target_audience:
          'Mindful movement practitioners, yoga & Pilates enthusiasts, runners, gym-goers, and fitness lifestyle consumers',
        core_offerings:
          'Align Pant (Nulu fabric), Define Jacket, Wunder Train tights, ABC Joggers, Everywhere Belt Bag & technical athleisure',
        competitors: [
          { name: 'Alo Yoga', domain: 'aloyoga.com' },
          { name: 'Vuori', domain: 'vuoriclothing.com' },
          { name: 'Athleta', domain: 'athleta.gap.com' },
        ],
        tone_of_voice: 'Empowering, Mindful, Elevated, Performance-Driven',
      } as BrandKit,
    };
  }

  const workspace = resolveWorkspace(project.brand_kit, project.id);
  workspace.brandKit.name = project.name;
  workspace.brandKit.domain = project.domain;
  workspace.brandKit.tier = project.tier;

  // ---------------------------------------------------------------------------
  // 2. System prompt: workspace grounding + proactive alert briefing
  // ---------------------------------------------------------------------------
  let systemPrompt = buildSentinelSystemPrompt(workspace);
  if (Array.isArray(body.unreadAlerts) && body.unreadAlerts.length > 0) {
    const alertLines = body.unreadAlerts
      .map((alert) =>
        alertContextToPromptLine({
          id: alert.id,
          content: '',
          createdAt: new Date().toISOString(),
          promptId: alert.id,
          promptQueryText: alert.promptQueryText ?? null,
          engine: alert.engine ?? null,
          competitor: alert.competitor ?? null,
          drop: alert.drop ?? null,
        })
      )
      .join('\n\n');
    systemPrompt = `${systemPrompt}\n\n## PROACTIVE ALERTS WAITING FOR THE USER\n${alertLines}\n\nOpen your reply by summarizing the most recent alert, then ask whether to run draftRewrite.`;
  }

  // ---------------------------------------------------------------------------
  // 3. Tools — every query executes through the RLS-scoped Supabase client
  // ---------------------------------------------------------------------------
  const toolContext = {
    supabase: (supabase ?? createNoopSupabase()) as NonNullable<typeof supabase>,
    projectId: project.id,
    brandName: project.name,
    brandDomain: project.domain,
    brandKit: workspace.brandKit,
  };

  const tools: ToolSet = {
    queryAuditTelemetry: tool({
      description:
        'Query historical visibility (Share of Voice) and sentiment telemetry for this workspace. Use for any question about how the brand is trending on AI engines. Returns per-engine averages, mention rates, sentiment, and time series.',
      inputSchema: z.object({
        days: z
          .union([z.literal(7), z.literal(30), z.literal(90)])
          .describe('Lookback window in days.'),
        engineId: z
          .string()
          .optional()
          .describe('Optional engine filter, e.g. chatgpt, gemini, claude, perplexity, google_ai_overview, google_ai_mode.'),
        promptId: z
          .string()
          .optional()
          .describe('Optional tracker (prompt) id to scope the analysis to a single tracked query.'),
      }),
      execute: async (input) => executeQueryAuditTelemetry(toolContext, input),
    }),
    analyzeCitationGap: tool({
      description:
        'Analyze referring domains from the citation ledger to evaluate which competitor citation wins are costing us visibility, and get targeted backlink / placement recommendations.',
      inputSchema: z.object({
        competitorName: z
          .string()
          .optional()
          .describe('Competitor to benchmark against. Defaults to the primary tracked competitor.'),
        days: z
          .union([z.literal(7), z.literal(30), z.literal(90)])
          .optional()
          .describe('Lookback window in days. Defaults to 30.'),
      }),
      execute: async (input) => executeAnalyzeCitationGap(toolContext, input),
    }),
    draftRewrite: tool({
      description:
        'Generate an optimized content draft (comparison copy, meta description, FAQ block, JSON-LD schema) that integrates missing entities to reclaim lost AI Share of Voice. Returns a structured result the UI renders as an action card.',
      inputSchema: z.object({
        topic: z.string().describe('The topic or tracked prompt where visibility was lost.'),
        competitor_name: z.string().optional().describe('The brand that took the citation spot.'),
        missing_entities: z
          .array(z.string())
          .optional()
          .describe('Entities the competitor covered that our canonical content is missing.'),
      }),
      execute: async (input) => executeDraftRewrite(toolContext, input),
    }),
  };

  // ---------------------------------------------------------------------------
  // 4. Streaming reply (live model) or deterministic fallback (no API key)
  // ---------------------------------------------------------------------------
  const modelMessages = await convertToModelMessages(uiMessages, { tools });

  if (process.env.OPENAI_API_KEY) {
    try {
      const result = streamText({
        model: openai('gpt-4o-mini'),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        maxRetries: 2,
        onEnd: async (event) => {
          const text = event.steps
            .map((step) => step.text)
            .filter(Boolean)
            .join('\n\n')
            .trim();
          if (!text) return;
          await persistChatMessage(toolContext.supabase, {
            projectId: project.id,
            sender: 'agent',
            content: text,
            metadata: { source: 'beacon-sentinel' },
          });
        },
      });
      return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({ sendSources: false }),
      });
    } catch (error) {
      console.warn('Live model stream failed, using offline Sentinel engine:', error);
    }
  }

  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    try {
      const result = streamText({
        model: google('gemini-1.5-flash'),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        maxRetries: 2,
        onEnd: async (event) => {
          const text = event.steps
            .map((step) => step.text)
            .filter(Boolean)
            .join('\n\n')
            .trim();
          if (!text) return;
          await persistChatMessage(toolContext.supabase, {
            projectId: project.id,
            sender: 'agent',
            content: text,
            metadata: { source: 'beacon-sentinel' },
          });
        },
      });
      return createUIMessageStreamResponse({
        stream: result.toUIMessageStream({ sendSources: false }),
      });
    } catch (error) {
      console.warn('Gemini stream failed, using offline Sentinel engine:', error);
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Offline Sentinel engine — no provider key required.
  //    Streams UI-message-protocol parts computed from real RLS-scoped data
  //    so every tool still executes against the workspace's own telemetry.
  //
  //    The SDK requires the full lifecycle protocol:
  //    start → start-step → text-start → text-delta(s) → text-end → finish-step → finish
  // ---------------------------------------------------------------------------
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      // Helper: emit a complete text part with proper lifecycle framing.
      let textPartCounter = 0;
      function writeText(content: string) {
        const id = `offline-text-${textPartCounter++}`;
        writer.write({ type: 'text-start', id });
        writer.write({ type: 'text-delta', id, delta: content });
        writer.write({ type: 'text-end', id });
      }

      // Begin the message lifecycle.
      writer.write({ type: 'start' });
      writer.write({ type: 'start-step' });

      const lastUserMessage = [...uiMessages].reverse().find((m) => m.role === 'user');
      const userText =
        lastUserMessage?.parts
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
          .toLowerCase() || '';

      const wantsDraft =
        userText.includes('rewrite') ||
        userText.includes('draft') ||
        userText.includes('yes') ||
        userText.includes('go ahead') ||
        userText.includes('fix');
      const wantsCitations =
        userText.includes('citation') ||
        userText.includes('backlink') ||
        userText.includes('referring domain') ||
        userText.includes('competitor');
      const wantsTelemetry =
        wantsDraft ||
        wantsCitations ||
        userText.includes('visibility') ||
        userText.includes('share of voice') ||
        userText.includes('sov') ||
        userText.includes('sentiment') ||
        userText.includes('how are we') ||
        userText.includes('trend');

      let telemetrySummary: string | null = null;
      if (wantsTelemetry) {
        const telemetry = await executeQueryAuditTelemetry(toolContext, { days: 30 });
        if (telemetry.data_available && telemetry.overall) {
          telemetrySummary = telemetry.overall.avg_visibility.toFixed(1);
        }
      }

      let citationSummary: string | null = null;
      if (wantsCitations || wantsDraft) {
        const gap = await executeAnalyzeCitationGap(toolContext, {});
        citationSummary = gap.summary;
        if (wantsCitations && !wantsDraft) {
          const recLines = gap.recommendations
            .map((r) => `- **${r.target_domain}** — ${r.play} (${r.expected_effect})`)
            .join('\n');
          writeText(`${gap.summary}\n\n## Citation gap recommendations\n\n${recLines}\n\nWant me to run a draftRewrite to reclaim the lost citation blocks?`);
          writer.write({ type: 'finish-step' });
          writer.write({ type: 'finish', finishReason: 'stop' });
          return;
        }
      }

      if (wantsDraft) {
        const competitor = workspace.brandKit.competitors?.[0]?.name || 'the leading competitor';
        const topic =
          body.unreadAlerts?.[body.unreadAlerts.length - 1]?.promptQueryText ||
          `Best ${workspace.brandKit.industry} recommendations in 2026`;
        const draft = generateDraftRewrite({
          topic,
          competitorName: competitor,
          missingEntities: pickDefaultEntities(workspace.brandKit.industry),
          brandName: workspace.brandName,
          brandDomain: workspace.domain,
          brandKit: workspace.brandKit,
        });
        writer.write({
          type: 'tool-input-available',
          toolCallId: 'offline-draft-1',
          toolName: 'draftRewrite',
          input: {
            topic: draft.topic,
            competitor_name: draft.competitor_name,
            missing_entities: draft.missing_entities,
          },
        });
        writer.write({
          type: 'tool-output-available',
          toolCallId: 'offline-draft-1',
          output: draft,
        });
        writeText(`On it. I ran draftRewrite targeting **${competitor}**${
          citationSummary ? ' after analyzing our citation gap' : ''
        }${
          telemetrySummary ? ` (30-day average Share of Voice: ${telemetrySummary})` : ''
        }. The draft integrates our three missing entities — review the card above and use **Approve & Export** to download the deploy-ready Markdown.`);
        writer.write({ type: 'finish-step' });
        writer.write({ type: 'finish', finishReason: 'stop' });
        return;
      }

      const latestAlert = body.unreadAlerts?.[body.unreadAlerts.length - 1];
      const alertGreeting = latestAlert
        ? `Heads up - we just lost citations on "${
            latestAlert.promptQueryText || 'your top tracker'
          }". ${
            latestAlert.competitor || workspace.brandKit.competitors?.[0]?.name || 'A competitor'
          } took our spot. `
        : '';

      writeText(`${alertGreeting}I'm tracking ${workspace.brandName} across ChatGPT, Gemini, Claude, Perplexity, and Google AI Overviews & AI Mode.${
        telemetrySummary ? ` Current 30-day average Share of Voice sits at ${telemetrySummary}.` : ''
      }${citationSummary ? ` ${citationSummary}` : ''}\n\nWant me to draft stronger positioning to reclaim our top spot, or analyze our citation gap in detail?`);
      writer.write({ type: 'finish-step' });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
    onError: (error) => {
      console.error('Offline Sentinel engine error:', error);
      return 'Beacon Sentinel hit an internal error. Please try again.';
    },
  });

  return createUIMessageStreamResponse({ stream });
}
