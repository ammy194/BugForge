import { CIFailurePayload } from '../types/integration';
import { IssueService } from './issueService';
import { GitService } from './gitService';
import { ProjectService } from './projectService';
import { DEMO_PERSONAS } from './userService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

export class CIIntegrationService {
  /**
   * Automatically ingest CI test/build failures and create high-priority bug tickets
   */
  static async handleCIFailure(payload: CIFailurePayload) {
    const project = await ProjectService.getProject(payload.project_key);
    if (!project) throw AppError.notFound(`Project key '${payload.project_key}' not found`);

    const title = `[CI/CD Failure] ${payload.test_name} failed on ${payload.branch}`;
    const description = `Automated CI Pipeline build failed on branch \`${payload.branch}\` at commit \`${payload.commit_sha.substring(0, 7)}\`.\n\n**Error:**\n\`\`\`\n${payload.error_message}\n\`\`\``;
    const reproSteps = `1. Check out branch \`${payload.branch}\` at \`${payload.commit_sha}\`\n2. Run automated test suite: \`${payload.test_name}\`\n3. CI Build Logs: ${payload.build_url}`;

    // Auto-file Defect Ticket
    const newIssue = await IssueService.createIssue(
      {
        project_id: project.id,
        title,
        description,
        issue_type: 'BUG',
        priority: 'P0_CRITICAL',
        severity: 'BLOCKER',
        environment: `CI Pipeline / Branch: ${payload.branch}`,
        repro_steps: reproSteps,
        expected_behavior: 'All test assertions pass cleanly in CI runner container.',
        actual_behavior: payload.error_message,
        labels: ['ci-failure', 'automated', 'regression'],
      },
      DEMO_PERSONAS.admin.id
    );

    // Attach CI Run Git Link
    await GitService.addGitLink(newIssue.id, {
      link_type: 'CI_RUN',
      external_id: payload.build_id,
      title: `CI Build ${payload.build_id}: ${payload.test_name}`,
      url: payload.build_url,
      author: payload.commit_author || 'GitHub Actions',
      status: 'FAILED',
      metadata: {
        commit_sha: payload.commit_sha,
        branch: payload.branch,
      },
    });

    // Attach Commit Git Link
    await GitService.addGitLink(newIssue.id, {
      link_type: 'COMMIT',
      external_id: payload.commit_sha.substring(0, 7),
      title: `Commit ${payload.commit_sha.substring(0, 7)} on ${payload.branch}`,
      url: `https://github.com/ammy194/BugForge/commit/${payload.commit_sha}`,
      author: payload.commit_author || 'CI Bot',
      status: 'COMMITTED',
    });

    logger.info(`🚨 Created automated CI failure issue ${newIssue.key} for ${payload.test_name}`);

    return newIssue;
  }
}
