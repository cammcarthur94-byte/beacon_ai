import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

/**
 * Centralized Model Registry for Beacon AI
 *
 * Feature Assignments:
 * 1. Chat Bot & AI Co-Worker Agent ("Beacon Sentinel"): Claude Sonnet 5
 * 2. Content Creation (Meta descriptions, FAQ blocks, optimization briefs): Claude Sonnet 5
 * 3. Competitor Product Mapping (Parsing crawler text & feature disparities): Claude Haiku 4.5
 * 4. Prompt Creation ("Generate Prompt with AI"): Gemini 3.8 Flash OR OpenAI GPT-4o-mini
 * 5. Search Grounding & SERP Cross-Checking: Gemini 2.5 Pro
 */
export const BEACON_MODELS = {
  SENTINEL_CHAT: {
    id: 'claude-sonnet-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 5',
    role: 'Beacon Sentinel Co-Worker Agent',
    fallbackIds: ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'] as const,
  },
  CONTENT_CREATION: {
    id: 'claude-sonnet-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 5',
    role: 'AEO Content & Brief Generator',
    fallbackIds: ['claude-3-7-sonnet-latest', 'claude-3-5-sonnet-latest'] as const,
  },
  COMPETITOR_MAPPING: {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    role: 'Crawler Text & Feature Disparity Parser',
    fallbackIds: ['claude-haiku-4-5-20251001', 'claude-3-5-haiku-latest'] as const,
  },
  PROMPT_CREATION: {
    googleModelId: 'gemini-3.8-flash',
    openaiModelId: 'gpt-4o-mini',
    displayName: 'Gemini 3.8 Flash / GPT-4o-mini',
    role: 'GEO Search Prompt Synthesizer',
    googleFallbackIds: ['gemini-2.5-flash', 'gemini-1.5-flash'] as const,
  },
  SEARCH_GROUNDING: {
    id: 'gemini-2.5-pro',
    provider: 'google',
    displayName: 'Gemini 2.5 Pro',
    role: 'Search Grounding & SERP Cross-Checking',
    fallbackIds: ['gemini-1.5-pro'] as const,
  },
} as const;

/**
 * Resolves the primary Claude Sonnet 5 model for Beacon Sentinel Chat.
 */
export function getSentinelChatModel() {
  return anthropic(BEACON_MODELS.SENTINEL_CHAT.id);
}

/**
 * Resolves Claude Sonnet 5 for content generation (meta descriptions, FAQ blocks, comparison matrices).
 */
export function getContentCreationModel() {
  return anthropic(BEACON_MODELS.CONTENT_CREATION.id);
}

/**
 * Resolves Claude Haiku 4.5 for fast, high-accuracy crawler text and feature disparity parsing.
 */
export function getCompetitorMappingModel() {
  return anthropic(BEACON_MODELS.COMPETITOR_MAPPING.id);
}

/**
 * Resolves prompt creation model: prefers Gemini 3.8 Flash if Google key is configured,
 * otherwise OpenAI GPT-4o-mini if OpenAI key is configured.
 */
export function getPromptCreationModel() {
  if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return {
      model: google(BEACON_MODELS.PROMPT_CREATION.googleModelId),
      name: 'Gemini 3.8 Flash',
    };
  }
  if (process.env.OPENAI_API_KEY) {
    return {
      model: openai(BEACON_MODELS.PROMPT_CREATION.openaiModelId),
      name: 'OpenAI GPT-4o-mini',
    };
  }
  return null;
}

/**
 * Resolves Gemini 2.5 Pro for search grounding and SERP verification.
 */
export function getSearchGroundingModel() {
  return google(BEACON_MODELS.SEARCH_GROUNDING.id);
}
