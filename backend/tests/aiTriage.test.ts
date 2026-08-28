import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

describe('Feature 2: AI Bug Triage & Grok Provider Intelligence', () => {
  const app = createApp();
  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  it('POST /api/v1/ai/triage should suggest Priority, Severity, Component, Labels, and Missing Info for crash bug', async () => {
    const res = await request(app)
      .post('/api/v1/ai/triage')
      .send({
        project_id: ecomId,
        title: 'App crashes when uploading a large profile image',
        description: 'Uploading an image above 20MB crashes the profile page with out of memory exception.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggested_priority).toBe('P0_CRITICAL');
    expect(res.body.data.suggested_severity).toBe('CRITICAL');
    expect(Array.isArray(res.body.data.suggested_labels)).toBe(true);
    expect(res.body.data.suggested_labels.some((l: string) => ['upload', 'crash'].includes(l))).toBe(true);
    expect(Array.isArray(res.body.data.missing_information)).toBe(true);
    expect(res.body.data.missing_information.length).toBeGreaterThanOrEqual(1);
  });

  it('POST /api/v1/ai/triage should match component for Checkout & Payment bugs', async () => {
    const res = await request(app)
      .post('/api/v1/ai/triage')
      .send({
        project_id: ecomId,
        title: 'Checkout payment gateway times out on credit card authorization',
        description: 'Users cannot complete orders because Stripe charge times out after 30 seconds.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.suggested_priority).toBe('P1_HIGH');
    expect(res.body.data.suggested_component_name).toContain('Checkout');
  });
});
