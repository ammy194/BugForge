import { z } from 'zod';

// Strict regex to reject Su@g, abc@, etc.
const strictEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const syncProfileSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email().regex(strictEmailRegex, 'Invalid email format'),
  full_name: z.string().min(1, 'Full name is required'),
  avatar_url: z.string().url().optional().or(z.literal('')),
  global_role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).default('DEVELOPER'),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(1, 'Full name cannot be empty').optional(),
  avatar_url: z.string().url().optional().or(z.literal('')),
  global_role: z.enum(['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER']).optional(),
});
