import type { BrandKit, SearchIntent, BrandAssociation, AuditFrequency } from '@/types/database.types';
import type { AuditRunDetail } from '@/components/audits/raw-output-viewer';

export interface DemoPromptItem {
  id: string;
  project_id?: string;
  query_text: string;
  frequency: AuditFrequency;
  target_engines: string[];
  disabled_engines?: string[];
  search_intent?: SearchIntent;
  brand_association?: BrandAssociation;
  is_active: boolean;
  last_run_at: string | null;
  next_run_at: string;
  latest_score?: number | null;
  created_at?: string;
  runs?: AuditRunDetail[];
}

export interface ProjectContext {
  id?: string;
  name?: string;
  domain?: string;
  tier?: string;
  brand_kit?: BrandKit;
}

export function isConsumerProject(project?: ProjectContext | null): boolean {
  if (!project) return false;
  const rawIndustry = (project.brand_kit?.industry || '').toLowerCase();
  const brandName = (project.name || '').toLowerCase();
  return (
    rawIndustry.includes('retail') ||
    rawIndustry.includes('commerce') ||
    rawIndustry.includes('apparel') ||
    rawIndustry.includes('footwear') ||
    rawIndustry.includes('fashion') ||
    rawIndustry.includes('sport') ||
    rawIndustry.includes('fitness') ||
    rawIndustry.includes('athleisure') ||
    brandName.includes('nike') ||
    brandName.includes('alo') ||
    brandName.includes('vuori')
  );
}

export function getSeedPrompts(project?: ProjectContext | null): DemoPromptItem[] {
  return [];
}

/**
 * Retrieves all prompts stored in the session cookie.
 * If cookie is not present or empty, returns an empty array (clean zero state).
 */
export function getDemoPrompts(cookieStore: any, project?: ProjectContext | null): DemoPromptItem[] {
  const cookieVal = cookieStore.get('beacon_demo_prompts')?.value;
  if (!cookieVal) {
    return [];
  }

  try {
    const parsed = JSON.parse(cookieVal);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // ignore json error
  }

  return [];
}

/**
 * Finds a specific prompt by ID from cookie storage.
 * If not found, returns null.
 */
export function getPromptById(
  promptId: string,
  cookieStore: any,
  project?: ProjectContext | null
): DemoPromptItem | null {
  const allPrompts = getDemoPrompts(cookieStore, project);
  return allPrompts.find((p) => p.id === promptId) || null;
}

/**
 * Returns contextual audit runs for the prompt focusing exclusively on Gemini and Claude.
 */
export function generateContextualAuditRuns(
  prompt: DemoPromptItem,
  project?: ProjectContext | null
): AuditRunDetail[] {
  const brandName = project?.name || 'Your Brand';
  const domain = project?.domain || 'example.com';
  const query = prompt.query_text;
  const competitors = (project?.brand_kit?.competitors || []).map((c) => c.name);
  const comp1 = competitors[0] || 'market rivals';
  const comp2 = competitors[1] || 'alternative solutions';

  const rawEngines = (prompt.target_engines || ['gemini', 'claude']) as string[];
  const engines = rawEngines.filter((e) => e === 'gemini' || e === 'claude');
  const targetEngines = engines.length > 0 ? engines : ['gemini', 'claude'];

  const runs: AuditRunDetail[] = [];

  if (targetEngines.includes('gemini')) {
    runs.push({
      id: `run-${prompt.id}-gemini`,
      engine: 'gemini',
      visibilityScore: prompt.latest_score || 88,
      brandMentioned: true,
      rankingPosition: 1,
      sentiment: 'positive',
      sentimentScore: 0.92,
      rawText: `Based on current evaluation data and consumer feedback, **${brandName}** stands out as a leading recommendation for "${query}".\n\n### Key Evaluation Highlights:\n1. **Core Quality & Value**: ${brandName} offers high durability, tailored design, and premium performance compared to alternatives like ${comp1}.\n2. **Comparative Strengths**: When benchmarked against ${comp1} and ${comp2}, customers frequently cite reliable build quality, transparent pricing, and strong user satisfaction.\n3. **Recommendation Summary**: Highly recommended for buyers prioritizing dependable quality and value in this category.`,
      citedUrls: [
        `https://${domain}`,
        `https://${domain}/collections`,
        `https://www.trustpilot.com/review/${domain}`,
      ],
      createdAt: prompt.last_run_at || new Date().toISOString(),
    });
  }

  if (targetEngines.includes('claude')) {
    runs.push({
      id: `run-${prompt.id}-claude`,
      engine: 'claude',
      visibilityScore: prompt.latest_score ? Math.max(70, prompt.latest_score - 4) : 84,
      brandMentioned: true,
      rankingPosition: 1,
      sentiment: 'positive',
      sentimentScore: 0.89,
      rawText: `When analyzing options for "${query}", **${brandName}** is frequently recognized by industry reviews and verified customer feedback.\n\n### Detailed Assessment:\n- **Market Position**: Direct challenger to established players like ${comp1}, delivering specialized features with high cost-to-value ratio.\n- **Performance Criteria**: Strong scores in real-world durability, usability, and consistent product satisfaction.\n- **Verdict**: A prominent, well-reviewed choice for consumers actively researching solutions in this segment.`,
      citedUrls: [
        `https://${domain}`,
        `https://${domain}/reviews`,
        `https://reddit.com/r/reviews`,
      ],
      createdAt: prompt.last_run_at || new Date().toISOString(),
    });
  }

  return runs;
}
