import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { ReleaseHealthService } from '../services/releaseHealthService';
import { AppError } from '../utils/appError';

export class ReleaseController {
  /**
   * GET /api/v1/releases/health
   */
  static async getHealth(req: Request, res: Response) {
    const { project_id, version_id } = req.query;
    if (!project_id || typeof project_id !== 'string') {
      throw AppError.badRequest('project_id query param is required');
    }

    const health = await ReleaseHealthService.getReleaseHealth(
      project_id,
      typeof version_id === 'string' ? version_id : undefined
    );

    return ApiResponse.success({
      res,
      data: health,
      message: 'Release health metrics retrieved',
    });
  }
}
