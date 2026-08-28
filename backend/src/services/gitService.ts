import { GitLink, GitLinkType } from '../types/collaboration';
import { IssueService } from './issueService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const gitLinksStore = new Map<string, GitLink[]>();

// Initialize Seed Git Links for ECOM-1042
function initSeedGitLinks() {
  const ecom1042Id = 'issue-00000000-0000-0000-0000-000000001042';
  if (gitLinksStore.has(ecom1042Id)) return;

  const now = new Date();

  gitLinksStore.set(ecom1042Id, [
    {
      id: 'git-1',
      issue_id: ecom1042Id,
      link_type: 'BRANCH',
      external_id: 'fix/ecom-1042-expired-coupon-nullpointer',
      title: 'Branch: fix/ecom-1042-expired-coupon-nullpointer',
      url: 'https://github.com/ammy194/BugForge/tree/fix/ecom-1042-expired-coupon-nullpointer',
      author: 'bob.dev',
      status: 'ACTIVE',
      created_at: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'git-2',
      issue_id: ecom1042Id,
      link_type: 'COMMIT',
      external_id: 'a7b3c9d',
      title: 'fix(checkout): safely handle expired discount calculation and throw ExpiredCouponException',
      url: 'https://github.com/ammy194/BugForge/commit/a7b3c9d81f092',
      author: 'Bob Chen',
      status: 'COMMITTED',
      created_at: new Date(now.getTime() - 20 * 60 * 1000).toISOString(),
    },
    {
      id: 'git-3',
      issue_id: ecom1042Id,
      link_type: 'PR',
      external_id: '#382',
      title: 'PR #382: Fix nullpointer on expired promo discounts during checkout',
      url: 'https://github.com/ammy194/BugForge/pull/382',
      author: 'Bob Chen',
      status: 'OPEN',
      metadata: { additions: 34, deletions: 12, checksPassing: true },
      created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
    },
    {
      id: 'git-4',
      issue_id: ecom1042Id,
      link_type: 'CI_RUN',
      external_id: 'run-9824',
      title: 'GitHub Actions: CI / Test Suite #9824',
      url: 'https://github.com/ammy194/BugForge/actions/runs/9824',
      status: 'SUCCESS',
      metadata: { duration: '2m 14s', totalTests: 184, passed: 184 },
      created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
  ]);
}

initSeedGitLinks();

export class GitService {
  /**
   * Get all git links for an issue
   */
  static async getGitLinks(issueIdentifier: string): Promise<GitLink[]> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) return [];

    return gitLinksStore.get(issue.id) || [];
  }

  /**
   * Add a git link (commit, PR, branch, CI run)
   */
  static async addGitLink(
    issueIdentifier: string,
    data: {
      link_type: GitLinkType;
      external_id: string;
      title: string;
      url: string;
      author?: string;
      status?: string;
      metadata?: Record<string, any>;
    }
  ): Promise<GitLink> {
    const issue = await IssueService.getIssue(issueIdentifier);
    if (!issue) throw AppError.notFound(`Issue '${issueIdentifier}' not found`);

    const linkId = `git-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const gitLink: GitLink = {
      id: linkId,
      issue_id: issue.id,
      link_type: data.link_type,
      external_id: data.external_id,
      title: data.title,
      url: data.url,
      author: data.author,
      status: data.status,
      metadata: data.metadata,
      created_at: now,
    };

    const list = gitLinksStore.get(issue.id) || [];
    list.push(gitLink);
    gitLinksStore.set(issue.id, list);

    logger.info(`🔗 Linked ${data.link_type} (${data.external_id}) to ${issue.key}`);

    return gitLink;
  }
}
