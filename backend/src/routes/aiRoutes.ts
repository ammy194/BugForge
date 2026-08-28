import { Router } from 'express';
import { AIController } from '../controllers/aiController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const aiRoutes = Router();

aiRoutes.use(requireAuth);

aiRoutes.post('/duplicates', asyncHandler(AIController.detectDuplicates));
aiRoutes.post('/extract', asyncHandler(AIController.extractBugFields));
aiRoutes.post('/root-cause', asyncHandler(AIController.analyzeRootCause));
aiRoutes.post('/classify', asyncHandler(AIController.classifySeverity));
aiRoutes.post('/nl-query', asyncHandler(AIController.parseNaturalLanguageQuery));
