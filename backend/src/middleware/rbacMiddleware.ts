import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ProjectRole } from '../types/project';
import { ProjectService } from '../services/projectService';

const ROLE_RANKS: Record<ProjectRole, number> = {
  ADMIN: 4,
  PROJECT_MANAGER: 3,
  DEVELOPER: 2,
  REPORTER: 1,
};

export const requireProjectRole = (minimumRole: ProjectRole) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(AppError.unauthorized('Authentication required'));
      }

      // Global ADMIN bypasses project checks (Only the exact Demo Admin UUID)
      if (req.user.id === '11111111-1111-4111-a111-111111111111') {
        return next();
      }

      const projectId = req.params.id || req.params.projectId || req.body.project_id;
      if (!projectId) {
        return next(AppError.badRequest('Project ID is required for permission check'));
      }

      const member = await ProjectService.getMember(projectId, req.user.id);
      if (!member) {
        return next(AppError.forbidden(`Access denied: You are not a member of project ${projectId}`));
      }

      const userRank = ROLE_RANKS[member.role] || 0;
      const requiredRank = ROLE_RANKS[minimumRole];

      if (userRank < requiredRank) {
        return next(
          AppError.forbidden(
            `Insufficient project permissions: Requires [${minimumRole}], but your project role is [${member.role}]`
          )
        );
      }

      next();
    } catch (err: any) {
      next(err);
    }
  };
};
