import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Core Bug Creation & Issue Management Endpoints', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('GET /api/v1/issues should list all issues with pagination', async () => {
    const res = await request(app)
      .get('/api/v1/issues')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(5);
    expect(res.body.meta.total).toBeGreaterThanOrEqual(5);
  });

  it('GET /api/v1/issues/ECOM-1042 should retrieve full issue details with relations', async () => {
    const res = await request(app)
      .get('/api/v1/issues/ECOM-1042')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toBe('ECOM-1042');
    expect(res.body.data.title).toContain('Checkout crashes');
    expect(res.body.data.reporter).toBeDefined();
    expect(res.body.data.assignee).toBeDefined();
    expect(res.body.data.component).toBeDefined();
    expect(res.body.data.history.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/issues should create a bug with atomic key generation and initial history', async () => {
    const bugPayload = {
      project_id: ecomId,
      title: 'Cart item count does not update after removing item from mini-cart drawer',
      description: 'When removing item from drawer, badge still shows count 2 until full page refresh.',
      issue_type: 'BUG',
      priority: 'P1_HIGH',
      severity: 'CRITICAL',
      assignee_id: '33333333-3333-4333-a333-333333333333', // Bob Dev
      component_id: 'c1',
      environment: 'Chrome 128 / Windows 11',
      repro_steps: '1. Add 2 items\n2. Open drawer\n3. Click Remove\n4. Observe badge',
      expected_behavior: 'Badge decreases to 1 immediately',
      actual_behavior: 'Badge remains 2',
    };

    const res = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer demo_reporter')
      .send(bugPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toMatch(/^ECOM-\d+$/);
    expect(res.body.data.status).toBe('OPEN');
    expect(res.body.data.assignee.full_name).toContain('Bob Chen');
    expect(res.body.data.history.some((h: any) => h.field_name === 'CREATED')).toBe(true);
  });

  it('GET /api/v1/notifications for assigned developer should include assignment alert', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((n: any) => n.type === 'ASSIGNED')).toBe(true);
  });

  it('POST /api/v1/issues with invalid schema should return 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        project_id: ecomId,
        title: 'AB', // too short (<3)
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Validation failed');
  });
});
