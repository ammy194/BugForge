import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const userRoutes = Router();

// Protected user routes
userRoutes.get('/me', requireAuth, asyncHandler(UserController.getMe));
userRoutes.patch('/me', requireAuth, asyncHandler(UserController.updateMe));
userRoutes.get('/', requireAuth, asyncHandler(UserController.listUsers));
