import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { IssueService } from '../services/issueService';
import { createIssueSchema, queryIssuesSchema } from '../validators/issueValidators';
import { transitionIssueSchema, updateIssueAttributesSchema } from '../validators/workflowValidators';

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
   * POST /api/v1/issues/:id/transition
   * Execute validated finite state machine status transition
   */
  static async transitionStatus(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = transitionIssueSchema.parse(req.body);
    const updatedIssue = await IssueService.transitionStatus(
      req.params.id,
      validated.status,
      {
        resolution: validated.resolution,
        comment: validated.comment,
        assignee_id: validated.assignee_id,
      },
      req.user.id
    );

    return ApiResponse.success({
      res,
      data: updatedIssue,
      message: `Issue ${updatedIssue.key} transitioned to ${validated.status}`,
    });
  }

  /**
   * GET /api/v1/issues/:id/transitions
   * Retrieve valid next transitions based on current user role
   */
  static async getTransitions(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const transitions = await IssueService.getAvailableTransitions(req.params.id, req.user.id);

    return ApiResponse.success({
      res,
      data: transitions,
      message: 'Available transitions retrieved',
    });
  }

  /**
   * PATCH /api/v1/issues/:id
   * Modify issue attributes with granular audit log diffs
   */
  static async updateAttributes(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = updateIssueAttributesSchema.parse(req.body);
    const updatedIssue = await IssueService.updateAttributes(req.params.id, validated, req.user.id);

    return ApiResponse.success({
      res,
      data: updatedIssue,
      message: 'Issue attributes updated successfully',
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
