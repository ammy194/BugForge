import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { IssueService } from '../services/issueService';
import { createIssueSchema, queryIssuesSchema } from '../validators/issueValidators';

export class IssueController {
  /**
   * POST /api/v1/issues
   * Creates a new issue / bug with atomic key generation & audit trail
   */
  static async createIssue(req: Request, res: Response) {
    if (!req.user) {
      throw AppError.unauthorized('Authentication required to report issues');
    }

    const validated = createIssueSchema.parse(req.body);
    const createdIssue = await IssueService.createIssue(validated, req.user.id);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: createdIssue,
      message: `Issue ${createdIssue.key} created successfully`,
    });
  }

  /**
   * GET /api/v1/issues/:id
   * Fetch issue detail by UUID or Key (e.g. ECOM-1042)
   */
  static async getIssue(req: Request, res: Response) {
    const issue = await IssueService.getIssue(req.params.id);
    if (!issue) {
      throw AppError.notFound(`Issue '${req.params.id}' not found`);
    }

    return ApiResponse.success({
      res,
      data: issue,
      message: 'Issue retrieved successfully',
    });
  }

  /**
   * GET /api/v1/issues
   * Search and filter issues with pagination
   */
  static async listIssues(req: Request, res: Response) {
    const query = queryIssuesSchema.parse(req.query);
    const result = await IssueService.listIssues(query as any);

    return ApiResponse.success({
      res,
      data: result.issues,
      meta: {
        total: result.total,
        limit: query.limit,
        offset: query.offset,
      },
      message: 'Issues retrieved',
    });
  }

  /**
   * GET /api/v1/issues/:id/history
   * Retrieve immutable audit history for an issue
   */
  static async getIssueHistory(req: Request, res: Response) {
    const history = await IssueService.getIssueHistory(req.params.id);
    return ApiResponse.success({
      res,
      data: history,
      message: 'Issue history retrieved',
    });
  }
}
