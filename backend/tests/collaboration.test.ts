import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Issue Details & Collaboration Endpoints', () => {
  const app = createApp();
  const issueKey = 'ECOM-1042';

  let createdCommentId = '';

  it('GET /api/v1/issues/:id/comments should list comments for issue', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${issueKey}/comments`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/v1/issues/:id/comments should create comment and trigger @mention notification', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${issueKey}/comments`)
      .set('Authorization', 'Bearer demo_pm')
      .send({
        content: 'Hey @Bob Chen, please ensure we include a regression unit test in PR #382.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toContain('@Bob Chen');
    createdCommentId = res.body.data.id;

    // Check that Bob received mention notification
    const notifs = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', 'Bearer demo_dev');

    expect(notifs.status).toBe(200);
    expect(notifs.body.data.some((n: any) => n.type === 'MENTIONED')).toBe(true);
  });

  it('GET /api/v1/issues/:id/timeline should return unified activity stream', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${issueKey}/timeline`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(4);
    expect(res.body.data.some((e: any) => e.type === 'COMMENT')).toBe(true);
    expect(res.body.data.some((e: any) => e.type === 'GIT_LINK')).toBe(true);
  });

  it('GET /api/v1/issues/:id/git-links should return linked commits, branches, PRs, and CI runs', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${issueKey}/git-links`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.some((g: any) => g.link_type === 'PR')).toBe(true);
    expect(res.body.data.some((g: any) => g.link_type === 'COMMIT')).toBe(true);
    expect(res.body.data.some((g: any) => g.link_type === 'CI_RUN')).toBe(true);
  });

  it('DELETE /api/v1/issues/:id/comments/:commentId should delete author comment', async () => {
    const res = await request(app)
      .delete(`/api/v1/issues/${issueKey}/comments/${createdCommentId}`)
      .set('Authorization', 'Bearer demo_pm');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
