import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 3 & 4: Bug Quality Score & 2-Tier Duplicate Radar', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  let duplicateIssueId = '';

  it('POST /api/v1/issues/quality-score should compute 0-100 quality score and checklist', async () => {
    const res = await request(app)
      .post('/api/v1/issues/quality-score')
      .set('Authorization', 'Bearer demo_dev')
      .send({
        title: 'Checkout crashes when applying expired coupon code',
        description: 'Applying expired coupon code returns HTTP 500 error instead of showing validation message.',
        repro_steps: '1. Add item to cart\n2. Enter coupon code SUMMER2024\n3. Click apply',
        expected_behavior: 'Coupon validation error: "Coupon expired"',
        actual_behavior: 'Page crashes with 500 Internal Server Error',
        environment: 'Chrome 128 / macOS 15.1',
        component_id: 'comp-1',
        version_id: 'ver-1',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBe(100);
    expect(res.body.data.rating).toBe('EXCELLENT');
    expect(res.body.data.checklist.length).toBe(8);
    expect(res.body.data.checklist.every((c: any) => c.passed)).toBe(true);
  });

  it('POST /api/v1/issues/quality-score should deduct points for missing environment, repro steps, and vague title', async () => {
    const res = await request(app)
      .post('/api/v1/issues/quality-score')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        title: 'bug',
        description: 'it broke',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.score).toBeLessThan(40);
    expect(res.body.data.rating).toBe('POOR');
    expect(res.body.data.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it('Setup: Create an issue to test "Mark as Duplicate" resolution', async () => {
    const res = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        project_id: ecomId,
        title: 'Duplicate coupon failure report',
        description: 'Checkout throws error on coupon validation',
        priority: 'P2_MEDIUM',
        severity: 'MAJOR',
      });

    expect(res.status).toBe(201);
    duplicateIssueId = res.body.data.id;
  });

  it('POST /api/v1/issues/:id/mark-duplicate should resolve ticket as DUPLICATE and cross-link comments', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${duplicateIssueId}/mark-duplicate`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        duplicate_of_key: 'ECOM-1042',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('RESOLVED');
    expect(res.body.data.resolution).toBe('DUPLICATE');

    // Verify timeline / comment was recorded
    const timelineRes = await request(app)
      .get(`/api/v1/issues/${duplicateIssueId}/timeline`)
      .set('Authorization', 'Bearer demo_dev');

    expect(timelineRes.status).toBe(200);
    expect(timelineRes.body.data.some((t: any) => t.title.includes('RESOLVED') || t.description?.includes('DUPLICATE'))).toBe(true);
  });
});
