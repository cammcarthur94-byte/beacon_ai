import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkHallucinations } from '@/lib/ai/hallucination-checker';
import { extractKnowledgeGraphEntities } from '@/lib/ai/entity-extractor';
import { POST as multiTurnHandler } from '@/app/api/multi-turn/route';
import {
  GET as getPersonasHandler,
  POST as postPersonasHandler,
  DELETE as deletePersonasHandler,
} from '@/app/api/personas/route';
import { NextRequest } from 'next/server';
import type { BrandTruth } from '@/types/database.types';

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (name: string) => {
      if (name === 'beacon_active_project') {
        return {
          name: 'beacon_active_project',
          value: JSON.stringify({
            id: 'project-test-123',
            name: 'Nike',
            domain: 'nike.com',
            brand_kit: {
              competitors: [{ name: 'Alo Yoga', domain: 'aloyoga.com' }],
            },
          }),
        };
      }
      return undefined;
    },
    set: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn(async () => ({ data: null, error: null })),
      maybeSingle: vi.fn(async () => ({ data: null, error: null })),
    })),
  })),
}));

describe('Hallucination Checker Utility', () => {
  const sampleTruths: BrandTruth[] = [
    {
      id: 'truth-1',
      project_id: 'proj-1',
      category: 'pricing',
      claim_topic: 'Starting Pricing',
      ground_truth_statement: 'Core flagship apparel starts at $88 and goes up to $128.',
      acceptable_variations: ['$88-$128'],
      contradiction_triggers: ['starting at $19', 'budget discount brand', 'free tier available'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'truth-2',
      project_id: 'proj-1',
      category: 'compliance',
      claim_topic: 'Security Compliance',
      ground_truth_statement: 'Platform is certified SOC-2 Type II compliant.',
      acceptable_variations: ['SOC-2 compliant'],
      contradiction_triggers: ['no soc-2 compliance', 'unverified security standard'],
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('detects and flags a contradiction trigger in response text', async () => {
    const hallucinatedText =
      'Nike is widely known as a budget discount brand with items starting at $19.';
    const alerts = await checkHallucinations({
      responseText: hallucinatedText,
      brandName: 'Nike',
      brandTruths: sampleTruths,
      projectId: 'proj-1',
      engine: 'chatgpt',
    });

    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0].severity).toBe('critical');
    expect(alerts[0].discrepancy_summary).toContain('contradicts');
  });

  it('returns empty alert array when response contains no hallucinations', async () => {
    const truthfulText =
      'Nike offers premium high-performance collections with verified quality and durable fabrics.';
    const alerts = await checkHallucinations({
      responseText: truthfulText,
      brandName: 'Nike',
      brandTruths: sampleTruths,
      projectId: 'proj-1',
      engine: 'chatgpt',
    });

    expect(alerts.length).toBe(0);
  });
});

describe('Knowledge Graph Entity Extractor', () => {
  it('extracts semantic adjectives associated with the brand', async () => {
    const text =
      'Nike is considered remarkably durable and innovative for athletes, while Alo Yoga is a popular alternative.';
    const entities = await extractKnowledgeGraphEntities({
      responseText: text,
      brandName: 'Nike',
      competitors: [{ name: 'Alo Yoga' }],
      projectId: 'proj-1',
      engine: 'perplexity',
    });

    expect(entities.length).toBeGreaterThan(0);
    const brandEntities = entities.filter((e) => e.is_brand);
    expect(brandEntities.some((e) => e.entity_name === 'durable' || e.entity_name === 'innovative')).toBe(true);
  });
});

describe('Multi-Turn Persona Simulation API Route', () => {
  it('rejects empty prompts with status 400', async () => {
    const req = new NextRequest('http://localhost:3000/api/multi-turn', {
      method: 'POST',
      body: JSON.stringify({ prompt: '' }),
    });

    const res = await multiTurnHandler(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('prompt');
  });

  it('successfully simulates a multi-turn conversation turn', async () => {
    const req = new NextRequest('http://localhost:3000/api/multi-turn', {
      method: 'POST',
      body: JSON.stringify({
        prompt: 'Which athletic brand has the best durable yoga pants?',
        turnIndex: 1,
        engine: 'chatgpt',
        conversationHistory: [],
      }),
    });

    const res = await multiTurnHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBeDefined();
    expect(body.turnIndex).toBe(1);
    expect(body.evaluation).toBeDefined();
    expect(body.evaluation.visibilityScore).toBeGreaterThanOrEqual(0);
  });
});

describe('Buyer Personas API & Layout Architecture', () => {
  const testProjectId = 'project-new-user-123';

  it('starts with 0 default personas when a user first signs up', async () => {
    const req = new NextRequest(
      `http://localhost:3000/api/personas?projectId=${testProjectId}`
    );
    const res = await getPersonasHandler(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.personas).toBeDefined();
    expect(body.personas.length).toBe(0);
  });

  it('creates a custom buyer persona using the exact Emma layout', async () => {
    const emmaPayload = {
      projectId: testProjectId,
      name: 'Emma',
      roleTitle: 'Working Mom',
      ageDemographics: '32, suburban resident, household income around $85K.',
      background:
        'Juggles a full-time job and family responsibilities. Exercises early in the morning before the kids wake up.',
      goals:
        'Stay healthy and find durable, high-quality family or fitness products without wasting time.',
      painPoints:
        'Limited free time for shopping trips; easily overwhelmed by too many product choices online.',
      informationSources:
        'Instagram, parenting blogs, and YouTube product reviews.',
      buyingObjections:
        'Concerned about poor product quality, hidden shipping fees, and complicated return policies.',
    };

    const postReq = new NextRequest('http://localhost:3000/api/personas', {
      method: 'POST',
      body: JSON.stringify(emmaPayload),
    });

    const postRes = await postPersonasHandler(postReq);
    expect(postRes.status).toBe(200);
    const postBody = await postRes.json();
    expect(postBody.persona).toBeDefined();
    expect(postBody.persona.name).toBe('Emma');
    expect(postBody.persona.role_title).toBe('Working Mom');
    expect(postBody.persona.age_demographics).toBe(emmaPayload.ageDemographics);
    expect(postBody.persona.background).toBe(emmaPayload.background);
    expect(postBody.persona.goals).toBe(emmaPayload.goals);
    expect(postBody.persona.pain_points).toBe(emmaPayload.painPoints);
    expect(postBody.persona.information_sources).toBe(emmaPayload.informationSources);
    expect(postBody.persona.buying_objections).toBe(emmaPayload.buyingObjections);

    // Verify GET now returns 1 persona
    const getReq = new NextRequest(
      `http://localhost:3000/api/personas?projectId=${testProjectId}`
    );
    const getRes = await getPersonasHandler(getReq);
    const getBody = await getRes.json();
    expect(getBody.personas.length).toBe(1);

    // Verify DELETE successfully deletes the persona
    const delReq = new NextRequest(
      `http://localhost:3000/api/personas?id=${postBody.persona.id}&projectId=${testProjectId}`,
      { method: 'DELETE' }
    );
    const delRes = await deletePersonasHandler(delReq);
    expect(delRes.status).toBe(200);
    const delBody = await delRes.json();
    expect(delBody.success).toBe(true);

    // Verify GET is back to 0
    const finalGetRes = await getPersonasHandler(getReq);
    const finalGetBody = await finalGetRes.json();
    expect(finalGetBody.personas.length).toBe(0);
  });
});
