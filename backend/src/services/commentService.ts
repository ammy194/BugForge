import { Comment } from '../types/collaboration';
import { UserService, DEMO_PERSONAS } from './userService';
import { NotificationService } from './notificationService';
import { IssueService } from './issueService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const commentsStore = new Map<string, Comment[]>();

// Initialize Seed Comments
function initSeedComments() {
  const ecom1042Id = 'issue-00000000-0000-0000-0000-000000001042';
  if (commentsStore.has(ecom1042Id)) return;

  const now = new Date();

  commentsStore.set(ecom1042Id, [
    {
      id: 'comm-1042-1',
      issue_id: ecom1042Id,
      author_id: DEMO_PERSONAS.reporter.id,
      content: 'Reproduced in staging and production. Happens consistently whenever the promo code validity timestamp is strictly less than `Date.now()`. Stack trace points to `CouponValidator.java:142`.',
      created_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 40 * 60 * 1000).toISOString(),
      author: DEMO_PERSONAS.reporter,
    },
    {
      id: 'comm-1042-2',
      issue_id: ecom1042Id,
      author_id: DEMO_PERSONAS.dev.id,
      content: 'Investigating now. The issue is that expired discounts return `null` instead of throwing `ExpiredCouponException`, so the pricing aggregator tries to access `.getPercentage()` on null.',
      created_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      author: DEMO_PERSONAS.dev,
    },
  ]);
}

initSeedComments();

export class CommentService {
  /**
   * Add a new comment to an issue with @mention parsing & notification dispatch
   */
  static async createComment(issueIdentifier: string, content: string, authorId: string): Promise<Comment> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) throw AppError.notFound(`Issue '${issueIdentifier}' not found`);

    const author = await UserService.getProfileById(authorId);
    if (!author) throw AppError.unauthorized('Comment author not found');

    const commentId = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const newComment: Comment = {
      id: commentId,
      issue_id: issue.id,
      author_id: authorId,
      content,
      created_at: now,
      updated_at: now,
      author,
    };

    const list = commentsStore.get(issue.id) || [];
    list.push(newComment);
    commentsStore.set(issue.id, list);

    // Parse @mentions (e.g., @Bob or @admin@bugforge.dev)
    const allUsers = await UserService.listUsers();
    const mentionedUsers = allUsers.filter((u) => {
      if (u.id === authorId) return false;
      const nameMatch = content.toLowerCase().includes(`@${u.full_name.toLowerCase()}`);
      const emailMatch = content.toLowerCase().includes(`@${u.email.toLowerCase()}`);
      const firstNameMatch = content.toLowerCase().includes(`@${u.full_name.split(' ')[0].toLowerCase()}`);
      return nameMatch || emailMatch || firstNameMatch;
    });

    for (const mentioned of mentionedUsers) {
      await NotificationService.createNotification({
        user_id: mentioned.id,
        actor_id: authorId,
        issue_id: issue.id,
        issue_key: issue.key,
        type: 'MENTIONED',
        title: `Mentioned in ${issue.key}`,
        message: `${author.full_name} mentioned you: "${content.substring(0, 80)}..."`,
      });
    }

    // Notify issue Assignee and Reporter if not already mentioned
    const notifyTargets = new Set<string>();
    if (issue.reporter_id && issue.reporter_id !== authorId) notifyTargets.add(issue.reporter_id);
    if (issue.assignee_id && issue.assignee_id !== authorId) notifyTargets.add(issue.assignee_id);
    mentionedUsers.forEach((m) => notifyTargets.delete(m.id));

    for (const targetUserId of notifyTargets) {
      await NotificationService.createNotification({
        user_id: targetUserId,
        actor_id: authorId,
        issue_id: issue.id,
        issue_key: issue.key,
        type: 'COMMENTED',
        title: `New Comment on ${issue.key}`,
        message: `${author.full_name}: "${content.substring(0, 80)}..."`,
      });
    }

    logger.info(`💬 Comment added to ${issue.key} by ${author.email}`);

    return newComment;
  }

  /**
   * Get all comments for an issue
   */
  static async getComments(issueIdentifier: string): Promise<Comment[]> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) return [];

    const list = commentsStore.get(issue.id) || [];
    return Promise.all(
      list.map(async (c) => ({
        ...c,
        author: c.author_id ? (await UserService.getProfileById(c.author_id)) || undefined : undefined,
      }))
    );
  }

  /**
   * Update existing comment
   */
  static async updateComment(commentId: string, content: string, actorId: string): Promise<Comment> {
    for (const [issueId, list] of commentsStore.entries()) {
      const comment = list.find((c) => c.id === commentId);
      if (comment) {
        const actor = await UserService.getProfileById(actorId);
        if (comment.author_id !== actorId && actor?.global_role !== 'ADMIN') {
          throw AppError.forbidden('You can only edit your own comments.');
        }

        comment.content = content;
        comment.updated_at = new Date().toISOString();
        return comment;
      }
    }
    throw AppError.notFound(`Comment '${commentId}' not found`);
  }

  /**
   * Delete comment
   */
  static async deleteComment(commentId: string, actorId: string): Promise<void> {
    for (const [issueId, list] of commentsStore.entries()) {
      const index = list.findIndex((c) => c.id === commentId);
      if (index !== -1) {
        const comment = list[index];
        const actor = await UserService.getProfileById(actorId);
        if (comment.author_id !== actorId && actor?.global_role !== 'ADMIN') {
          throw AppError.forbidden('You can only delete your own comments.');
        }

        list.splice(index, 1);
        commentsStore.set(issueId, list);
        return;
      }
    }
    throw AppError.notFound(`Comment '${commentId}' not found`);
  }
}
