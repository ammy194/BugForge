import { z } from 'zod';

/**
 * zod's built-in `.email()` check is intentionally permissive (it accepts
 * things like "Su@g" because it only requires a "local@domain" shape with no
 * TLD). BugForge needs a stricter, still-reasonable check that rejects
 * obviously malformed addresses on both signup and login while not
 * restricting users to any particular domain (see Requirement 13).
 *
 * Accepts:   student@gmail.com, john.doe@example.com, user@rvce.edu.in
 * Rejects:   Su@g, abc@, @example.com, abc.com, user@
 */
export const STRICT_EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

export const strictEmailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(254, 'Email is too long')
  .regex(STRICT_EMAIL_REGEX, 'Please enter a valid email address (e.g. name@example.com)');

export const isValidEmail = (email: string): boolean => STRICT_EMAIL_REGEX.test(email.trim());
