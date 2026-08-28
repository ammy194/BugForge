import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 7 & 8: GitHub Development Activity & Collaboration Links', () => {
  const app = createApp();
  const issueKey = 'ECOM-1042';

  it('GET /api/v1/issues/:id/git-links should return branches, PRs, commits, and CI runs', async () => {
    const res = await request(app)
      .get(`/api/v1/issues/${issueKey}/git-links`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.some((l: any) => l.link_type === 'PR')).toBe(true);
    expect(res.body.data.some((l: any) => l.link_type === 'BRANCH')).toBe(true);
    expect(res.body.data.some((l: any) => l.link_type === 'COMMIT')).toBe(true);
  });

  it('POST /api/v1/issues/:id/git-links should manually attach new GitHub PR link', async () => {
    const res = await request(app)
      .post(`/api/v1/issues/${issueKey}/git-links`)
      .set('Authorization', 'Bearer demo_dev')
      .send({
        link_type: 'PR',
        external_id: '#504',
        title: 'PR #504: Refactor discount voucher expiration check',
        url: 'https://github.com/ammy194/BugForge/pull/504',
        status: 'OPEN',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.external_id).toBe('#504');
    expect(res.body.data.link_type).toBe('PR');
  });
});
