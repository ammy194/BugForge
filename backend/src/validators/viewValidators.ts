import { z } from 'zod';

export const createSavedViewSchema = z.object({
  project_id: z.string().optional().nullable(),
  name: z.string().min(2, 'View name must be at least 2 characters').max(100),
  icon: z.string().optional().default('filter'),
  query_filters: z.object({
    project_id: z.string().optional(),
    project_key: z.string().optional(),
    search: z.string().optional(),
    status: z.string().optional(),
    priority: z.string().optional(),
    severity: z.string().optional(),
    issue_type: z.string().optional(),
    assignee_id: z.string().optional(),
    reporter_id: z.string().optional(),
    component_id: z.string().optional(),
    version_id: z.string().optional(),
    milestone_id: z.string().optional(),
    assigned_to_me: z.boolean().optional(),
    reported_by_me: z.boolean().optional(),
  }),
  is_shared: z.boolean().optional().default(false),
});
