import { TimelineEvent } from '../types/collaboration';
import { IssueService } from './issueService';
import { CommentService } from './commentService';
import { GitService } from './gitService';
import { AppError } from '../utils/appError';

export class TimelineService {
  /**
   * Unify issue history, comments, and development links into a single chronological activity stream
   */
  static async getUnifiedTimeline(issueIdentifier: string): Promise<TimelineEvent[]> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) throw AppError.notFound(`Issue '${issueIdentifier}' not found`);

    const [history, comments, gitLinks] = await Promise.all([
      IssueService.getIssueHistory(issue.id),
      CommentService.getComments(issue.id),
      GitService.getGitLinks(issue.id),
    ]);

    const events: TimelineEvent[] = [];

    // 1. History Events
    history.forEach((h) => {
      let type: TimelineEvent['type'] = 'FIELD_CHANGE';
      let title = `Updated ${h.field_name}`;

      if (h.field_name === 'CREATED') {
        type = 'CREATED';
        title = `Created issue ${issue.key}`;
      } else if (h.field_name === 'status') {
        type = 'STATUS_CHANGE';
        title = `Status changed to ${h.new_value}`;
      } else if (h.field_name === 'assignee_id') {
        type = 'ASSIGNMENT_CHANGE';
        title = `Assigned to ${h.new_value}`;
      } else if (h.field_name === 'priority') {
        type = 'PRIORITY_CHANGE';
        title = `Priority changed: ${h.old_value} → ${h.new_value}`;
      }

      events.push({
        id: h.id,
        issue_id: issue.id,
        type,
        title,
        old_value: h.old_value,
        new_value: h.new_value,
        actor: h.actor,
        created_at: h.created_at,
      });
    });

    // 2. Comments
    comments.forEach((c) => {
      events.push({
        id: c.id,
        issue_id: issue.id,
        type: 'COMMENT',
        title: 'Added a comment',
        description: c.content,
        actor: c.author,
        created_at: c.created_at,
      });
    });

    // 3. Git Links
    gitLinks.forEach((g) => {
      events.push({
        id: g.id,
        issue_id: issue.id,
        type: 'GIT_LINK',
        title: `Linked ${g.link_type}: ${g.title}`,
        created_at: g.created_at,
        metadata: {
          link_type: g.link_type,
          url: g.url,
          author: g.author,
          status: g.status,
          external_id: g.external_id,
        },
      });
    });

    // Sort chronologically ascending
    return events.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }
}
