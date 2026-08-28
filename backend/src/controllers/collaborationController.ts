import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { CommentService } from '../services/commentService';
import { GitService } from '../services/gitService';
import { TimelineService } from '../services/timelineService';
import {
  createCommentSchema,
  updateCommentSchema,
  createGitLinkSchema,
} from '../validators/collaborationValidators';

export class CollaborationController {
  // Comments
  static async createComment(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = createCommentSchema.parse(req.body);
    const comment = await CommentService.createComment(req.params.id, validated.content, req.user.id);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: comment,
      message: 'Comment posted successfully',
    });
  }

  static async getComments(req: Request, res: Response) {
    const comments = await CommentService.getComments(req.params.id);
    return ApiResponse.success({
      res,
      data: comments,
      message: 'Comments retrieved',
    });
  }

  static async updateComment(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = updateCommentSchema.parse(req.body);
    const updated = await CommentService.updateComment(req.params.commentId, validated.content, req.user.id);

    return ApiResponse.success({
      res,
      data: updated,
      message: 'Comment updated',
    });
  }

  static async deleteComment(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    await CommentService.deleteComment(req.params.commentId, req.user.id);
    return ApiResponse.success({
      res,
      message: 'Comment deleted',
    });
  }

  // Unified Activity Timeline
  static async getTimeline(req: Request, res: Response) {
    const timeline = await TimelineService.getUnifiedTimeline(req.params.id);
    return ApiResponse.success({
      res,
      data: timeline,
      message: 'Activity timeline retrieved',
    });
  }

  // Git Links
  static async getGitLinks(req: Request, res: Response) {
    const links = await GitService.getGitLinks(req.params.id);
    return ApiResponse.success({
      res,
      data: links,
      message: 'Git links retrieved',
    });
  }

  static async addGitLink(req: Request, res: Response) {
    const validated = createGitLinkSchema.parse(req.body);
    const link = await GitService.addGitLink(req.params.id, validated as any);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: link,
      message: 'Git link attached',
    });
  }
}
