import { Notification, NotificationType } from '../types/issue';
import { UserService } from './userService';

const notificationsStore = new Map<string, Notification>();

export class NotificationService {
  /**
   * Dispatch an in-app notification
   */
  static async createNotification(data: {
    user_id: string;
    actor_id?: string | null;
    issue_id?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    issue_key?: string;
  }): Promise<Notification> {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const actor = data.actor_id ? await UserService.getProfileById(data.actor_id) : null;

    const notification: Notification = {
      id,
      user_id: data.user_id,
      actor_id: data.actor_id || undefined,
      issue_id: data.issue_id || undefined,
      type: data.type,
      title: data.title,
      message: data.message,
      read: false,
      created_at: new Date().toISOString(),
      actor: actor || undefined,
      issue_key: data.issue_key,
    };

    notificationsStore.set(id, notification);
    return notification;
  }

  /**
   * List all notifications for a specific user
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    return Array.from(notificationsStore.values())
      .filter((n) => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<Notification | null> {
    const notif = notificationsStore.get(notificationId);
    if (!notif || notif.user_id !== userId) return null;

    notif.read = true;
    return notif;
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<void> {
    for (const notif of notificationsStore.values()) {
      if (notif.user_id === userId) {
        notif.read = true;
      }
    }
  }
}
