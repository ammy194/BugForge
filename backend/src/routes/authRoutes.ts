import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const authRoutes = Router();

authRoutes.get('/personas', asyncHandler(AuthController.getDemoPersonas));

// SECURITY: requires a verified session. The authenticated identity (never
// a client-supplied user_id) determines whose profile is touched.
authRoutes.post('/sync-profile', requireAuth, asyncHandler(AuthController.syncProfile));
