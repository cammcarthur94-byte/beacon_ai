import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDemoPrompts } from '@/lib/demo-prompts';

// Mock next/headers
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
    throw new Error('Supabase client should not be initialized in demo mode');
  }),
}));

describe('Audits Actions & Demo Prompt Deletion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {};
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://placeholder-project.supabase.co';
  });

  it('getDemoPrompts returns empty array if all prompts have been deleted', () => {
    const cookieStore = {
      get: (name: string) => ({ name, value: '[]' }),
    };
    const prompts = getDemoPrompts(cookieStore as any, null);
    expect(prompts).toEqual([]);
  });

  it('deletePromptAudit successfully removes target prompt without crashing', async () => {
    const { deletePromptAudit } = await import('@/app/audits/actions');
    
    // Seed initial prompts
    const initial = [
      { id: 'prompt-1', query_text: 'Test query 1', is_active: true, target_engines: ['chatgpt'] },
      { id: 'prompt-2', query_text: 'Test query 2', is_active: true, target_engines: ['gemini'] },
    ];
    mockCookieStore['beacon_demo_prompts'] = JSON.stringify(initial);

    const res = await deletePromptAudit('prompt-1');
    expect(res).toEqual({ success: true });

    // Verify cookie store has only prompt-2
    expect(mockSetCookie).toHaveBeenCalledWith(
      'beacon_demo_prompts',
      JSON.stringify([{ id: 'prompt-2', query_text: 'Test query 2', is_active: true, target_engines: ['gemini'] }]),
      expect.objectContaining({ path: '/', maxAge: expect.any(Number) })
    );
  });

  it('deletePromptAudit handles deleting all prompts down to an empty list', async () => {
    const { deletePromptAudit } = await import('@/app/audits/actions');
    
    const initial = [
      { id: 'prompt-last', query_text: 'Last query', is_active: true, target_engines: ['chatgpt'] },
    ];
    mockCookieStore['beacon_demo_prompts'] = JSON.stringify(initial);

    const res = await deletePromptAudit('prompt-last');
    expect(res).toEqual({ success: true });

    const saved = JSON.parse(mockCookieStore['beacon_demo_prompts']);
    expect(saved).toEqual([]);
  });

  it('togglePromptStatus toggles active state cleanly in demo mode without calling supabase', async () => {
    const { togglePromptStatus } = await import('@/app/audits/actions');

    const initial = [
      { id: 'prompt-1', query_text: 'Test query 1', is_active: true },
    ];
    mockCookieStore['beacon_demo_prompts'] = JSON.stringify(initial);

    const res = await togglePromptStatus('prompt-1', true);
    expect(res).toEqual({ success: true });

    const saved = JSON.parse(mockCookieStore['beacon_demo_prompts']);
    expect(saved[0].is_active).toBe(false);
  });
});
