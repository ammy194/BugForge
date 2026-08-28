import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Developer Ecosystem & Webhook Integrations', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  let testIssueKey = '';

  it('Setup: Create an issue to test GitHub commit linking and auto-resolution', async () => {
    const res = await request(app)
      .post('/api/v1/issues')
      .set('Authorization', 'Bearer demo_reporter')
      .send({
        project_id: ecomId,
        title: 'Checkout button disabled during network glitch',
        description: 'Network timeout leaves checkout button permanently disabled.',
        priority: 'P1_HIGH',
        severity: 'CRITICAL',
      });

    expect(res.status).toBe(201);
    testIssueKey = res.body.data.key;
  });

  it('GET /api/v1/github/branch/:issueId should suggest standard git branch checkout command', async () => {
    const res = await request(app)
      .get(`/api/v1/github/branch/${testIssueKey}`)
      .set('Authorization', 'Bearer demo_dev');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.branch_name).toContain(`fix/${testIssueKey}`);
    expect(res.body.data.checkout_command).toContain(`git checkout -b fix/${testIssueKey}`);
  });

  it('POST /api/v1/github/webhook with "Fixes KEY" commit should link commit and auto-resolve issue', async () => {
    const pushPayload = {
      ref: 'refs/heads/main',
      commits: [
        {
          id: 'e4f5a6b7c8d90123456789abcdef0123456789ab',
          message: `fix(checkout): re-enable checkout button on network error\n\nFixes ${testIssueKey}`,
          url: `https://github.com/ammy194/BugForge/commit/e4f5a6b`,
          author: {
            name: 'Bob Chen',
            email: 'bob.dev@bugforge.dev',
          },
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const res = await request(app)
      .post('/api/v1/github/webhook')
      .send(pushPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].linked_issues).toContain(testIssueKey);
    expect(res.body.data[0].auto_resolved).toContain(testIssueKey);

    // Verify issue status changed to RESOLVED
    const issueRes = await request(app)
      .get(`/api/v1/issues/${testIssueKey}`)
      .set('Authorization', 'Bearer demo_dev');

    expect(issueRes.status).toBe(200);
    expect(issueRes.body.data.status).toBe('RESOLVED');
    expect(issueRes.body.data.resolution).toBe('FIXED');
  });

  it('POST /api/v1/ci/webhook should automatically file defect ticket on CI test failure', async () => {
    const ciPayload = {
      project_key: 'ECOM',
      test_name: 'testPaymentGatewayRetryHmacVerification',
      build_id: 'gh-run-49201',
      build_url: 'https://github.com/ammy194/BugForge/actions/runs/49201',
      branch: 'main',
      commit_sha: '8f9e0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f',
      commit_author: 'github-actions[bot]',
      error_message: 'AssertionError: Expected 200 OK but received 401 SignatureMismatch',
      stack_trace: 'at PaymentVerifier.test (tests/payment.spec.ts:88:12)',
    };

    const res = await request(app)
      .post('/api/v1/ci/webhook')
      .send(ciPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.key).toMatch(/^ECOM-\d+$/);
    expect(res.body.data.title).toContain('[CI/CD]');
    expect(res.body.data.priority).toBe('P0_CRITICAL');
  });

  it('POST /api/v1/webhooks should create outbound webhook subscription', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks')
      .set('Authorization', 'Bearer demo_pm')
      .send({
        project_id: ecomId,
        url: 'https://webhook.site/test-endpoint',
        events: ['issue.created', 'issue.resolved'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.url).toBe('https://webhook.site/test-endpoint');
  });
});
