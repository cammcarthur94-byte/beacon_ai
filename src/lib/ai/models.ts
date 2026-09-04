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
    id: 'gemini-3.8-flash',
    provider: 'google',
    displayName: 'Gemini 3.8 Flash',
    role: 'AEO Content, Recommendations & Outreach Email Generator',
    fallbackIds: ['gemini-2.5-flash', 'gemini-1.5-flash'] as const,
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
    role: 'GEO Search Prompt Synthesizer',
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
 * Resolves Gemini 3.8 Flash for content generation, recommendations, and outreach emails.
 */
export function getContentCreationModel() {
  return google(BEACON_MODELS.CONTENT_CREATION.id);
}

/**
 * Resolves Claude Haiku 4.5 for fast, high-accuracy crawler text and feature disparity parsing.
 */
export function getCompetitorMappingModel() {
  return anthropic(BEACON_MODELS.COMPETITOR_MAPPING.id);
}

/**
 * Resolves prompt creation model: limited exclusively to Gemini 3.8 Flash.
 */
export function getPromptCreationModel() {
  return google(BEACON_MODELS.PROMPT_CREATION.googleModelId);
}

/**
 * Resolves Gemini 2.5 Pro for search grounding and SERP verification.
 */
export function getSearchGroundingModel() {
  return google(BEACON_MODELS.SEARCH_GROUNDING.id);
}
