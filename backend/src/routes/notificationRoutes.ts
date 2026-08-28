import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const notificationRoutes = Router();

notificationRoutes.use(requireAuth);

notificationRoutes.get('/', asyncHandler(NotificationController.getMyNotifications));
notificationRoutes.patch('/:id/read', asyncHandler(NotificationController.markAsRead));
notificationRoutes.post('/mark-all-read', asyncHandler(NotificationController.markAllAsRead));
