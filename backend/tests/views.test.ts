import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Search, Filtering, and Saved Views Endpoints', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  let createdViewId = '';

  it('GET /api/v1/views should return system preset views', async () => {
    const res = await request(app)
      .get(`/api/v1/views?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data.some((v: any) => v.name === 'Critical Checkout Bugs')).toBe(true);
  });

  it('POST /api/v1/views should create a custom saved view', async () => {
    const res = await request(app)
      .post('/api/v1/views')
      .set('Authorization', 'Bearer demo_pm')
      .send({
        project_id: ecomId,
        name: 'My Team High Priority Items',
        icon: 'star',
        query_filters: {
          priority: 'P1_HIGH',
          status: 'OPEN',
        },
        is_shared: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My Team High Priority Items');
    createdViewId = res.body.data.id;
  });

  it('GET /api/v1/issues?search=expired should perform cross-field full text search', async () => {
    const res = await request(app)
      .get('/api/v1/issues?search=expired')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((i: any) => i.key === 'ECOM-1042')).toBe(true);
  });

  it('DELETE /api/v1/views/:id should delete custom saved view', async () => {
    const res = await request(app)
      .delete(`/api/v1/views/${createdViewId}`)
      .set('Authorization', 'Bearer demo_pm');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
