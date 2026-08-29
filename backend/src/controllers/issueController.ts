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
   * POST /api/v1/issues/simulate-random
   * Generates a random realistic bug for hackathon live demo mode.
   */
  static async simulateRandomIssue(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const projects = [
      'ecom-proj-00000000-0000-0000-000000000001',
      'mob-proj-00000000-0000-0000-000000000002',
      'api-proj-00000000-0000-0000-000000000003'
    ];
    
    const randomBugs = [
      // ECOM Bugs
      {
        project_id: projects[0],
        title: 'Memory leak in payment processing worker',
        description: 'The background worker for Stripe webhooks is retaining HTTP context objects in memory. Over 24h, this causes OOM crashes.',
        priority: 'P0_CRITICAL',
        severity: 'BLOCKER',
        issue_type: 'BUG',
      },
      {
        project_id: projects[0],
        title: 'UI overlap on mobile Safari checkout',
        description: 'The "Complete Order" button is partially covered by the iOS safe area inset when the keyboard is open.',
        priority: 'P2_MEDIUM',
        severity: 'MINOR',
        issue_type: 'BUG',
      },
      {
        project_id: projects[0],
        title: 'Database connection pool exhaustion during flash sale',
        description: 'During high load, the connection pool runs out of connections and times out requests instead of queueing them.',
        priority: 'P1_HIGH',
        severity: 'MAJOR',
        issue_type: 'BUG',
      },
      // MOB Bugs
      {
        project_id: projects[1],
        title: 'FaceID authentication failing on iOS 17.4',
        description: 'The biometrics framework is throwing an unexpected domain error on the latest iOS update when falling back to passcode.',
        priority: 'P0_CRITICAL',
        severity: 'BLOCKER',
        issue_type: 'BUG',
      },
      {
        project_id: projects[1],
        title: 'Transaction history list jitters on scroll',
        description: 'The FlatList rendering the transaction history is dropping frames on older Android devices when scrolling fast.',
        priority: 'P2_MEDIUM',
        severity: 'MINOR',
        issue_type: 'BUG',
      },
      // API Bugs
      {
        project_id: projects[2],
        title: 'GraphQL N+1 query issue in user profiles',
        description: 'Resolving user followers is generating separate SQL queries for each follower, causing significant database load.',
        priority: 'P1_HIGH',
        severity: 'MAJOR',
        issue_type: 'BUG',
      },
      {
        project_id: projects[2],
        title: 'OAuth token refresh endpoint returning 500 intermittently',
        description: 'The Redis cache occasionally drops the refresh token before it expires, leading to a 500 error during validation.',
        priority: 'P1_HIGH',
        severity: 'CRITICAL',
        issue_type: 'BUG',
      }
    ];

    const bug = randomBugs[Math.floor(Math.random() * randomBugs.length)];

    const simulatedIssueData = {
      project_id: bug.project_id,
      title: bug.title,
      description: bug.description,
      issue_type: bug.issue_type as any,
      priority: bug.priority as any,
      severity: bug.severity as any,
      assignee_id: req.user.id, // Assign to whoever clicked the button
      component_id: 'c1',
      version_id: 'v1',
    };

    const createdIssue = await IssueService.createIssue(simulatedIssueData as any, req.user.id);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: createdIssue,
      message: `Simulated random issue ${createdIssue.key} created`,
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

  /**
   * POST /api/v1/issues/quality-score
   */
  static async calculateQualityScore(req: Request, res: Response) {
    const { QualityScoreService } = await import('../services/qualityScoreService');
    const result = QualityScoreService.calculateScore(req.body);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Bug quality score calculated',
    });
  }

  /**
   * POST /api/v1/issues/suggest-assignee
   */
  static async suggestAssignee(req: Request, res: Response) {
    const { SmartAssignmentService } = await import('../services/smartAssignmentService');
    const result = await SmartAssignmentService.suggestAssignee(req.body);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Smart assignee suggestion computed',
    });
  }

  /**
   * POST /api/v1/issues/:id/mark-duplicate
   */
  static async markDuplicate(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized('Authentication required');
    const { duplicate_of_key } = req.body;
    if (!duplicate_of_key) {
      return res.status(400).json({ success: false, error: 'duplicate_of_key is required' });
    }

    const { DuplicateDetectionService } = await import('../services/duplicateDetectionService');
    const updated = await DuplicateDetectionService.markAsDuplicate(
      req.params.id,
      duplicate_of_key,
      req.user.id
    );

    return ApiResponse.success({
      res,
      data: updated,
      message: `Issue marked as duplicate of ${duplicate_of_key}`,
    });
  }
}
