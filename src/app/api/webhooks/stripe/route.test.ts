import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { POST } from './route';
import { stripe } from '@/lib/stripe';

test('Stripe Webhook Route Security Tests', async (t) => {
  const originalSecret = process.env.STRIPE_WEBHOOK_SECRET;

  t.afterEach(() => {
    if (originalSecret !== undefined) {
      process.env.STRIPE_WEBHOOK_SECRET = originalSecret;
    } else {
      delete process.env.STRIPE_WEBHOOK_SECRET;
    }
  });

  await t.test('returns 500 when STRIPE_WEBHOOK_SECRET is not configured', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 500);

    const body = await res.json();
    assert.equal(body.error, 'Stripe webhook secret is not configured');
  });

  await t.test('returns 400 when stripe-signature header is missing', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key_12345';

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.equal(body.error, 'Missing stripe-signature header');
  });

  await t.test('returns 400 when stripe-signature is invalid', async () => {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret_key_12345';

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': 't=12345,v1=invalid_signature',
      },
      body: JSON.stringify({ type: 'checkout.session.completed' }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);

    const body = await res.json();
    assert.match(body.error, /^Webhook Error:/);
  });

  await t.test('successfully verifies and processes valid signed webhook payload', async () => {
    const secret = 'whsec_test_secret_key_12345';
    process.env.STRIPE_WEBHOOK_SECRET = secret;

    const payload = JSON.stringify({
      id: 'evt_test_checkout',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          metadata: { projectId: 'proj_test', targetTier: 'growth' },
        },
      },
    });

    const signature = stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'stripe-signature': signature,
      },
      body: payload,
    });

    const res = await POST(req);
    assert.equal(res.status, 200);

    const body = await res.json();
    assert.equal(body.received, true);
  });
});
