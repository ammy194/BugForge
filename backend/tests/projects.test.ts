import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Project Management & RBAC Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/projects unauthenticated should return 401', async () => {
    const res = await request(app).get('/api/v1/projects');
    expect(res.status).toBe(401);
  });

  it('GET /api/v1/projects as Admin should return all projects', async () => {
    const res = await request(app)
      .get('/api/v1/projects')
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.some((p: any) => p.key === 'ECOM')).toBe(true);
  });

  it('POST /api/v1/projects as Admin should create a new project', async () => {
    const newProj = {
      key: `TEST${Math.floor(Math.random() * 1000)}`,
      name: 'Automated Test Project',
      description: 'Testing project creation endpoint',
    };

    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer demo_admin')
      .send(newProj);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toBe(newProj.key);
    expect(res.body.data.name).toBe(newProj.name);
  });

  it('POST /api/v1/projects with duplicate key should return 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/projects')
      .set('Authorization', 'Bearer demo_admin')
      .send({
        key: 'ECOM',
        name: 'Duplicate ECOM',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/projects/:id/members should return member list with roles', async () => {
    const res = await request(app)
      .get('/api/v1/projects/ecom-proj-00000000-0000-0000-000000000001/members')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data.some((m: any) => m.role === 'PROJECT_MANAGER')).toBe(true);
  });

  it('POST /api/v1/projects/:id/members as Developer (insufficient role) should return 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/v1/projects/ecom-proj-00000000-0000-0000-000000000001/members')
      .set('Authorization', 'Bearer demo_dev')
      .send({
        user_id: 'some-user-id',
        role: 'DEVELOPER',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Insufficient project permissions');
  });

  it('GET /api/v1/projects/:id/components should return component list', async () => {
    const res = await request(app)
      .get('/api/v1/projects/ecom-proj-00000000-0000-0000-000000000001/components')
      .set('Authorization', 'Bearer demo_pm');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('POST /api/v1/projects/:id/components as PM should create a new component', async () => {
    const res = await request(app)
      .post('/api/v1/projects/ecom-proj-00000000-0000-0000-000000000001/components')
      .set('Authorization', 'Bearer demo_pm')
      .send({
        name: `Notification Engine ${Date.now()}`,
        description: 'Push notifications & Webhook dispatcher',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toContain('Notification Engine');
  });
});
