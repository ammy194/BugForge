import { z } from 'zod';

export const transitionIssueSchema = z.object({
  status: z.enum([
    'OPEN',
    'TRIAGED',
    'IN_PROGRESS',
    'IN_REVIEW',
    'RESOLVED',
    'VERIFIED',
    'CLOSED',
    'REOPENED',
  ]),
  resolution: z
    .enum(['FIXED', 'WONT_FIX', 'DUPLICATE', 'INVALID', 'CANNOT_REPRODUCE'])
    .optional()
    .nullable(),
  comment: z.string().max(2000).optional().nullable(),
  assignee_id: z.string().optional().nullable(),
});

export const updateIssueAttributesSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(1).max(10000).optional(),
  priority: z.enum(['P0_CRITICAL', 'P1_HIGH', 'P2_MEDIUM', 'P3_LOW']).optional(),
  severity: z.enum(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL']).optional(),
  issue_type: z.enum(['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT']).optional(),
  assignee_id: z.string().optional().nullable(),
  component_id: z.string().optional().nullable(),
  version_id: z.string().optional().nullable(),
  milestone_id: z.string().optional().nullable(),
  environment: z.string().max(500).optional().nullable(),
  repro_steps: z.string().max(5000).optional().nullable(),
  expected_behavior: z.string().max(2000).optional().nullable(),
  actual_behavior: z.string().max(2000).optional().nullable(),
  due_date: z.string().optional().nullable(),
});
