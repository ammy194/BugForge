import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AIService } from '../services/aiService';

export class AIController {
  static async triage(req: Request, res: Response) {
    const { title, description, project_id } = req.body;
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required for triage' });
    }

    const result = await AIService.triageIssueDraft({
      title,
      description: description || '',
      project_id,
    });

    return ApiResponse.success({
      res,
      data: result,
      message: 'AI triage suggestions computed',
    });
  }

  static async detectDuplicates(req: Request, res: Response) {
    const { project_id, title, description } = req.body;
    const result = await AIService.detectDuplicates({ project_id, title, description });
    return ApiResponse.success({
      res,
      data: result,
      message: 'Duplicate candidate search completed',
    });
  }

  static async extractFromLog(req: Request, res: Response) {
    const { raw_text } = req.body;
    const result = await AIService.extractBugFields(raw_text);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Bug fields extracted from log',
    });
  }

  static async analyzeRootCause(req: Request, res: Response) {
    const { title, description, stack_trace } = req.body;
    const result = await AIService.analyzeRootCause({ title, description, stack_trace });
    return ApiResponse.success({
      res,
      data: result,
      message: 'Root cause analysis generated',
    });
  }

  static async parseNaturalLanguageQuery(req: Request, res: Response) {
    const { query } = req.body;
    const result = await AIService.parseNaturalLanguageQuery(query);
    return ApiResponse.success({
      res,
      data: result,
      message: 'Natural language query parsed',
    });
  }
}
