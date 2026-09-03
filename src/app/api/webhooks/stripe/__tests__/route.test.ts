import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { POST } from '../route';
import { NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe';

describe('Stripe Webhook Route Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('returns 500 when STRIPE_WEBHOOK_SECRET is missing', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe('Webhook secret is not configured');
  });

  it('returns 400 when stripe-signature header is missing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('Missing stripe-signature header');
  });

  it('returns 400 when signature verification fails', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    vi.spyOn(stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_invalid',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);

    const json = await res.json();
    expect(json.error).toBe('Webhook Error: Invalid signature');
  });

  it('processes webhook successfully when constructEvent succeeds', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';

    const mockEvent = {
      id: 'evt_test',
      type: 'payment_intent.succeeded',
      data: { object: {} },
    };

    vi.spyOn(stripe.webhooks, 'constructEvent').mockReturnValue(mockEvent as any);

    const req = new NextRequest('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 'sig_valid',
      },
      body: JSON.stringify(mockEvent),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.received).toBe(true);
  });
});
