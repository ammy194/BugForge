import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { UserService, DEMO_PERSONAS } from '../services/userService';
import { syncProfileSchema } from '../validators/authValidators';

export class AuthController {
  /**
   * POST /api/v1/auth/sync-profile
   * Synchronizes user profile with Supabase auth session
   */
  static async syncProfile(req: Request, res: Response) {
    const validatedData = syncProfileSchema.parse(req.body);
    const profile = await UserService.syncProfile(validatedData);

    return ApiResponse.success({
      res,
      statusCode: 200,
      message: 'Profile synchronized successfully',
      data: profile,
    });
  }

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
}
