import { z } from 'zod';

export const createProjectSchema = z.object({
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must not exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Project key must be uppercase alphanumeric (e.g. ECOM, MOB, API)'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100),
  description: z.string().max(1000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(1000).optional(),
  archived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  user_id: z.string().min(1, 'User ID is required'),
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).default('DEVELOPER'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']),
});

export const createComponentSchema = z.object({
  name: z.string().min(1, 'Component name is required').max(50),
  description: z.string().max(500).optional(),
  default_assignee_id: z.string().optional().nullable(),
});

export const createVersionSchema = z.object({
  name: z.string().min(1, 'Version name is required (e.g. v1.0.0)').max(50),
  description: z.string().max(500).optional(),
  status: z.enum(['UNRELEASED', 'RELEASED', 'ARCHIVED']).default('UNRELEASED'),
  release_date: z.string().optional().nullable(),
});

export const createMilestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required (e.g. Sprint 14)').max(50),
  description: z.string().max(500).optional(),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  due_date: z.string().optional().nullable(),
});
