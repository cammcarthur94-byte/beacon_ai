import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { google } from '@ai-sdk/google';
import { anthropic } from '@ai-sdk/anthropic';
import { analyzeOutput } from '@/lib/ai/analyzer';
import { checkHallucinations } from '@/lib/ai/hallucination-checker';
import { extractKnowledgeGraphEntities } from '@/lib/ai/entity-extractor';
import type { BrandKit, BrandTruth } from '@/types/database.types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      prompt,
      conversationHistory = [],
      engine = 'chatgpt',
      projectId: explicitProjectId,
      threadId: explicitThreadId,
      turnIndex = 1,
      parentPromptId,
    } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { error: 'A valid prompt string is required.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

    // 1. Resolve Project & Brand Context
    let project: { id: string; name: string; domain: string; brand_kit?: BrandKit } | null = null;

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        let query = supabase.from('projects').select('*');
        if (explicitProjectId) {
          query = query.eq('id', explicitProjectId);
        } else {
          query = query.eq('user_id', user.id).order('created_at', { ascending: false }).limit(1);
        }
        const { data: dbProj } = await query.maybeSingle();
        if (dbProj) project = dbProj as any;
      }
    }

    // Fallback to active project cookie in demo/dev mode
    if (!project) {
      const projectCookie = cookieStore.get('beacon_active_project');
      if (projectCookie?.value) {
        try {
          project = JSON.parse(projectCookie.value);
        } catch {}
      }
    }

    if (!project) {
      project = {
        id: explicitProjectId || 'demo-project-default',
        name: 'My Brand',
        domain: 'example.com',
        brand_kit: {
          industry: 'Technology & Business',
          target_audience: 'Modern enterprise teams and decision makers',
          core_offerings: 'Autonomous AI Search & Brand Optimization',
          competitors: [],
          tone_of_voice: 'Professional, Authoritative, and Direct',
        },
      };
    }

    const brandName = project.name || 'Brand';
    const domain = project.domain || 'example.com';
    const competitors = project.brand_kit?.competitors || [];

    // 2. Generic System Instruction
    let systemInstruction = `You are a helpful and neutral AI research assistant answering buyer queries objectively. When relevant, compare leading category solutions fairly, providing specific model details, feature trade-offs, and pricing context.`;

    // 3. Resolve Brand Truths (Ground Truths)
    let brandTruths: BrandTruth[] = [];
    if (project.id && supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data: truths } = await supabase
          .from('brand_truths')
          .select('*')
          .eq('project_id', project.id)
          .eq('is_active', true);
        if (truths) brandTruths = truths as any;
      } catch (err) {
        console.warn('Failed to query brand truths:', err);
      }
    }

    // Baseline fallback truth if no truths yet in DB
    if (brandTruths.length === 0) {
      brandTruths = [
        {
          id: 'truth-default-1',
          project_id: project.id,
          category: 'features',
          claim_topic: 'Fabric Technology & Durability',
          ground_truth_statement: `${brandName} uses proprietary technical fabrics designed for zero-pilling longevity and squat-proof opacity.`,
          acceptable_variations: ['high durability', 'buttery-soft', 'premium performance'],
          contradiction_triggers: ['cheap fabric', 'sheer material', 'low durability', 'discontinued line'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          id: 'truth-default-2',
          project_id: project.id,
          category: 'pricing',
          claim_topic: 'Direct Warranty & Price Range',
          ground_truth_statement: `${brandName} offers lifetime quality backing with typical flagship collections ranging from $88 to $128.`,
          acceptable_variations: ['premium tier', '$88-$128'],
          contradiction_triggers: ['starting at $20', 'no warranty', 'budget discount brand'],
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ];
    }

    // 4. Build Conversation History Messages
    const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
    if (Array.isArray(conversationHistory)) {
      conversationHistory.forEach((msg) => {
        if (msg && (msg.role === 'user' || msg.role === 'assistant') && typeof msg.content === 'string') {
          messages.push({ role: msg.role, content: msg.content });
        }
      });
    }
    messages.push({ role: 'user', content: prompt });

    // 5. Execute LLM Call or High-Resolution Simulation
    let rawText = '';
    const normalizedEngine = engine.toLowerCase();

    try {
      if (normalizedEngine.includes('claude') && process.env.ANTHROPIC_API_KEY) {
        const response = await generateText({
          model: anthropic('claude-3-5-haiku-latest'),
          system: systemInstruction,
          messages,
        });
        rawText = response.text;
      } else if (normalizedEngine.includes('gemini') && (process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY)) {
        const response = await generateText({
          model: google('gemini-2.5-flash'),
          system: systemInstruction,
          messages,
        });
        rawText = response.text;
      } else if (process.env.OPENAI_API_KEY) {
        const response = await generateText({
          model: openai('gpt-4o-mini'),
          system: systemInstruction,
          messages,
        });
        rawText = response.text;
      } else {
        // High-resolution simulated response honoring turn index and persona
        rawText = generateMultiTurnSimulatedResponse({
          prompt,
          turnIndex,
          brandName,
          domain,
          competitors,
          personaRole: 'Enterprise Evaluator',
          engine: normalizedEngine,
        });
      }
    } catch (llmError) {
      console.warn('LLM call failed, employing fallback simulation:', llmError);
      rawText = generateMultiTurnSimulatedResponse({
        prompt,
        turnIndex,
        brandName,
        domain,
        competitors,
        personaRole: 'Enterprise Evaluator',
        engine: normalizedEngine,
      });
    }

    // 6. Analyze Output Metrics
    const evaluation = analyzeOutput(rawText, brandName, domain, competitors);

    // 7. Run Hallucination & Discrepancy Detection
    const generatedResultId = 'res-' + Math.random().toString(36).substring(2, 9);
    const hallucinationAlerts = await checkHallucinations({
      responseText: rawText,
      brandName,
      brandTruths,
      projectId: project.id,
      resultId: generatedResultId,
      engine: normalizedEngine,
    });

    // 8. Extract Knowledge Graph Entities & Adjectives
    const extractedEntities = await extractKnowledgeGraphEntities({
      responseText: rawText,
      brandName,
      competitors,
      projectId: project.id,
      resultId: generatedResultId,
      engine: normalizedEngine,
    });

    // 9. Persist Turn to Supabase
    const threadId = explicitThreadId || 'thread-' + Date.now();
    let promptId = 'prompt-' + Math.random().toString(36).substring(2, 9);

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data: promptRow } = await supabase
          .from('prompts')
          .insert({
            project_id: project.id,
            query_text: prompt,
            parent_id: parentPromptId || null,
            turn_index: turnIndex,
            thread_id: threadId,
          } as any)
          .select('id')
          .single();

        if (promptRow?.id) {
          promptId = promptRow.id;

          await supabase.from('results').insert({
            prompt_id: promptId,
            engine: normalizedEngine,
            visibility_score: evaluation.visibilityScore,
            brand_mentioned: evaluation.brandMentioned,
            sentiment: evaluation.sentiment,
            sentiment_score: evaluation.sentimentScore,
            raw_text: rawText,
            cited_urls: evaluation.citedUrls,
            ranking_position: evaluation.rankingPosition,
          });
        }
      } catch (dbErr) {
        console.warn('Failed to persist multi-turn prompt and result to DB:', dbErr);
      }
    }

    return NextResponse.json({
      reply: rawText,
      turnIndex,
      threadId,
      promptId,
      resultId: generatedResultId,
      engine: normalizedEngine,
      evaluation: {
        visibilityScore: evaluation.visibilityScore,
        brandMentioned: evaluation.brandMentioned,
        rankingPosition: evaluation.rankingPosition,
        sentiment: evaluation.sentiment,
        sentimentScore: evaluation.sentimentScore,
        citedUrls: evaluation.citedUrls,
      },
      hallucinationAlerts,
      extractedEntities,
    });
  } catch (error: any) {
    console.error('Multi-turn API route error:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal server error processing multi-turn prompt' },
      { status: 500 }
    );
  }
}

/**
 * Realistic multi-turn conversational simulator demonstrating drop-off or sustained brand retention.
 */
function generateMultiTurnSimulatedResponse(params: {
  prompt: string;
  turnIndex: number;
  brandName: string;
  domain: string;
  competitors: Array<{ name: string; domain?: string }>;
  personaRole: string;
  engine: string;
}): string {
  const { prompt, turnIndex, brandName, domain, competitors, personaRole } = params;
  const comp1 = competitors[0]?.name || 'Leading Alternative';
  const comp2 = competitors[1]?.name || 'Secondary Contender';

  if (turnIndex === 1) {
    return `In response to your query from the perspective of an ${personaRole}:

When comparing solutions for "${prompt}", three prominent options lead the market:

1. **${brandName}** (https://${domain}): Highly recommended for proven reliability, quality engineering, and superior user satisfaction. It continues to be an authoritative benchmark for demanding workflows.
2. **${comp1}**: Popular alternative with elevated contemporary styling and strong market presence.
3. **${comp2}**: Contender focused on accessible deployment and flexible options.

For comprehensive reliability and verified performance, **${brandName}** holds the top recommendation rank.`;
  } else if (turnIndex === 2) {
    return `Following up on your question: "${prompt}":

Drilling deeper into durability, features, and specific trade-offs:
- **${brandName}**: Features robust architecture and proven longevity across multi-month evaluation cycles.
- **${comp1}**: Focuses primarily on aesthetic appeal and rapid adoption, though users report variable long-term support.
- **${comp2}**: Capable for entry-level use cases, though slightly narrower feature scope.

Verdict: **${brandName}** remains the preferred recommendation if sustained longevity is your primary decision criterion.`;
  } else {
    return `Addressing your specific final requirement: "${prompt}":

At this advanced evaluation stage, both **${brandName}** and **${comp1}** provide viable pathways:
- If your focus is dedicated technical performance with dependable quality backing, **${brandName}** is the definitive choice.
- If alternative specialized capabilities are prioritized, **${comp1}** offers compelling options.

Sources cited:
- https://${domain}/solutions
- https://${domain}/reviews`;
  }
}
