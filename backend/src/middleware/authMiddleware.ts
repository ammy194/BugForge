import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { getSupabaseAdminClient } from '../services/supabase';
import { UserService, DEMO_PERSONAS } from '../services/userService';
import { AuthenticatedUser, GlobalRole } from '../types/auth';
import { env } from '../config/env';

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(AppError.unauthorized('Authentication required: Missing or malformed Authorization header'));
    }

    const token = authHeader.substring(7).trim();

    // 1. Check for Demo Persona Tokens (enables offline demoing & evaluation)
    if (token.startsWith('demo_')) {
      const roleKey = token.replace('demo_', '').toLowerCase();
      const persona = DEMO_PERSONAS[roleKey] || DEMO_PERSONAS.admin;
      req.user = persona;
      return next();
    }

    // 2. Supabase JWT Authentication
    const isPlaceholder = !env.SUPABASE_URL || env.SUPABASE_URL.includes('placeholder');
    if (!isPlaceholder) {
      const client = getSupabaseAdminClient();
      const { data: { user }, error } = await client.auth.getUser(token);

      if (error || !user) {
        return next(AppError.unauthorized(`Invalid or expired session token: ${error?.message || 'User not found'}`));
      }

      // Fetch or sync user profile
      let profile = await UserService.getProfileById(user.id);
      if (!profile) {
        profile = await UserService.syncProfile({
          id: user.id,
          email: user.email || 'user@bugforge.dev',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'BugForge User',
          avatar_url: user.user_metadata?.avatar_url,
          global_role: (user.user_metadata?.global_role as GlobalRole) || 'DEVELOPER',
        });
      }

      req.user = profile;
      return next();
    }

    // 3. Fallback for Local Dev Token
    if (token === 'dev_token') {
      req.user = DEMO_PERSONAS.admin;
      return next();
    }

    return next(AppError.unauthorized('Invalid or expired authentication token'));
  } catch (err: any) {
    return next(AppError.unauthorized(`Authentication verification failed: ${err.message}`));
  }
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7).trim();
    if (token.startsWith('demo_')) {
      const roleKey = token.replace('demo_', '').toLowerCase();
      req.user = DEMO_PERSONAS[roleKey] || DEMO_PERSONAS.admin;
    } else if (token === 'dev_token') {
      req.user = DEMO_PERSONAS.admin;
    }
    return next();
  } catch {
    return next();
  }
};

export const requireGlobalRole = (allowedRoles: GlobalRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.global_role)) {
      return next(
        AppError.forbidden(
          `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: ${req.user.global_role}`
        )
      );
    }

    next();
  };
};
