import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { optionalAuth, requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const aiRoutes = Router();

aiRoutes.post('/triage', optionalAuth, asyncHandler(AIController.triage));
aiRoutes.post('/duplicates', optionalAuth, asyncHandler(AIController.detectDuplicates));
aiRoutes.post('/extract', optionalAuth, asyncHandler(AIController.extractFromLog));
aiRoutes.post('/root-cause', optionalAuth, asyncHandler(AIController.analyzeRootCause));
aiRoutes.post('/nl-query', optionalAuth, asyncHandler(AIController.parseNaturalLanguageQuery));
