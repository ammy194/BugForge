import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { ViewService } from '../services/viewService';
import { createSavedViewSchema } from '../validators/viewValidators';

export class ViewController {
  static async getSavedViews(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const projectId = req.query.project_id as string | undefined;
    const views = await ViewService.getSavedViews(req.user.id, projectId);

    return ApiResponse.success({
      res,
      data: views,
      message: 'Saved views retrieved',
    });
  }

  static async createSavedView(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = createSavedViewSchema.parse(req.body);
    const view = await ViewService.createSavedView(validated, req.user.id);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: view,
      message: `Saved view "${view.name}" created`,
    });
  }

  static async deleteSavedView(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    await ViewService.deleteSavedView(req.params.id, req.user.id);
    return ApiResponse.success({
      res,
      message: 'Saved view deleted',
    });
  }
}
