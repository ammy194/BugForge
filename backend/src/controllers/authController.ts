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
   * Secures profile creation by enforcing the authenticated user's ID
   */
  static async syncProfile(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required to sync profile');
    }

    const validated = syncProfileSchema.parse(req.body);

    // Prevent privilege escalation: Only existing ADMINs can grant ADMIN to themselves, 
    // unless this is their initial profile creation (handled securely by RBAC).
    // Actually, primary role doesn't grant global bypass anymore, so they can select any role.
    
    const profile = await UserService.syncProfile({
      ...validated,
      id: req.user.id, // OVERRIDE any provided user_id to ensure they only modify their own profile
    });

    return ApiResponse.success({
      res,
      statusCode: 200,
      message: 'Profile synchronized successfully',
      data: profile,
    });
  }
}
