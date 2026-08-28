import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { AnalyticsService } from '../services/analyticsService';
import { ProjectService } from '../services/projectService';

export class AnalyticsController {
  static async getOverview(req: Request, res: Response) {
    let projectId = req.query.project_id as string;
    if (!projectId) {
      const projects = await ProjectService.listProjects();
      if (projects.length === 0) throw AppError.notFound('No projects available');
      projectId = projects[0].id;
    }

    const data = await AnalyticsService.getProjectAnalytics(projectId);
    return ApiResponse.success({
      res,
      data,
      message: 'Analytics overview retrieved',
    });
  }

  static async exportCSV(req: Request, res: Response) {
    let projectId = req.query.project_id as string;
    if (!projectId) {
      const projects = await ProjectService.listProjects();
      if (projects.length === 0) throw AppError.notFound('No projects available');
      projectId = projects[0].id;
    }

    const csvData = await AnalyticsService.exportIssuesCSV(projectId);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="bugforge-issues-${Date.now()}.csv"`);
    return res.status(200).send(csvData);
  }

  static async exportJSON(req: Request, res: Response) {
    let projectId = req.query.project_id as string;
    if (!projectId) {
      const projects = await ProjectService.listProjects();
      if (projects.length === 0) throw AppError.notFound('No projects available');
      projectId = projects[0].id;
    }

    const jsonData = await AnalyticsService.exportIssuesJSON(projectId);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="bugforge-issues-${Date.now()}.json"`);
    return res.status(200).json(jsonData);
  }
}
