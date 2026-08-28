import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 1: CI Provider Failure Ingestion & 1-Click Bug Creation', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  let failureId = '';

  it('GET /api/v1/ci/failures should return seeded CI test failures', async () => {
    const res = await request(app)
      .get(`/api/v1/ci/failures?project_id=${ecomId}`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);

    const failure = res.body.data.find((f: any) => f.test_name.includes('CheckoutTest'));
    expect(failure).toBeDefined();
    expect(failure.error_message).toContain('HTTP 500');
    expect(failure.branch).toBe('fix/coupon-validation');
    expect(failure.commit_sha).toContain('a82f91c');
  });

  it('POST /api/v1/ci/failures should ingest custom CI failure via GitHubActionsProvider', async () => {
    const payload = {
      provider: 'github_actions',
      project_key: 'ECOM',
      test_suite: 'OrderPipelineTest',
      test_name: 'OrderPipelineTest.testZeroInventoryCheckout()',
      error_message: 'AssertionError: Expected 409 OutOfStock but received 200 OrderPlaced',
      expected_result: 'HTTP 409 OutOfStock',
      actual_result: 'HTTP 200 OrderPlaced (Negative inventory anomaly)',
      build_id: 'gha-run-99120',
      build_url: 'https://github.com/ammy194/BugForge/actions/runs/99120',
      branch: 'feature/order-orchestrator',
      commit_sha: 'b7c8d9e0f1a23456789012345678901234567890',
      commit_author: 'Bob Chen',
      environment: 'Node 22 / Ubuntu 24.04 runner',
    };

    const res = await request(app)
      .post('/api/v1/ci/failures')
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.status).toBe('UNRESOLVED');

    failureId = res.body.data.id;
  });

  it('POST /api/v1/ci/failures/:id/create-issue should convert CI failure into structured Bug with 1 click', async () => {
    const res = await request(app)
      .post(`/api/v1/ci/failures/${failureId}/create-issue`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.issue).toBeDefined();
    expect(res.body.data.issue.key).toMatch(/^ECOM-\d+$/);
    expect(res.body.data.issue.title).toContain('[CI/CD] OrderPipelineTest.testZeroInventoryCheckout()');
    expect(res.body.data.issue.priority).toBe('P0_CRITICAL');
    expect(res.body.data.failure.status).toBe('CONVERTED_TO_ISSUE');
    expect(res.body.data.failure.converted_issue_id).toBe(res.body.data.issue.id);

    // Verify git links were automatically attached
    const gitRes = await request(app)
      .get(`/api/v1/issues/${res.body.data.issue.id}/git-links`)
      .set('Authorization', 'Bearer demo_dev');

    expect(gitRes.status).toBe(200);
    expect(gitRes.body.data.some((l: any) => l.link_type === 'CI_RUN')).toBe(true);
    expect(gitRes.body.data.some((l: any) => l.link_type === 'COMMIT')).toBe(true);
  });
});
