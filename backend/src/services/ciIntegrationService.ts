import { CIFailurePayload } from '../types/integration';
import { CIFailureRecord, CIFailureStatus, CIProviderType } from '../types/ci';
import { ciRegistry } from './ci/ciProviderRegistry';
import { IssueService } from './issueService';
import { GitService } from './gitService';
import { ProjectService } from './projectService';
import { DEMO_PERSONAS } from './userService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

const ciFailuresStore = new Map<string, CIFailureRecord>();

// Seed initial realistic CI failures
function initSeedFailures() {
  if (ciFailuresStore.size > 0) return;

  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';
  const now = new Date().toISOString();

  const seed1: CIFailureRecord = {
    id: 'cif-1',
    project_id: ecomId,
    provider: 'github_actions',
    test_suite: 'CheckoutTest',
    test_name: 'CheckoutTest.testExpiredCoupon()',
    error_message: 'AssertionError: Expected HTTP 400 Bad Request but received HTTP 500 Internal Server Error (NullPointerException at CouponService:84)',
    stack_trace: 'at CouponService.validate (src/services/couponService.ts:84:14)\nat CheckoutController.applyCoupon (src/controllers/checkoutController.ts:52:9)',
    expected_result: 'HTTP 400 Bad Request (Error: "Coupon code has expired")',
    actual_result: 'HTTP 500 Internal Server Error (NullPointerException)',
    build_id: 'gha-run-84920',
    build_url: 'https://github.com/ammy194/BugForge/actions/runs/84920',
    branch: 'fix/coupon-validation',
    commit_sha: 'a82f91c0e3b5d719283746192837461928374619',
    commit_author: 'Bob Chen',
    environment: 'Node 22 / Ubuntu 24.04 runner',
    status: 'UNRESOLVED',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    updated_at: now,
  };

  const seed2: CIFailureRecord = {
    id: 'cif-2',
    project_id: ecomId,
    provider: 'github_actions',
    test_suite: 'PaymentGatewayTest',
    test_name: 'PaymentGatewayTest.testStripeWebhookSignatureMismatch()',
    error_message: 'AssertionError: Expected 401 Unauthorized but received 200 OK without signature check',
    stack_trace: 'at WebhookGuard.verify (src/security/webhookGuard.ts:42:11)',
    expected_result: 'HTTP 401 Unauthorized SignatureMismatch',
    actual_result: 'HTTP 200 OK (Unverified payload processed)',
    build_id: 'gha-run-84921',
    build_url: 'https://github.com/ammy194/BugForge/actions/runs/84921',
    branch: 'main',
    commit_sha: 'c4e9128abf103948572019283746192837461928',
    commit_author: 'Sarah Connor',
    environment: 'Node 22 / macOS 15 runner',
    status: 'UNRESOLVED',
    created_at: new Date(Date.now() - 7200000).toISOString(),
    updated_at: now,
  };

  ciFailuresStore.set('cif-1', seed1);
  ciFailuresStore.set('cif-2', seed2);
}

initSeedFailures();

export class CIIntegrationService {
  /**
   * Ingest and record a CI failure
   */
  static async ingestFailure(rawPayload: any): Promise<CIFailureRecord> {
    const provider = ciRegistry.get(rawPayload.provider || 'github_actions');
    const normalized = provider.normalize(rawPayload);

    const project = await ProjectService.getProject(normalized.project_key);
    if (!project) throw AppError.notFound(`Project key '${normalized.project_key}' not found`);

    const id = `cif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const failureRecord: CIFailureRecord = {
      id,
      project_id: project.id,
      provider: normalized.provider,
      test_suite: normalized.test_suite,
      test_name: normalized.test_name,
      error_message: normalized.error_message,
      stack_trace: normalized.stack_trace,
      expected_result: normalized.expected_result,
      actual_result: normalized.actual_result,
      build_id: normalized.build_id,
      build_url: normalized.build_url,
      branch: normalized.branch,
      commit_sha: normalized.commit_sha,
      commit_author: normalized.commit_author,
      environment: normalized.environment,
      status: 'UNRESOLVED',
      created_at: now,
      updated_at: now,
    };

    ciFailuresStore.set(id, failureRecord);
    logger.info(`🚨 [CI Ingest] Recorded failure ${id} for test ${normalized.test_name}`);

    return failureRecord;
  }

  /**
   * List CI failures with optional project and status filters
   */
  static async listFailures(projectId?: string, status?: CIFailureStatus): Promise<CIFailureRecord[]> {
    let list = Array.from(ciFailuresStore.values());
    if (projectId) {
      list = list.filter((f) => f.project_id === projectId);
    }
    if (status) {
      list = list.filter((f) => f.status === status);
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  /**
   * Get single CI failure record
   */
  static async getFailure(id: string): Promise<CIFailureRecord | null> {
    return ciFailuresStore.get(id) || null;
  }

  /**
   * 1-Click "Create Issue from Failure" action
   */
  static async createIssueFromFailure(failureId: string, actorUserId: string) {
    const failure = ciFailuresStore.get(failureId);
    if (!failure) throw AppError.notFound(`CI failure '${failureId}' not found`);

    if (failure.status === 'CONVERTED_TO_ISSUE' && failure.converted_issue_id) {
      const existing = await IssueService.getIssue(failure.converted_issue_id);
      if (existing) {
        return { issue: existing, failure, alreadyCreated: true };
      }
    }

    const provider = ciRegistry.get(failure.provider);
    const normalized = provider.normalize({ ...failure });
    const issueDraft = provider.formatIssueDraft(normalized, failure.project_id);

    // Create the issue in project
    const newIssue = await IssueService.createIssue(issueDraft, actorUserId || DEMO_PERSONAS.admin.id);

    // Attach CI_RUN git link
    await GitService.addGitLink(newIssue.id, {
      link_type: 'CI_RUN',
      external_id: failure.build_id,
      title: `${provider.displayName} Run: ${failure.test_name}`,
      url: failure.build_url,
      author: failure.commit_author || 'CI Runner',
      status: 'FAILED',
      metadata: {
        commit_sha: failure.commit_sha,
        branch: failure.branch,
        environment: failure.environment,
      },
    });

    // Attach COMMIT git link
    await GitService.addGitLink(newIssue.id, {
      link_type: 'COMMIT',
      external_id: failure.commit_sha.substring(0, 7),
      title: `Commit ${failure.commit_sha.substring(0, 7)} on ${failure.branch}`,
      url: `https://github.com/ammy194/BugForge/commit/${failure.commit_sha}`,
      author: failure.commit_author || 'Author',
      status: 'COMMITTED',
    });

    // Update failure record status
    failure.status = 'CONVERTED_TO_ISSUE';
    failure.converted_issue_id = newIssue.id;
    failure.converted_issue_key = newIssue.key;
    failure.updated_at = new Date().toISOString();
    ciFailuresStore.set(failureId, failure);

    logger.info(`✨ Converted CI failure ${failureId} -> Issue ${newIssue.key}`);

    return { issue: newIssue, failure, alreadyCreated: false };
  }

  /**
   * Direct automated webhook handler (backward compatibility)
   */
  static async handleCIFailure(payload: CIFailurePayload) {
    const record = await this.ingestFailure({ ...payload, provider: 'github_actions' });
    const result = await this.createIssueFromFailure(record.id, DEMO_PERSONAS.admin.id);
    return result.issue;
  }
}
