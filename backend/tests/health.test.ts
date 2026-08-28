import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Health and System Endpoints', () => {
  const app = createApp();

  it('GET / should return online status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('BugForge API Server');
    expect(res.body.status).toBe('online');
  });

  it('GET /api/v1 should return API metadata and endpoints', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('BugForge REST API');
    expect(res.body.version).toBe('v1');
    expect(res.body.endpoints).toBeDefined();
    expect(res.body.endpoints.health).toBe('/api/v1/health');
  });

  it('GET /api/v1/health should return 200 and healthy status', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.uptime).toBeDefined();
    expect(res.body.data.system).toBeDefined();
    expect(res.body.data.integrations).toBeDefined();
  });

  it('GET /api/v1/non-existent-route should return 404 with structured error response', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('API endpoint not found');
  });
});
