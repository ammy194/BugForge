import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { asyncHandler } from '../utils/asyncHandler';

export const authRoutes = Router();

authRoutes.post('/sync-profile', asyncHandler(AuthController.syncProfile));
authRoutes.get('/personas', asyncHandler(AuthController.getDemoPersonas));
