import { z } from 'zod';

export const githubPushWebhookSchema = z.object({
  ref: z.string().optional(),
  commits: z.array(
    z.object({
      id: z.string(),
      message: z.string(),
      url: z.string().url(),
      author: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      timestamp: z.string(),
    })
  ),
  repository: z
    .object({
      name: z.string(),
      full_name: z.string(),
    })
    .optional(),
});

export const githubPRWebhookSchema = z.object({
  action: z.enum(['opened', 'closed', 'reopened', 'synchronize']),
  number: z.number(),
  pull_request: z.object({
    title: z.string(),
    html_url: z.string().url(),
    body: z.string().optional().nullable(),
    head: z.object({
      ref: z.string(),
    }),
    user: z.object({
      login: z.string(),
    }),
    merged: z.boolean().optional().default(false),
  }),
});

export const ciFailureWebhookSchema = z.object({
  project_key: z.string().min(2),
  test_name: z.string().min(1),
  build_id: z.string().min(1),
  build_url: z.string().url(),
  branch: z.string().min(1),
  commit_sha: z.string().min(6),
  commit_author: z.string().optional(),
  error_message: z.string().min(1),
  stack_trace: z.string().optional(),
});

export const createWebhookSchema = z.object({
  project_id: z.string().min(1),
  url: z.string().url('Webhook endpoint must be a valid URL'),
  secret: z.string().optional(),
  events: z.array(z.enum(['issue.created', 'issue.updated', 'issue.status_changed', 'issue.resolved', 'comment.created', 'ci.failed'])),
  is_active: z.boolean().optional().default(true),
});
