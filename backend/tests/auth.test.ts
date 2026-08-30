import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Auth & User Profile Endpoints', () => {
  const app = createApp();

  it('GET /api/v1/auth/personas should return list of pre-configured demo personas', async () => {
    const res = await request(app).get('/api/v1/auth/personas');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data[0].global_role).toBeDefined();
  });

  it('GET /api/v1/users/me without token should return 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/users/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Authentication required');
  });

  it('GET /api/v1/users/me with demo admin token should return admin profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('admin@bugforge.dev');
    expect(res.body.data.global_role).toBe('ADMIN');
  });

  it('GET /api/v1/users/me with demo developer token should return developer profile', async () => {
    const res = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe('bob.dev@bugforge.dev');
    expect(res.body.data.global_role).toBe('DEVELOPER');
  });

  it('POST /api/v1/auth/sync-profile requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sync-profile')
      .send({ full_name: 'New Test User' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/sync-profile syncs the AUTHENTICATED caller only, ignoring any client-supplied identity/role', async () => {
    const res = await request(app)
      .post('/api/v1/auth/sync-profile')
      .set('Authorization', 'Bearer demo_dev')
      .send({
        full_name: 'Renamed Bob',
        // Attempted privilege escalation / identity spoofing -- must be ignored.
        id: '11111111-1111-4111-a111-111111111111',
        user_id: '11111111-1111-4111-a111-111111111111',
        global_role: 'ADMIN',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Identity stays the authenticated demo_dev persona, not the spoofed admin id.
    expect(res.body.data.id).toBe('33333333-3333-4333-a333-333333333333');
    expect(res.body.data.email).toBe('bob.dev@bugforge.dev');
    // Role is never escalated from the request body.
    expect(res.body.data.global_role).toBe('DEVELOPER');
  });

  it('GET /api/v1/users should list all users when authenticated', async () => {
    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', 'Bearer demo_admin');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });
});
