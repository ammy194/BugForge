import { Router } from 'express';
import { IssueController } from '../controllers/issueController';
import { CollaborationController } from '../controllers/collaborationController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const issueRoutes = Router();

// All issue routes require authentication
issueRoutes.use(requireAuth);

// Core Issue CRUD
issueRoutes.get('/', asyncHandler(IssueController.listIssues));
issueRoutes.post('/', asyncHandler(IssueController.createIssue));
issueRoutes.get('/:id', asyncHandler(IssueController.getIssue));
issueRoutes.patch('/:id', asyncHandler(IssueController.updateAttributes));

// Workflow Engine
issueRoutes.get('/:id/transitions', asyncHandler(IssueController.getTransitions));
issueRoutes.post('/:id/transition', asyncHandler(IssueController.transitionStatus));
issueRoutes.get('/:id/history', asyncHandler(IssueController.getIssueHistory));

// Unified Activity Timeline
issueRoutes.get('/:id/timeline', asyncHandler(CollaborationController.getTimeline));

// Comments
issueRoutes.get('/:id/comments', asyncHandler(CollaborationController.getComments));
issueRoutes.post('/:id/comments', asyncHandler(CollaborationController.createComment));
issueRoutes.patch('/:id/comments/:commentId', asyncHandler(CollaborationController.updateComment));
issueRoutes.delete('/:id/comments/:commentId', asyncHandler(CollaborationController.deleteComment));

// Quality Score & Smart Assignment
issueRoutes.post('/quality-score', asyncHandler(IssueController.calculateQualityScore));
issueRoutes.post('/suggest-assignee', asyncHandler(IssueController.suggestAssignee));
issueRoutes.post('/:id/mark-duplicate', asyncHandler(IssueController.markDuplicate));

// Git & Development Links
issueRoutes.get('/:id/git-links', asyncHandler(CollaborationController.getGitLinks));
issueRoutes.post('/:id/git-links', asyncHandler(CollaborationController.addGitLink));
