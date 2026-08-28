import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { GitIntegrationService } from '../services/gitIntegrationService';
import { CIIntegrationService } from '../services/ciIntegrationService';
import { WebhookDispatcherService } from '../services/webhookDispatcherService';
import {
  githubPushWebhookSchema,
  githubPRWebhookSchema,
  ciFailureWebhookSchema,
  createWebhookSchema,
} from '../validators/integrationValidators';

export class IntegrationController {
  // Inbound GitHub Push Webhook
  static async handleGitHubPush(req: Request, res: Response) {
    const validated = githubPushWebhookSchema.parse(req.body);
    const results = await GitIntegrationService.processCommits(validated.commits);

    return ApiResponse.success({
      res,
      data: results,
      message: `Processed ${validated.commits.length} GitHub commits`,
    });
  }

  // Inbound GitHub Pull Request Webhook
  static async handleGitHubPR(req: Request, res: Response) {
    const validated = githubPRWebhookSchema.parse(req.body);
    const result = await GitIntegrationService.processPullRequest({
      action: validated.action,
      number: validated.number,
      title: validated.pull_request.title,
      url: validated.pull_request.html_url,
      body: validated.pull_request.body,
      author: validated.pull_request.user.login,
      merged: Boolean(validated.pull_request.merged),
    });

    return ApiResponse.success({
      res,
      data: result,
      message: `Processed GitHub PR #${validated.number}`,
    });
  }

  // Branch Name Helper
  static async getBranchSuggestion(req: Request, res: Response) {
    const result = await GitIntegrationService.generateBranchSuggestion(req.params.issueId);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Branch suggestion generated',
    });
  }

  // Inbound CI Failure Ingestion
  static async handleCIFailure(req: Request, res: Response) {
    const validated = ciFailureWebhookSchema.parse(req.body);
    const newIssue = await CIIntegrationService.handleCIFailure(validated);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: newIssue,
      message: `Automated CI failure defect ticket created: ${newIssue.key}`,
    });
  }

  // List CI Failures for Project
  static async listCIFailures(req: Request, res: Response) {
    const projectId = req.query.project_id as string | undefined;
    const status = req.query.status as any;
    const list = await CIIntegrationService.listFailures(projectId, status);

    return ApiResponse.success({
      res,
      data: list,
      message: 'CI failures retrieved',
    });
  }

  // Ingest CI Failure Record
  static async recordCIFailure(req: Request, res: Response) {
    const record = await CIIntegrationService.ingestFailure(req.body);
    return ApiResponse.success({
      res,
      statusCode: 201,
      data: record,
      message: 'CI failure recorded',
    });
  }

  // 1-Click "Create Issue from Failure"
  static async createIssueFromCIFailure(req: Request, res: Response) {
    const failureId = req.params.id;
    const actorUserId = req.user?.id;
    const result = await CIIntegrationService.createIssueFromFailure(failureId, actorUserId as string);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: result,
      message: `Defect ticket ${result.issue.key} created from CI test failure`,
    });
  }

  // Outbound Webhooks
  static async getWebhooks(req: Request, res: Response) {
    const projectId = req.query.project_id as string | undefined;
    const list = await WebhookDispatcherService.getWebhooks(projectId);
    return ApiResponse.success({
      res,
      data: list,
      message: 'Webhooks retrieved',
    });
  }

  static async createWebhook(req: Request, res: Response) {
    const validated = createWebhookSchema.parse(req.body);
    const created = await WebhookDispatcherService.createWebhook(validated as any);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: created,
      message: 'Outbound webhook created',
    });
  }

  static async deleteWebhook(req: Request, res: Response) {
    await WebhookDispatcherService.deleteWebhook(req.params.id);
    return ApiResponse.success({
      res,
      message: 'Webhook deleted',
    });
  }
}
