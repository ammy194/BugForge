import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const ciRoutes = Router();

// Inbound CI test failure webhook receiver (runners can call directly)
ciRoutes.post('/webhook', asyncHandler(IntegrationController.handleCIFailure));

// List and record failures
ciRoutes.get('/failures', optionalAuth, asyncHandler(IntegrationController.listCIFailures));
ciRoutes.post('/failures', asyncHandler(IntegrationController.recordCIFailure));

// 1-Click "Create Issue from Failure" action
ciRoutes.post('/failures/:id/create-issue', requireAuth, asyncHandler(IntegrationController.createIssueFromCIFailure));
