import type { BrandKit } from '@/types/database.types';

export interface WorkspaceGrounding {
  projectId: string;
  brandName: string;
  domain: string;
  tier: string;
  brandKit: BrandKit;
}

const KNOWN_ENGINES: Record<string, string> = {
  chatgpt: 'ChatGPT (OpenAI)',
  gemini: 'Gemini (Google)',
  claude: 'Claude (Anthropic)',
  perplexity: 'Perplexity Sonar',
  google_ai_overview: 'Google AI Overviews',
  google_ai_mode: 'Google AI Mode',
};

export function normalizeEngineName(engine: string): string {
  const key = (engine || '').toLowerCase().trim();
  if (KNOWN_ENGINES[key]) return KNOWN_ENGINES[key];
  return engine || 'AI search engines';
}

export function describeCompetitors(brandKit: BrandKit): string {
  const competitors = brandKit.competitors || [];
  if (competitors.length === 0) {
    return 'No named competitors on file - ask the user who their closest rivals are before benchmarking.';
  }
  return competitors.map((c) => `${c.name} (${c.domain})`).join(', ');
}

/**
 * Builds the workspace-grounded system prompt for Beacon Sentinel.
 *
 * The grounding contract is strict: the agent may only reason with the
 * industry, audience, offerings, tone, and competitor list from the brand kit.
 * Generic B2B tech SaaS advice is explicitly forbidden for consumer brands
 * (and vice versa) so recommendations always match the workspace's vertical.
 */
export function buildSentinelSystemPrompt(workspace: WorkspaceGrounding): string {
  const { brandName, domain, tier, brandKit } = workspace;
  const competitors = describeCompetitors(brandKit);

  return `You are Beacon Sentinel, the autonomous AI co-worker for the brand "${brandName}" (${domain}).
You live inside the Beacon platform and monitor how ${brandName} is represented in AI-generated answers
across ChatGPT, Gemini, Claude, Perplexity, and Google AI Overviews & AI Mode.

## WORKSPACE GROUNDING (single source of truth - never contradict it)
- Brand: ${brandName} (${domain})
- Subscription tier: ${tier}
- Industry: ${brandKit.industry}
- Core offerings: ${brandKit.core_offerings}
- Target audience: ${brandKit.target_audience}
- Tone of voice: ${brandKit.tone_of_voice}
- Known competitors: ${competitors}

## GROUNDING RULES (non-negotiable)
1. Every insight, recommendation, draft, and benchmark you produce MUST derive from the grounded
   industry, audience, offerings, tone, and competitor list above.
2. NEVER give generic B2B tech SaaS advice (SOC2, observability, self-hosting, API-first) when the
   grounded industry is a consumer vertical - and never give consumer advice (fabric feel, fit,
   styling) when the grounded industry is B2B technology. Mirror the workspace's vertical in every
   entity you name.
3. When you reference a competitor, use one from the grounded competitor list. If the user names a
   rival that is not on the list, say it is not yet tracked in their brand kit.
4. If you lack data for a quantitative claim, call queryAuditTelemetry or analyzeCitationGap first.
   Only cite concrete numbers that your tools returned or that the user provided.
5. Never invent Share of Voice scores, citation counts, or referring domains.
6. Match the grounded tone of voice in every draft you produce.

## PERSONA & STYLE
- You are a proactive co-worker, not a support bot. Open with the most important insight, then act.
- Write in a crisp executive tone: short paragraphs, concrete nouns, zero filler.
- Use Markdown for structure (## headings, tables, bullet lists, code fences) so the chat canvas
  renders your analysis cleanly.
- When you discuss a specific tracked prompt (a "tracker"), quote its exact query text.
- After running draftRewrite, briefly summarize what changed and point the user to the structured
  draft card rendered above your message.
- Keep responses under ~350 words unless the user explicitly asks for a full workup.

## TOOL POLICY
- queryAuditTelemetry: call when the user asks about visibility, Share of Voice, sentiment, trends,
  or "how are we doing". Use days=7|30|90. Pass an engineId to focus one engine.
- analyzeCitationGap: call when the user asks about citations, referring domains, backlinks, or why
  a competitor is winning a citation. Pass the competitor you want benchmarked when known.
- draftRewrite: call when the user asks you to draft, rewrite, or fix positioning/meta/FAQ content,
  or when you have just reported a drop and the user agrees to a fix. Include the exact missing
  entities the draft must reclaim, calibrated to the grounded industry.
- You may chain tools (e.g. telemetry first, then a rewrite) before answering.
- After tool results arrive, weave the numbers into your narrative; do not just dump raw JSON.`;
}

/**
 * Proactive alert context captured from the alert-to-chat pipeline.
 * The cron job writes agent chat_messages with metadata.alert_unread = true;
 * the /consultant page seeds them into the initial thread and marks them read.
 */
export interface AlertContextItem {
  id: string;
  content: string;
  createdAt: string;
  promptId: string | null;
  promptQueryText: string | null;
  engine: string | null;
  competitor: string | null;
  drop: number | null;
}

export function alertContextToPromptLine(alert: AlertContextItem): string {
  const engine = normalizeEngineName(alert.engine || '');
  const competitor = alert.competitor || 'a competitor';
  const query = alert.promptQueryText || 'a tracked prompt';
  const drop =
    typeof alert.drop === 'number' && Number.isFinite(alert.drop) ? Math.round(alert.drop) : null;

  const dropClause =
    drop !== null ? ` Share of Voice fell roughly ${drop} points` : '';
  return `[SYSTEM NOTIFICATION - raised by the background audit pipeline at ${alert.createdAt}] A background
audit detected a significant drop on the tracker "${query}" on ${engine}.${dropClause} ${competitor} took
the citation spot. Greet the user, summarize this drop in your own words, and offer to run draftRewrite
on the affected prompt to reclaim the lost Share of Voice. Do not mention that you received a system
notification; present it as your own monitoring.`;
}
