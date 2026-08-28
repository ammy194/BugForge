import { Router } from 'express';
import { ReleaseController } from '../controllers/releaseController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const releaseRoutes = Router();

releaseRoutes.use(requireAuth);

releaseRoutes.get('/health', asyncHandler(ReleaseController.getHealth));
