import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 9 & 10: Engineering Metrics & Security Audit Center', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('GET /api/v1/analytics/overview should return MTTD, MTTR, reopen rate, and component health index', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/overview?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.mttr_hours).toBeDefined();
    expect(res.body.data.mttd_hours).toBeDefined();
    expect(res.body.data.reopen_rate_percentage).toBeDefined();
    expect(res.body.data.defect_escape_rate_percentage).toBeDefined();
    expect(Array.isArray(res.body.data.component_stats)).toBe(true);
    expect(res.body.data.component_stats[0].health_status).toBeDefined();
  });

  it('GET /api/v1/audit should list security audit events with actors, IP addresses, and actions', async () => {
    const res = await request(app)
      .get('/api/v1/audit')
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0].action).toBeDefined();
    expect(res.body.data[0].actor_name).toBeDefined();
    expect(res.body.data[0].ip_address).toBeDefined();
  });

  it('GET /api/v1/audit/export?format=csv should download audit trail in CSV format', async () => {
    const res = await request(app)
      .get('/api/v1/audit/export?format=csv')
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Actor Name');
    expect(res.text).toContain('Target Entity');
  });
});
