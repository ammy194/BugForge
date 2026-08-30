import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAuth } from '../middleware/authMiddleware';

export const authRoutes = Router();

authRoutes.get('/personas', asyncHandler(AuthController.getDemoPersonas));
authRoutes.post('/sync-profile', requireAuth, asyncHandler(AuthController.syncProfile));
