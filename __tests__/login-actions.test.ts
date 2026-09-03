import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock next/headers
const mockSetCookie = vi.fn();
const mockGetCookie = vi.fn();
vi.mock('next/headers', () => ({
  cookies: async () => ({
    set: mockSetCookie,
    get: mockGetCookie,
  }),
}));

// Mock next/navigation
const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    mockRedirect(url);
    throw new Error(`NEXT_REDIRECT: ${url}`);
  },
}));

// Mock @/lib/supabase/server
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
  }),
}));

describe('login actions security checks', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not set beacon_demo_user cookie in production when NEXT_PUBLIC_SUPABASE_URL is missing/placeholder', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
      writable: true,
    });
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { signInWithEmail, signUpWithEmail, signInWithGoogle } = await import('../src/app/login/actions');

    const formData = new FormData();
    formData.append('email', 'attacker@example.com');
    formData.append('password', 'password123');

    // Test signInWithEmail
    const signInResult = await signInWithEmail(null, formData);
    expect(signInResult).toEqual({ error: 'Authentication service is not configured.' });
    expect(mockSetCookie).not.toHaveBeenCalled();

    // Test signUpWithEmail
    const signUpResult = await signUpWithEmail(null, formData);
    expect(signUpResult).toEqual({ error: 'Authentication service is not configured.' });
    expect(mockSetCookie).not.toHaveBeenCalled();

    // Test signInWithGoogle
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('NEXT_REDIRECT');
      }
    }
    expect(mockRedirect).toHaveBeenCalledWith('/login?error=Authentication%20service%20is%20not%20configured.');
    expect(mockSetCookie).not.toHaveBeenCalled();
  });

  it('allows fallback demo cookie setting in development environment when NEXT_PUBLIC_SUPABASE_URL is missing/placeholder', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
      writable: true,
    });
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;

    const { signInWithEmail } = await import('../src/app/login/actions');

    const formData = new FormData();
    formData.append('email', 'dev@example.com');
    formData.append('password', 'password123');

    try {
      await signInWithEmail(null, formData);
    } catch (e: unknown) {
      if (e instanceof Error) {
        expect(e.message).toContain('NEXT_REDIRECT');
      }
    }

    expect(mockSetCookie).toHaveBeenCalledWith(
      'beacon_demo_user',
      JSON.stringify({ email: 'dev@example.com', id: 'demo-user-id' }),
      { path: '/', maxAge: 60 * 60 * 24 * 7 }
    );
  });
});
