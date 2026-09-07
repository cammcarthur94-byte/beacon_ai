import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';
import { createClient } from '@/lib/supabase/server';
import type { EntityMention, SentimentType } from '@/types/database.types';

const entityExtractionSchema = z.object({
  entities: z.array(
    z.object({
      entityName: z.string().describe('Descriptive adjective, attribute, or capability (e.g., "intuitive", "overpriced", "scalable", "clunky")'),
      entityType: z.enum(['adjective', 'attribute', 'feature', 'sentiment_descriptor']).describe('Classification of entity'),
      sentiment: z.enum(['positive', 'neutral', 'negative']).describe('Sentiment associated with this description'),
      associatedTarget: z.string().describe('The brand or competitor name this adjective describes'),
      isBrand: z.boolean().describe('True if describing your brand, false if describing a competitor'),
      contextSnippet: z.string().describe('Short sentence snippet from the response illustrating this adjective'),
    })
  ),
});

export interface ExtractEntitiesParams {
  responseText: string;
  brandName: string;
  competitors: Array<{ name: string; domain?: string }>;
  projectId: string;
  promptId?: string;
  resultId?: string;
  engine: string;
}

/**
 * Analyzes an LLM response to extract semantic adjectives and entities for the Knowledge Graph.
 * Maps attributes to your brand vs competitor targets.
 */
export async function extractKnowledgeGraphEntities(
  params: ExtractEntitiesParams
): Promise<EntityMention[]> {
  const { responseText, brandName, competitors, projectId, promptId, resultId, engine } = params;

  if (!responseText.trim()) {
    return [];
  }

  const supabase = await createClient();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  let extractedItems: Array<{
    entityName: string;
    entityType: string;
    sentiment: SentimentType;
    associatedTarget: string;
    isBrand: boolean;
    contextSnippet: string;
  }> = [];

  const hasApiKey = Boolean(
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY
  );

  const competitorNames = competitors.map((c) => c.name).filter(Boolean);

  if (hasApiKey) {
    try {
      const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
        ? google('gemini-2.5-flash')
        : openai('gpt-4o-mini');

      const prompt = `You are a Knowledge Graph linguist analyzing an AI search answer for brand perception.

TARGET BRAND: "${brandName}"
COMPETITORS: ${competitorNames.length > 0 ? competitorNames.join(', ') : 'Category Incumbents'}

Analyze the text below. Extract up to 5 defining semantic adjectives or entity attributes associated with "${brandName}" and up to 5 defining attributes associated with each mentioned competitor.

AI RESPONSE TEXT:
"""
${responseText}
"""

Guidelines:
1. Extract concise, impactful adjectives (e.g. "buttery-soft", "durable", "innovative", "expensive", "steep learning curve", "enterprise-grade").
2. Accurately assign whether each adjective describes "${brandName}" (isBrand = true) or a competitor (isBrand = false).
3. Assign sentiment: 'positive', 'neutral', or 'negative'.`;

      const result = await generateObject({
        model,
        schema: entityExtractionSchema,
        prompt,
      });

      extractedItems = result.object.entities.map((e) => ({
        entityName: e.entityName.toLowerCase().trim(),
        entityType: e.entityType,
        sentiment: e.sentiment as SentimentType,
        associatedTarget: e.associatedTarget,
        isBrand: e.isBrand,
        contextSnippet: e.contextSnippet,
      }));
    } catch (err) {
      console.warn('Entity extraction LLM call failed, using heuristic extraction:', err);
      extractedItems = runHeuristicEntityExtraction(responseText, brandName, competitorNames);
    }
  } else {
    extractedItems = runHeuristicEntityExtraction(responseText, brandName, competitorNames);
  }

  // Persist to Supabase if connected
  const createdEntities: EntityMention[] = [];

  for (const item of extractedItems) {
    const record: EntityMention = {
      id: 'entity-' + Math.random().toString(36).substring(2, 9),
      project_id: projectId,
      prompt_id: promptId || null,
      result_id: resultId || null,
      engine,
      entity_name: item.entityName,
      entity_type: item.entityType,
      sentiment: item.sentiment,
      associated_target: item.associatedTarget,
      is_brand: item.isBrand,
      frequency: 1,
      context_snippet: item.contextSnippet,
      created_at: new Date().toISOString(),
    };

    if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
      try {
        const { data, error } = await supabase
          .from('entity_mentions')
          .insert({
            project_id: projectId,
            prompt_id: promptId || null,
            result_id: resultId || null,
            engine,
            entity_name: item.entityName,
            entity_type: item.entityType,
            sentiment: item.sentiment,
            associated_target: item.associatedTarget,
            is_brand: item.isBrand,
            frequency: 1,
            context_snippet: item.contextSnippet,
          })
          .select('*')
          .single();

        if (data && !error) {
          createdEntities.push(data as any);
          continue;
        }
      } catch (dbErr) {
        console.warn('Failed to insert entity mention into database:', dbErr);
      }
    }

    createdEntities.push(record);
  }

  return createdEntities;
}

/**
 * Heuristic fallback parser for entity extraction when API keys are unconfigured.
 */
function runHeuristicEntityExtraction(
  text: string,
  brandName: string,
  competitorNames: string[]
): Array<{
  entityName: string;
  entityType: string;
  sentiment: SentimentType;
  associatedTarget: string;
  isBrand: boolean;
  contextSnippet: string;
}> {
  const dictionary: Record<string, { type: string; sentiment: SentimentType }> = {
    'innovative': { type: 'adjective', sentiment: 'positive' },
    'reliable': { type: 'adjective', sentiment: 'positive' },
    'durable': { type: 'adjective', sentiment: 'positive' },
    'comfortable': { type: 'adjective', sentiment: 'positive' },
    'fast': { type: 'adjective', sentiment: 'positive' },
    'scalable': { type: 'adjective', sentiment: 'positive' },
    'expensive': { type: 'adjective', sentiment: 'neutral' },
    'premium': { type: 'adjective', sentiment: 'positive' },
    'complex': { type: 'adjective', sentiment: 'negative' },
    'clunky': { type: 'adjective', sentiment: 'negative' },
    'popular': { type: 'adjective', sentiment: 'positive' },
    'versatile': { type: 'adjective', sentiment: 'positive' },
  };

  const results: any[] = [];
  const lowerText = text.toLowerCase();

  for (const [word, meta] of Object.entries(dictionary)) {
    if (lowerText.includes(word)) {
      results.push({
        entityName: word,
        entityType: meta.type,
        sentiment: meta.sentiment,
        associatedTarget: brandName,
        isBrand: true,
        contextSnippet: `Mentioned in context: "${word}" associated with performance`,
      });
      if (results.length >= 5) break;
    }
  }

  // Add a competitor benchmark adjective if competitor mentioned
  if (competitorNames.length > 0) {
    results.push({
      entityName: 'alternative',
      entityType: 'adjective',
      sentiment: 'neutral',
      associatedTarget: competitorNames[0],
      isBrand: false,
      contextSnippet: `Referenced as alternative provider`,
    });
  }

  return results;
}
