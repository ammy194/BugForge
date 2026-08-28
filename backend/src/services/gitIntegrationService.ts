import { IssueService } from './issueService';
import { GitService } from './gitService';
import { CommentService } from './commentService';
import { DEMO_PERSONAS } from './userService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class GitIntegrationService {
  /**
   * Process incoming GitHub Push webhook commits:
   * Parses "Fixes KEY-123" or "Refs KEY-123"
   */
  static async processCommits(commits: Array<{
    id: string;
    message: string;
    url: string;
    author: { name: string; email: string };
  }>) {
    const results: Array<{ commit_id: string; linked_issues: string[]; auto_resolved: string[] }> = [];

    for (const commit of commits) {
      const linkedKeys: string[] = [];
      const resolvedKeys: string[] = [];

      // Regex matching Fixes/Closes/Refs ECOM-1042
      const regex = /\b(fixes|closes|resolves|refs)\s+([A-Z]{2,10}-\d+)\b/gi;
      let match;

      while ((match = regex.exec(commit.message)) !== null) {
        const action = match[1].toLowerCase();
        const issueKey = match[2].toUpperCase();

        const issue = await IssueService.getIssue(issueKey);
        if (issue) {
          linkedKeys.push(issueKey);

          // 1. Attach Commit Git Link
          await GitService.addGitLink(issue.id, {
            link_type: 'COMMIT',
            external_id: commit.id.substring(0, 7),
            title: commit.message.split('\n')[0],
            url: commit.url,
            author: commit.author.name,
            status: 'COMMITTED',
          });

          // 2. Add automated comment
          await CommentService.createComment(
            issue.id,
            `🔗 **GitHub Commit Linked:** [\`${commit.id.substring(0, 7)}\`](${commit.url}) - ${commit.message.split('\n')[0]} (by ${commit.author.name})`,
            DEMO_PERSONAS.admin.id
          );

          // 3. Auto-transition to RESOLVED if "Fixes", "Closes", or "Resolves"
          if (['fixes', 'closes', 'resolves'].includes(action) && issue.status !== 'RESOLVED' && issue.status !== 'CLOSED') {
            try {
              await IssueService.transitionStatus(
                issue.id,
                'RESOLVED',
                {
                  resolution: 'FIXED',
                  comment: `Auto-resolved via GitHub commit ${commit.id.substring(0, 7)}: "${commit.message.split('\n')[0]}"`,
                },
                DEMO_PERSONAS.admin.id
              );
              resolvedKeys.push(issueKey);
              logger.info(`⚡ Auto-resolved ${issueKey} via GitHub commit ${commit.id.substring(0, 7)}`);
            } catch (err: any) {
              logger.warn(`Could not auto-resolve ${issueKey}: ${err.message}`);
            }
          }
        }
      }

      results.push({
        commit_id: commit.id,
        linked_issues: linkedKeys,
        auto_resolved: resolvedKeys,
      });
    }

    return results;
  }

  /**
   * Process incoming Pull Request webhook
   */
  static async processPullRequest(pr: {
    action: string;
    number: number;
    title: string;
    url: string;
    body?: string | null;
    author: string;
    merged: boolean;
  }) {
    const fullText = `${pr.title} ${pr.body || ''}`;
    const regex = /\b(fixes|closes|resolves|refs)\s+([A-Z]{2,10}-\d+)\b/gi;
    const linkedKeys: string[] = [];

    let match;
    while ((match = regex.exec(fullText)) !== null) {
      const action = match[1].toLowerCase();
      const issueKey = match[2].toUpperCase();

      const issue = await IssueService.getIssue(issueKey);
      if (issue) {
        linkedKeys.push(issueKey);

        await GitService.addGitLink(issue.id, {
          link_type: 'PR',
          external_id: `#${pr.number}`,
          title: `PR #${pr.number}: ${pr.title}`,
          url: pr.url,
          author: pr.author,
          status: pr.merged ? 'MERGED' : pr.action.toUpperCase(),
        });

        // If PR merged with "Fixes", auto-resolve
        if (pr.merged && ['fixes', 'closes', 'resolves'].includes(action) && issue.status !== 'RESOLVED') {
          await IssueService.transitionStatus(
            issue.id,
            'RESOLVED',
            {
              resolution: 'FIXED',
              comment: `Auto-resolved on GitHub Pull Request #${pr.number} merge`,
            },
            DEMO_PERSONAS.admin.id
          );
        } else if (pr.action === 'opened' && issue.status === 'IN_PROGRESS') {
          // Transition to IN_REVIEW when PR opens
          await IssueService.transitionStatus(
            issue.id,
            'IN_REVIEW',
            {
              comment: `PR #${pr.number} submitted for review by ${pr.author}`,
            },
            DEMO_PERSONAS.admin.id
          );
        }
      }
    }

    return { pr_number: pr.number, linked_issues: linkedKeys };
  }

  /**
   * Generate standardized branch naming suggestion
   */
  static async generateBranchSuggestion(issueIdentifier: string): Promise<{ branch_name: string; checkout_command: string }> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) throw AppError.notFound(`Issue '${issueIdentifier}' not found`);

    const cleanSlug = issue.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 45);

    const prefix = issue.issue_type === 'BUG' ? 'fix' : issue.issue_type === 'FEATURE' ? 'feat' : 'task';
    const branchName = `${prefix}/${issue.key}-${cleanSlug}`;

    return {
      branch_name: branchName,
      checkout_command: `git checkout -b ${branchName}`,
    };
  }
}
