import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 6: Release Health Dashboard & Transparent Readiness Scoring', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('GET /api/v1/releases/health should return readiness score, formula breakdown, and release notes', async () => {
    const res = await request(app)
      .get(`/api/v1/releases/health?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(typeof res.body.data.readiness_score).toBe('number');
    expect(res.body.data.formula_breakdown).toBeDefined();
    expect(res.body.data.formula_breakdown.base_score).toBe(100);
    expect(Array.isArray(res.body.data.formula_breakdown.deductions)).toBe(true);
    expect(res.body.data.release_notes_markdown).toContain('# Release Notes:');
  });
});
