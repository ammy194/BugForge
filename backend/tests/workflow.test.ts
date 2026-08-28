import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Workflow State Machine & Lifecycle Endpoints', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  let testIssueKey = '';
  let testIssueId = '';

  it('Setup: Create a new issue in OPEN status', async () => {
    const res = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        project_id: ecomId,
        title: 'Workflow test bug for state transitions',
        description: 'Tracking lifecycle through full FSM cycle.',
        priority: 'P1_HIGH',
        severity: 'CRITICAL',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('OPEN');
    testIssueKey = res.body.data.key;
    testIssueId = res.body.data.id;
  });

  it('GET /api/v1/issues/:id/transitions should return valid next steps from OPEN', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${testIssueKey}/transitions`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((t: any) => t.to === 'IN_PROGRESS')).toBe(true);
  });

  it('POST /api/v1/issues/:id/transition: Transition OPEN -> IN_PROGRESS', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        status: 'IN_PROGRESS',
        comment: 'Assigned to self and starting investigation',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('IN_PROGRESS');
  });

  it('POST /api/v1/issues/:id/transition: Transition IN_PROGRESS -> IN_REVIEW', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        status: 'IN_REVIEW',
        comment: 'Opened PR #402 for code review',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('IN_REVIEW');
  });

  it('POST /api/v1/issues/:id/transition: Transition IN_REVIEW -> RESOLVED without resolution should return 400', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        status: 'RESOLVED',
        // missing resolution!
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('requires a valid resolution');
  });

  it('POST /api/v1/issues/:id/transition: Transition IN_REVIEW -> RESOLVED with resolution FIXED', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        status: 'RESOLVED',
        resolution: 'FIXED',
        comment: 'Merged PR #402 to master branch',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('RESOLVED');
    expect(res.body.data.resolution).toBe('FIXED');
  });

  it('POST /api/v1/issues/:id/transition: Transition RESOLVED -> VERIFIED by Reporter (QA)', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        status: 'VERIFIED',
        comment: 'Verified fix on staging environment build #890',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('VERIFIED');
  });

  it('POST /api/v1/issues/:id/transition: Transition VERIFIED -> CLOSED by PM', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_pm')
      .send({
        status: 'CLOSED',
        comment: 'Signed off for release v2.4.0',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('CLOSED');
  });

  it('POST /api/v1/issues/:id/transition: Direct transition CLOSED -> IN_PROGRESS should be FORBIDDEN', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        status: 'IN_PROGRESS',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('must be REOPENED first');
  });

  it('POST /api/v1/issues/:id/transition: Transition CLOSED -> REOPENED', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${testIssueKey}/transition`)
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        status: 'REOPENED',
        comment: 'Regression observed with discount boundary check',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REOPENED');
  });

  it('GET /api/v1/issues/:id/history should record full audit trail of all transitions', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${testIssueKey}/history`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(6);
    expect(res.body.data.some((h: any) => h.field_name === 'status' && h.new_value.includes('IN_PROGRESS'))).toBe(true);
    expect(res.body.data.some((h: any) => h.field_name === 'status' && h.new_value.includes('RESOLVED'))).toBe(true);
    expect(res.body.data.some((h: any) => h.field_name === 'status' && h.new_value.includes('CLOSED'))).toBe(true);
    expect(res.body.data.some((h: any) => h.field_name === 'status' && h.new_value.includes('REOPENED'))).toBe(true);
  });
});
