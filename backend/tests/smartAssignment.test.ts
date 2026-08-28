import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 5: Smart Assignment Engine & Component Ownership', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('POST /api/v1/issues/suggest-assignee should suggest component owner with clear reason bullets', async () => {
    const res = await request(app)
      .post('/api/v1/issues/suggest-assignee')
      .set('Authorization', 'Bearer demo_pm')
      .send({
        project_id: ecomId,
        title: 'Checkout cart crashes on applying expired coupon code',
        description: 'Discount calculation fails with null pointer in payment pipeline.',
        priority: 'P1_HIGH',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggested_name).toBeDefined();
    expect(res.body.data.confidence_score).toBeGreaterThanOrEqual(60);
    expect(Array.isArray(res.body.data.reasons)).toBe(true);
    expect(res.body.data.reasons.length).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(res.body.data.candidates)).toBe(true);
  });
});
