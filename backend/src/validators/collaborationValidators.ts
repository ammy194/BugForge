import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(10000),
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(10000),
});

export const createGitLinkSchema = z.object({
  link_type: z.enum(['COMMIT', 'PR', 'BRANCH', 'CI_RUN']),
  external_id: z.string().min(1, 'External ID is required (e.g. SHA or PR number)').max(100),
  title: z.string().min(1, 'Title is required').max(250),
  url: z.string().url('Must be a valid URL'),
  author: z.string().max(100).optional(),
  status: z.string().max(50).optional(),
  metadata: z.record(z.any()).optional(),
});
