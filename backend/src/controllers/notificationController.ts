import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { NotificationService } from '../services/notificationService';

export class NotificationController {
  static async getMyNotifications(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const notifs = await NotificationService.getUserNotifications(req.user.id);
    const unreadCount = notifs.filter((n) => !n.read).length;

    return ApiResponse.success({
      res,
      data: notifs,
      meta: { unreadCount, total: notifs.length },
      message: 'Notifications retrieved',
    });
  }

  static async markAsRead(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const notif = await NotificationService.markAsRead(req.params.id, req.user.id);
    if (!notif) throw AppError.notFound('Notification not found');

    return ApiResponse.success({
      res,
      data: notif,
      message: 'Notification marked as read',
    });
  }

  static async markAllAsRead(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    await NotificationService.markAllAsRead(req.user.id);
    return ApiResponse.success({
      res,
      message: 'All notifications marked as read',
    });
  }
}
