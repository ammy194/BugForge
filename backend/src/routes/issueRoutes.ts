import { Router } from 'express';
import { IssueController } from '../controllers/issueController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const issueRoutes = Router();

// All issue routes require authentication
issueRoutes.use(requireAuth);

issueRoutes.get('/', asyncHandler(IssueController.listIssues));
issueRoutes.post('/', asyncHandler(IssueController.createIssue));
issueRoutes.get('/:id', asyncHandler(IssueController.getIssue));
issueRoutes.get('/:id/history', asyncHandler(IssueController.getIssueHistory));
