import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Reporting, Metrics, and Export Endpoints', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('GET /api/v1/analytics/overview should return team metrics, MTTR, component stats, and release readiness', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/overview?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mttr_hours).toBeDefined();
    expect(res.body.data.component_stats.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.severity_distribution).toBeDefined();
    expect(res.body.data.release_readiness).toBeDefined();
    expect(res.body.data.velocity_ratio).toBeGreaterThan(0);
  });

  it('GET /api/v1/analytics/export/csv should return CSV formatted file stream', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/export/csv?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_pm');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Key,Title,Status');
    expect(res.text).toContain('ECOM-1042');
  });

  it('GET /api/v1/analytics/export/json should return JSON formatted defect records', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/export/json?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_pm');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body.some((i: any) => i.key === 'ECOM-1042')).toBe(true);
  });
});
