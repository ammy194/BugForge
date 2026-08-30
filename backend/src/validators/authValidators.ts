import { z } from 'zod';
import { strictEmailSchema } from '../utils/validation';

/**
 * Public payload for POST /api/v1/auth/sync-profile.
 *
 * SECURITY: `id`, `email`, and `global_role` are intentionally NOT accepted
 * here. The authenticated user's identity (id + email) is always derived
 * from the verified Supabase JWT / demo session by `requireAuth`, and
 * global_role is never taken from a client payload -- see
 * AuthController.syncProfile and UserService.syncProfile.
 */
export const syncProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(120).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  primary_role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).optional(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name cannot be empty').max(120).optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  primary_role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).optional(),
});

export const registerSchema = z.object({
  full_name: z.string().trim().min(1, 'Full name is required').max(120),
  email: strictEmailSchema,
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  primary_role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).default('DEVELOPER'),
});

export const loginSchema = z.object({
  email: strictEmailSchema,
  password: z.string().min(1, 'Password is required'),
});
