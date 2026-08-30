import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { UserService } from '../services/userService';
import { updateProfileSchema } from '../validators/authValidators';

export class UserController {
  /**
   * GET /api/v1/users/me
   * Retrieve currently authenticated user profile
   */
  static async getMe(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized('User session not found');
    }

    const profile = await UserService.getProfileById(req.user.id);
    if (!profile) {
      return ApiResponse.success({
        res,
        data: req.user,
        message: 'Profile retrieved',
      });
    }

    return ApiResponse.success({
      res,
      data: profile,
      message: 'Current profile retrieved',
    });
  }

  /**
   * PATCH /api/v1/users/me
   * Update profile for the current user
   */
  static async updateMe(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized('User session not found');
    }

    const validated = updateProfileSchema.parse(req.body);
    const updated = await UserService.updateProfile(req.user.id, validated);

    if (!updated) {
      throw AppError.notFound('User profile not found');
    }

    return ApiResponse.success({
      res,
      data: updated,
      message: 'Profile updated successfully',
    });
  }

  /**
   * GET /api/v1/users
   * List all users for mentions, assignee dropdowns, etc.
   */
  static async listUsers(req: Request, res: Response) {
    const search = req.query.search as string | undefined;
    const users = await UserService.listUsers(search);

    return ApiResponse.success({
      res,
      data: users,
      meta: { count: users.length },
      message: 'Users retrieved',
    });
  }
}
