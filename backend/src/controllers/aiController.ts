import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { AIService } from '../services/aiService';

export class AIController {
  static async detectDuplicates(req: Request, res: Response) {
    const { project_id, title, description } = req.body;
    if (!project_id || !title) {
      throw AppError.badRequest('project_id and title are required');
    }

    const result = await AIService.detectDuplicates(project_id, title, description);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Duplicate detection completed',
    });
  }

  static async extractBugFields(req: Request, res: Response) {
    const { raw_text } = req.body;
    if (!raw_text) throw AppError.badRequest('raw_text is required');

    const result = await AIService.extractBugFields(raw_text);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Bug fields extracted from raw input',
    });
  }

  static async analyzeRootCause(req: Request, res: Response) {
    const { title, description, stack_trace } = req.body;
    if (!title) throw AppError.badRequest('title is required');

    const result = await AIService.analyzeRootCause(title, description || '', stack_trace);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Root cause analysis and patch generated',
    });
  }

  static async classifySeverity(req: Request, res: Response) {
    const { title, description } = req.body;
    if (!title) throw AppError.badRequest('title is required');

    const result = await AIService.classifySeverity(title, description || '');
    return ApiResponse.success({
      res,
      data: result,
      message: 'Severity classification completed',
    });
  }

  static async parseNaturalLanguageQuery(req: Request, res: Response) {
    const { query } = req.body;
    if (!query) throw AppError.badRequest('query is required');

    const result = await AIService.parseNaturalLanguageQuery(query);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Query parsed into structured filters',
    });
  }
}
