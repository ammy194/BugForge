import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const webhookRoutes = Router();

webhookRoutes.use(requireAuth);

webhookRoutes.get('/', asyncHandler(IntegrationController.getWebhooks));
webhookRoutes.post('/', asyncHandler(IntegrationController.createWebhook));
webhookRoutes.delete('/:id', asyncHandler(IntegrationController.deleteWebhook));
