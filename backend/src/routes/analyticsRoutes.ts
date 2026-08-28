import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const analyticsRoutes = Router();

analyticsRoutes.use(requireAuth);

analyticsRoutes.get('/overview', asyncHandler(AnalyticsController.getOverview));
analyticsRoutes.get('/export/csv', asyncHandler(AnalyticsController.exportCSV));
analyticsRoutes.get('/export/json', asyncHandler(AnalyticsController.exportJSON));
