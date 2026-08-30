import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { UserService, DEMO_PERSONAS } from '../services/userService';

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
}
