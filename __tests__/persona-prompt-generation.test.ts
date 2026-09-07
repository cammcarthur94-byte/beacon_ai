import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveLocalPersona, getLocalPersonas, findLocalPersonaById } from '@/lib/personas-store';

let mockCookieStore: Record<string, string> = {};
const mockSetCookie = vi.fn((name: string, value: string) => {
  mockCookieStore[name] = value;
});
const mockGetCookie = vi.fn((name: string) => {
  return mockCookieStore[name] ? { name, value: mockCookieStore[name] } : undefined;
});

vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: mockSetCookie,
    get: mockGetCookie,
  }),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => {
    return {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
      })),
    };
  }),
}));

describe('Buyer Persona & Prompt Generation Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {};
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder.supabase.co';
  });

  it('saves and retrieves buyer persona with all 7 format fields', () => {
    const persona = {
      id: 'persona-founder-1',
      project_id: 'test-proj',
      name: 'Sarah Chen',
      role_title: 'Head of Growth',
      name_title: 'Sarah Chen, Head of Growth',
      age_demographics: '30-40, San Francisco tech ecosystem',
      background: 'Former agency media buyer scaling B2B SaaS',
      goals: 'Reduce CAC by 30% and dominate AI search recommendations',
      pain_points: 'Unreliable AI search citations and expensive manual audits',
      information_sources: 'Substack, Twitter/X, and AI industry podcasts',
      buying_objections: 'Uncertain ROI and lack of transparent engine coverage',
      system_prompt: 'High-intent B2B SaaS buyer',
      tone_traits: ['Direct', 'Analytical'],
      is_system: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalPersona(persona, 'test-proj');

    const retrieved = getLocalPersonas('test-proj');
    expect(retrieved.length).toBeGreaterThanOrEqual(1);
    const found = findLocalPersonaById('persona-founder-1', 'test-proj');
    expect(found).toBeDefined();
    expect(found?.name_title).toBe('Sarah Chen, Head of Growth');
    expect(found?.pain_points).toBe('Unreliable AI search citations and expensive manual audits');
    expect(found?.goals).toBe('Reduce CAC by 30% and dominate AI search recommendations');
    expect(found?.buying_objections).toBe('Uncertain ROI and lack of transparent engine coverage');
  });

  it('generateAiPrompts produces queries targeting persona pain points, goals, and objections', async () => {
    const { generateAiPrompts } = await import('@/app/audits/actions');

    const persona = {
      id: 'persona-test-buyer',
      project_id: 'active-p1',
      name: 'Alex Rivera',
      role_title: 'VP of Procurement',
      name_title: 'Alex Rivera, VP of Procurement',
      age_demographics: '45-55, Enterprise Fortune 500',
      background: '20+ years enterprise procurement and vendor compliance',
      goals: 'Streamline vendor security onboarding and reduce tool redundancy',
      pain_points: 'Hidden vendor renewal price hikes and compliance risks',
      information_sources: 'Gartner, Forrester, Enterprise Procurement forums',
      buying_objections: 'Vendor lock-in and steep upfront implementation costs',
      system_prompt: 'Enterprise procurement lead',
      tone_traits: ['Skeptical', 'Thorough'],
      is_system: false,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    saveLocalPersona(persona, 'active-p1');

    mockCookieStore['beacon_active_project'] = JSON.stringify({
      id: 'active-p1',
      name: 'AcmeCloud',
      domain: 'acmecloud.com',
      tier: 'growth',
      audit_limit: 100,
    });

    const res = await generateAiPrompts({
      personaId: 'persona-test-buyer',
      count: 5,
      category: 'comparisons',
    });

    expect(res.error).toBeUndefined();
    expect(res.prompts).toBeDefined();
    expect(res.prompts.length).toBe(5);

    // Verify persona considerations are embedded in the queries and rationales
    const allText = res.prompts.map((p) => p.query_text + ' ' + p.rationale).join(' ');
    
    // Check that pain points, objections, or goals are referenced
    expect(
      allText.toLowerCase().includes('hidden vendor renewal price hikes') ||
      allText.toLowerCase().includes('compliance') ||
      allText.toLowerCase().includes('vendor lock-in') ||
      allText.toLowerCase().includes('pain point') ||
      allText.toLowerCase().includes('objection') ||
      allText.toLowerCase().includes('procurement')
    ).toBe(true);
  });

  it('generateAiPrompts generates prompts spanning multiple selected categories', async () => {
    const { generateAiPrompts } = await import('@/app/audits/actions');

    mockCookieStore['beacon_active_project'] = JSON.stringify({
      id: 'active-p2',
      name: 'CyberShield',
      domain: 'cybershield.io',
      tier: 'pro',
      audit_limit: 100,
    });

    const res = await generateAiPrompts({
      categories: ['comparisons', 'buying_guides', 'features'],
      count: 6,
    });

    expect(res.error).toBeUndefined();
    expect(res.prompts).toBeDefined();
    expect(res.prompts.length).toBe(6);

    const generatedCategories = res.prompts.map((p) => p.category);
    expect(generatedCategories.includes('comparisons')).toBe(true);
    expect(generatedCategories.includes('buying_guides')).toBe(true);
    expect(generatedCategories.includes('features')).toBe(true);
  });
});
