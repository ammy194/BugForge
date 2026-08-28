import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const githubRoutes = Router();

// Inbound GitHub webhooks don't require user session auth (can verify HMAC secret)
githubRoutes.post('/webhook', asyncHandler(IntegrationController.handleGitHubPush));
githubRoutes.post('/webhook/pr', asyncHandler(IntegrationController.handleGitHubPR));

// Branch name helper requires authentication
githubRoutes.get('/branch/:issueId', requireAuth, asyncHandler(IntegrationController.getBranchSuggestion));
