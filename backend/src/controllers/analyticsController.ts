import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { AnalyticsService } from '../services/analyticsService';
import { ProjectService } from '../services/projectService';
import { assertProjectAccess } from '../utils/projectAccess';

async function resolveProjectId(req: Request): Promise<string> {
  if (!req.user) throw AppError.unauthorized();

  let projectId = req.query.project_id as string;
  if (projectId) {
    await assertProjectAccess(req.user, projectId);
    return projectId;
  }

  // No explicit project requested: default to the first project this user
  // can actually access (never an arbitrary project across the whole
  // platform -- Requirement 4).
  const isGlobalAdmin = req.user.global_role === 'ADMIN';
  const projects = await ProjectService.listProjects(req.user.id, isGlobalAdmin, !!req.user.is_demo);
  if (projects.length === 0) throw AppError.notFound('No accessible projects available');
  return projects[0].id;
}

export class AnalyticsController {
  static async getOverview(req: Request, res: Response) {
    const projectId = await resolveProjectId(req);
    const data = await AnalyticsService.getProjectAnalytics(projectId);
    return ApiResponse.success({
      res,
      data,
      message: 'Analytics overview retrieved',
    });
  }

  static async exportCSV(req: Request, res: Response) {
    const projectId = await resolveProjectId(req);
    const csvData = await AnalyticsService.exportIssuesCSV(projectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bugforge-issues-${Date.now()}.csv"`);
    return res.status(200).send(csvData);
  }

  static async exportJSON(req: Request, res: Response) {
    const projectId = await resolveProjectId(req);
    const jsonData = await AnalyticsService.exportIssuesJSON(projectId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bugforge-issues-${Date.now()}.json"`);
    return res.status(200).json(jsonData);
  }
}
