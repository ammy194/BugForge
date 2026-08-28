import { Router } from 'express';
import { IntegrationController } from '../controllers/integrationController';
import { asyncHandler } from '../utils/asyncHandler';

export const ciRoutes = Router();

// Inbound CI test failure receiver
ciRoutes.post('/webhook', asyncHandler(IntegrationController.handleCIFailure));
