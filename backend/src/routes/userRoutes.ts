import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { requireAuth } from '../middleware/authMiddleware';

export const userRoutes = Router();

// Protected user routes
userRoutes.get('/me', requireAuth, UserController.getMe);
userRoutes.patch('/me', requireAuth, UserController.updateMe);
userRoutes.get('/', requireAuth, UserController.listUsers);
