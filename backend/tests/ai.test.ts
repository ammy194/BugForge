import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('AI-Powered Triage & Intelligence Endpoints', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('POST /api/v1/ai/duplicates should identify duplicate candidates with similarity scores', async () => {
    const res = await request(app)
      .post('/api/v1/ai/duplicates')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        project_id: ecomId,
        title: 'Checkout crashes with 500 error when applying an expired promo coupon',
        description: 'Customer entered expired discount coupon and checkout failed.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.duplicates.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.duplicates.some((d: any) => d.key === 'ECOM-1042')).toBe(true);
    expect(res.body.data.isDuplicateRisk).toBe(true);
  });

  it('POST /api/v1/ai/extract should extract structured fields from raw stack trace', async () => {
    const rawError = `TypeError: Cannot read properties of null (reading 'discount')
    at DiscountCalculator.calculateDiscount (src/services/discountService.ts:142:24)
    at CheckoutController.applyCoupon (src/controllers/checkoutController.ts:67:12)`;

    const res = await request(app)
      .post('/api/v1/ai/extract')
      .set('Authorization', 'Bearer demo_reporter')
      .send({ raw_text: rawError });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBeDefined();
    expect(res.body.data.repro_steps).toBeDefined();
    expect(res.body.data.suggested_priority).toBeDefined();
  });

  it('POST /api/v1/ai/root-cause should produce root cause analysis with Git diff patch', async () => {
    const res = await request(app)
      .post('/api/v1/ai/root-cause')
      .set('Authorization', 'Bearer demo_dev')
      .send({
        title: 'Checkout crashes when applying expired coupon code',
        description: 'Discount service throws unhandled null pointer when coupon has passed expiration date.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suspected_file).toContain('discountService.ts');
    expect(res.body.data.suggested_fix_diff).toContain('--- a/src/services/discountService.ts');
    expect(res.body.data.suggested_fix_diff).toContain('ExpiredCouponException');
  });

  it('POST /api/v1/ai/nl-query should translate natural language into structured filters', async () => {
    const res = await request(app)
      .post('/api/v1/ai/nl-query')
      .set('Authorization', 'Bearer demo_dev')
      .send({
        query: 'Show all open critical checkout bugs assigned to Bob',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.structured_filters.priority).toBe('P0_CRITICAL');
    expect(res.body.data.structured_filters.status).toBe('OPEN');
    expect(res.body.data.structured_filters.search).toBe('checkout');
  });
});
