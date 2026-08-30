import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Bug Fix Regression: Project Archiving & Issue Resolution Stats Sync', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  describe('Issue 1: Archive Project persistence', () => {
    let newProjectId = '';
    let newProjectKey = '';

    it('Setup: create a fresh project to archive', async () => {
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', 'Bearer demo_admin')
        .send({ key: `ARCH${Date.now()}`.slice(0, 10), name: 'Archive Target Project' });

      expect(res.status).toBe(201);
      newProjectId = res.body.data.id;
      newProjectKey = res.body.data.key;
    });

    it('New project appears in the active projects list', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', 'Bearer demo_admin');

      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p.id === newProjectId)).toBe(true);
    });

    it('DELETE /api/v1/projects/:id archives the project and returns a success response', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${newProjectId}`)
        .set('Authorization', 'Bearer demo_admin');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.archived).toBe(true);
    });

    it('Archived project disappears from the active projects listing', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', 'Bearer demo_admin');

      expect(res.status).toBe(200);
      expect(res.body.data.some((p: any) => p.id === newProjectId)).toBe(false);
    });

    it('Archived project state persists (simulated refresh via a fresh GET) and record is not deleted', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${newProjectId}`)
        .set('Authorization', 'Bearer demo_admin');

      // Non-destructive archival: the record still exists and is flagged archived.
      expect(res.status).toBe(200);
      expect(res.body.data.archived).toBe(true);
      expect(res.body.data.key).toBe(newProjectKey);
    });

    it('Unrelated existing projects remain unaffected', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', 'Bearer demo_admin');

      expect(res.body.data.some((p: any) => p.id === ecomId)).toBe(true);
    });
  });

  describe('Issue 2: Resolving an issue updates project statistics', () => {
    let issueKey = '';
    let openBefore = 0;
    let resolvedBefore = 0;

    it('Setup: record baseline project stats and create an OPEN issue', async () => {
      const projRes = await request(app)
        .get(`/api/v1/projects/${ecomId}`)
        .set('Authorization', 'Bearer demo_admin');
      openBefore = projRes.body.data.open_issues_count;
      resolvedBefore = projRes.body.data.resolved_issues_count;

      const issueRes = await request(app)
        .post('/api/v1/issues')
        .set('Authorization', 'Bearer demo_reporter')
        .send({
          project_id: ecomId,
          title: 'Regression test bug for stats sync',
          description: 'Verifies Projects section reflects resolution.',
          priority: 'P2_MEDIUM',
          severity: 'MINOR',
        });
      expect(issueRes.status).toBe(201);
      issueKey = issueRes.body.data.key;

      // Creating an issue bumps open_issues_count by 1.
      const afterCreate = await request(app)
        .get(`/api/v1/projects/${ecomId}`)
        .set('Authorization', 'Bearer demo_admin');
      expect(afterCreate.body.data.open_issues_count).toBe(openBefore + 1);
    });

    it('Resolving the issue increments resolved_issues_count and decrements open_issues_count', async () => {
      const transitionRes = await request(app)
        .post(`/api/v1/issues/${issueKey}/transition`)
        .set('Authorization', 'Bearer demo_dev')
        .send({ status: 'RESOLVED', resolution: 'FIXED' });

      expect(transitionRes.status).toBe(200);
      expect(transitionRes.body.data.status).toBe('RESOLVED');

      const projRes = await request(app)
        .get(`/api/v1/projects/${ecomId}`)
        .set('Authorization', 'Bearer demo_admin');

      expect(projRes.body.data.open_issues_count).toBe(openBefore);
      expect(projRes.body.data.resolved_issues_count).toBe(resolvedBefore + 1);
    });

    it('Reopening the issue moves it back to the open bucket', async () => {
      const transitionRes = await request(app)
        .post(`/api/v1/issues/${issueKey}/transition`)
        .set('Authorization', 'Bearer demo_reporter')
        .send({ status: 'REOPENED' });

      expect(transitionRes.status).toBe(200);

      const projRes = await request(app)
        .get(`/api/v1/projects/${ecomId}`)
        .set('Authorization', 'Bearer demo_admin');

      expect(projRes.body.data.open_issues_count).toBe(openBefore + 1);
      expect(projRes.body.data.resolved_issues_count).toBe(resolvedBefore);
    });
  });
});
