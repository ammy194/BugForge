import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { UserService, DEMO_PERSONAS } from '../services/userService';
import { syncProfileSchema } from '../validators/authValidators';

export class AuthController {
  /**
   * GET /api/v1/auth/personas
   * Returns available demo personas for fast switching in evaluations
   */
  static async getDemoPersonas(_req: Request, res: Response) {
    return ApiResponse.success({
      res,
      statusCode: 200,
      message: 'Demo personas retrieved',
      data: Object.values(DEMO_PERSONAS),
    });
  }

  /**
   * POST /api/v1/auth/sync-profile
   *
   * Creates/updates the profile row for the CALLING user only.
   *
   * SECURITY (Requirement 2): the user's identity (id + email) is taken
   * exclusively from `req.user`, which `requireAuth` populates from a
   * verified Supabase JWT (or a known demo session token) -- never from the
   * request body. The request body may only carry cosmetic profile fields
   * (full_name, avatar_url, primary_role); it can never contain a `user_id`
   * or `global_role` that would let a caller modify another account or
   * grant themselves elevated privileges. An existing profile's global_role
   * is always preserved as-is.
   */
  static async syncProfile(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required');
    }

    const validated = syncProfileSchema.parse(req.body);

    const profile = await UserService.syncProfile({
      id: req.user.id,
      email: req.user.email,
      full_name: validated.full_name || req.user.full_name,
      avatar_url: validated.avatar_url || req.user.avatar_url,
      global_role: req.user.global_role, // preserve; never escalate from body
      primary_role: validated.primary_role || req.user.primary_role,
    });

    return ApiResponse.success({
      res,
      statusCode: 200,
      data: profile,
      message: 'Profile synced successfully',
    });
  }
}
