import { CIProvider } from './ciProvider';
import { CIProviderType, NormalizedCIFailure } from '../../types/ci';
import { CreateIssueDto } from '../../types/issue';

export class GitHubActionsProvider implements CIProvider {
  type: CIProviderType = 'github_actions';
  displayName = 'GitHub Actions CI';

  normalize(raw: any): NormalizedCIFailure {
    return {
      provider: 'github_actions',
      project_key: raw.project_key || 'ECOM',
      test_suite: raw.test_suite || raw.test_name?.split('.')[0] || 'AutomatedTestSuite',
      test_name: raw.test_name || 'IntegrationTest',
      error_message: raw.error_message || 'Automated test assertion failed',
      stack_trace: raw.stack_trace,
      expected_result: raw.expected_result || raw.expected || 'HTTP 200 OK / Assertion Success',
      actual_result: raw.actual_result || raw.actual || raw.error_message,
      build_id: raw.build_id || `gha-run-${Date.now()}`,
      build_url: raw.build_url || 'https://github.com/ammy194/BugForge/actions',
      branch: raw.branch || 'main',
      commit_sha: raw.commit_sha || '0000000000000000000000000000000000000000',
      commit_author: raw.commit_author || 'github-actions[bot]',
      environment: raw.environment || 'Node 22 / Ubuntu 24.04 runner',
    };
  }

  formatIssueDraft(failure: NormalizedCIFailure, projectId: string): CreateIssueDto {
    const shortSha = failure.commit_sha.substring(0, 7);
    const title = `[CI/CD] ${failure.test_name} failed on ${failure.branch}`;

    const description = [
      `### 🚨 Automated CI Pipeline Defect`,
      `The automated test suite encountered a failure during continuous integration.`,
      ``,
      `**Source:** ${this.displayName}`,
      `**Failed Test:** \`${failure.test_name}\` (Suite: \`${failure.test_suite}\`)`,
      `**Commit:** \`${shortSha}\` (by ${failure.commit_author || 'CI Runner'})`,
      `**Branch:** \`${failure.branch}\``,
      `**Environment:** \`${failure.environment || 'CI Runner'}\``,
      ``,
      `**Error Summary:**`,
      `\`\`\``,
      failure.error_message,
      `\`\`\``,
    ].join('\n');

    const reproSteps = [
      `1. Check out git branch \`${failure.branch}\` at commit \`${shortSha}\``,
      `2. Execute test command: \`npm test -- -t "${failure.test_name}"\``,
      `3. Inspect CI failure build logs: ${failure.build_url}`,
    ].join('\n');

    return {
      project_id: projectId,
      title,
      description,
      issue_type: 'BUG',
      priority: 'P0_CRITICAL',
      severity: 'CRITICAL',
      environment: failure.environment || `CI Pipeline (${failure.branch})`,
      repro_steps: reproSteps,
      expected_behavior: failure.expected_result || 'Test assertion passes cleanly.',
      actual_behavior: failure.actual_result || failure.error_message,
      labels: ['ci-failure', 'automated-test', 'github-actions'],
    };
  }
}
