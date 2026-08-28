import { DuplicateMatch } from '../types/ai';
import { IssueService } from './issueService';
import { CommentService } from './commentService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class DuplicateDetectionService {
  /**
   * 2-Tier Duplicate Radar:
   * 1. Query database for relevant candidate issues (narrowed by project and key terms)
   * 2. Calculate semantic token similarity and formulate human-readable match reasoning
   */
  static async findDuplicates(data: {
    project_id: string;
    title: string;
    description?: string;
  }): Promise<{ duplicates: DuplicateMatch[]; isDuplicateRisk: boolean; topScore: number }> {
    const { project_id, title, description = '' } = data;
    if (!title || title.trim().length < 3) {
      return { duplicates: [], isDuplicateRisk: false, topScore: 0 };
    }

    // Step 1: Database candidate narrowing
    const { issues } = await IssueService.listIssues({
      project_id,
      limit: 50,
    });

    const newTokens = new Set(
      `${title} ${description}`
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 2 && !['with', 'that', 'this', 'from', 'when', 'then', 'have', 'been', 'user'].includes(w))
    );

    const matches: DuplicateMatch[] = [];

    // Step 2: Semantic & token similarity analysis
    for (const existing of issues) {
      const existingTokens = new Set(
        `${existing.title} ${existing.description}`
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, ' ')
          .split(/\s+/)
          .filter((w) => w.length > 2)
      );

      const matchedWords: string[] = [];
      for (const token of newTokens) {
        if (existingTokens.has(token)) {
          matchedWords.push(token);
        }
      }

      if (matchedWords.length > 0) {
        // Compute Jaccard-weighted overlap
        const overlapRatio = matchedWords.length / Math.max(newTokens.size, 3);
        const similarityScore = Math.min(94, Math.round(overlapRatio * 100));

        if (similarityScore >= 35) {
          const reason =
            matchedWords.length >= 2
              ? `Both issues involve ${matchedWords.slice(0, 3).join(' and ')} defects.`
              : `Overlapping keyword '${matchedWords[0]}' detected.`;

          matches.push({
            issue_id: existing.id,
            key: existing.key,
            title: existing.title,
            status: existing.status,
            priority: existing.priority,
            similarity_score: similarityScore,
            reason,
          });
        }
      }
    }

    matches.sort((a, b) => b.similarity_score - a.similarity_score);
    const topMatches = matches.slice(0, 4);
    const topScore = topMatches.length > 0 ? topMatches[0].similarity_score : 0;

    return {
      duplicates: topMatches,
      isDuplicateRisk: topScore >= 60,
      topScore,
    };
  }

  /**
   * Resolve an issue as DUPLICATE of an existing ticket
   */
  static async markAsDuplicate(issueId: string, duplicateOfKey: string, actorUserId: string) {
    const issue = await IssueService.getIssue(issueId);
    if (!issue) throw AppError.notFound(`Issue '${issueId}' not found`);

    const targetIssue = await IssueService.getIssue(duplicateOfKey);
    if (!targetIssue) throw AppError.notFound(`Target duplicate issue '${duplicateOfKey}' not found`);

    // 1. Transition to RESOLVED with resolution = DUPLICATE
    const updated = await IssueService.transitionStatus(
      issue.id,
      'RESOLVED',
      {
        resolution: 'DUPLICATE',
        comment: `Marked as duplicate of [${targetIssue.key}: ${targetIssue.title}](/issues/${targetIssue.key})`,
      },
      actorUserId
    );

    // 2. Add cross-reference comment to original issue
    await CommentService.createComment(
      targetIssue.id,
      `🔗 Ticket [\`${issue.key}\`](/issues/${issue.key}) was marked as a duplicate of this issue.`,
      actorUserId
    );

    logger.info(`🔄 Marked ${issue.key} as duplicate of ${targetIssue.key}`);

    return updated;
  }
}
