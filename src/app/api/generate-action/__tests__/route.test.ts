import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';

describe('/api/generate-action route', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/generate-action', {
      method: 'POST',
      body: JSON.stringify({ promptType: 'pr-pitch' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain('Missing required fields');
  });

  it('generates a PR pitch stream successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/generate-action', {
      method: 'POST',
      body: JSON.stringify({
        promptType: 'pr-pitch',
        brandName: 'Lululemon',
        featureName: 'Nulu Fabric Softness',
        category: 'Athleisure',
        brandDetail: 'Proprietary brushed nylon yarn blend offering weightless coverage.',
        competitorName: 'Alo Yoga',
        competitorDetail: 'Airbrush polyester blend with higher sheen and compression.',
        competitorShare: 52,
        brandShare: 36,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('Lululemon');
    expect(text).toContain('Alo Yoga');
    expect(text).toContain('Subject:');
  });

  it('generates FAQ schema JSON-LD stream successfully', async () => {
    const req = new NextRequest('http://localhost:3000/api/generate-action', {
      method: 'POST',
      body: JSON.stringify({
        promptType: 'faq-schema',
        brandName: 'Lululemon',
        featureName: 'Nulu Fabric Softness',
        category: 'Athleisure',
        brandDetail: 'Proprietary brushed nylon yarn blend offering weightless coverage.',
        competitorName: 'Alo Yoga',
        competitorDetail: 'Airbrush polyester blend with higher sheen and compression.',
        competitorShare: 52,
        brandShare: 36,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain('FAQPage');
    expect(text).toContain('Lululemon');
    expect(text).toContain('Alo Yoga');
  });
});
