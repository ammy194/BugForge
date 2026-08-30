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

  it('POST /api/v1/auth/sync-profile should upsert a profile', async () => {
    const newProfile = {
      email: 'newuser@bugforge.dev',
      full_name: 'New Test User',
      global_role: 'DEVELOPER',
    };

    const res = await request(app)
      .post('/api/v1/auth/sync-profile')
      .set('Authorization', 'Bearer demo_dev')
      .send(newProfile);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(newProfile.email);
    expect(res.body.data.full_name).toBe(newProfile.full_name);
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
