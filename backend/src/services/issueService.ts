import {
  Issue,
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueSeverity,
  IssueHistoryItem,
  Label,
} from '../types/issue';
import { ProjectService } from './projectService';
import { UserService, DEMO_PERSONAS } from './userService';
import { NotificationService } from './notificationService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';

// In-Memory Data Stores
const issuesStore = new Map<string, Issue>();
const issueHistoryStore = new Map<string, IssueHistoryItem[]>();
const labelsStore = new Map<string, Label[]>();

// Initialize Seed Issues
function initSeedIssues() {
  if (issuesStore.size > 0) return;

  const ecomId = 'ecom-proj-00000000-0000-0000-000000000001';

  // Seed Labels for ECOM
  labelsStore.set(ecomId, [
    { id: 'l1', project_id: ecomId, name: 'checkout', color: '#ef4444', created_at: new Date('2026-01-01').toISOString() },
    { id: 'l2', project_id: ecomId, name: 'coupon', color: '#f59e0b', created_at: new Date('2026-01-01').toISOString() },
    { id: 'l3', project_id: ecomId, name: 'payment', color: '#10b981', created_at: new Date('2026-01-01').toISOString() },
    { id: 'l4', project_id: ecomId, name: 'frontend', color: '#38bdf8', created_at: new Date('2026-01-01').toISOString() },
    { id: 'l5', project_id: ecomId, name: 'security', color: '#a855f7', created_at: new Date('2026-01-01').toISOString() },
  ]);

  const now = new Date();

  const seedIssues: Partial<Issue>[] = [
    {
      id: 'issue-00000000-0000-0000-0000-000000001042',
      project_id: ecomId,
      key: 'ECOM-1042',
      issue_number: 1042,
      title: 'Checkout crashes when applying expired coupon code',
      description: 'When a customer attempts to apply a promo coupon that passed its expiration date by >24h, the discount service throws an unhandled NullPointer during price calculation, causing a 500 error on the UI.',
      issue_type: 'BUG',
      status: 'OPEN',
      priority: 'P0_CRITICAL',
      severity: 'BLOCKER',
      reporter_id: DEMO_PERSONAS.reporter.id,
      assignee_id: DEMO_PERSONAS.dev.id,
      component_id: 'c1',
      version_id: 'v1',
      milestone_id: 'ms1',
      environment: 'Production / Chrome 128 / macOS 15.1',
      repro_steps: '1. Add any item to cart ($49.99)\n2. Proceed to checkout\n3. Enter promo code "SUMMER2025" (expired)\n4. Click Apply Button',
      expected_behavior: 'Friendly error banner: "Coupon code has expired."',
      actual_behavior: 'Red screen crash with 500 Internal Server Error: undefined price.discount',
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(), // 45m ago
      updated_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString(),
    },
    {
      id: 'issue-00000000-0000-0000-0000-000000001043',
      project_id: ecomId,
      key: 'ECOM-1043',
      issue_number: 1043,
      title: 'Cart item total displays floating point calculation discrepancy ($19.9999)',
      description: 'Items with sales tax percentage calculate prices as 19.9999 instead of rounding to standard 2 decimal currency precision.',
      issue_type: 'BUG',
      status: 'TRIAGED',
      priority: 'P1_HIGH',
      severity: 'CRITICAL',
      reporter_id: DEMO_PERSONAS.reporter.id,
      assignee_id: DEMO_PERSONAS.dev.id,
      component_id: 'c1',
      version_id: 'v1',
      milestone_id: 'ms1',
      environment: 'Staging / Safari 18',
      created_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: 'issue-00000000-0000-0000-0000-000000001044',
      project_id: ecomId,
      key: 'ECOM-1044',
      issue_number: 1044,
      title: 'Stripe webhook signature verification failure on recurring payment retry',
      description: 'Webhook fails with HMAC sha256 mismatch when Stripe resends failed payment webhooks with multiple timestamp headers.',
      issue_type: 'BUG',
      status: 'IN_PROGRESS',
      priority: 'P1_HIGH',
      severity: 'MAJOR',
      reporter_id: DEMO_PERSONAS.dev.id,
      assignee_id: DEMO_PERSONAS.dev.id,
      component_id: 'c1',
      version_id: 'v1',
      milestone_id: 'ms2',
      environment: 'Production Stripe Webhook Gateway',
      created_at: new Date(now.getTime() - 5 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
    },
    {
      id: 'issue-00000000-0000-0000-0000-000000001045',
      project_id: ecomId,
      key: 'ECOM-1045',
      issue_number: 1045,
      title: 'Missing accessibility aria-labels on product image gallery carousel',
      description: 'Screen reader users are unable to navigate thumbnail images on the PDP.',
      issue_type: 'IMPROVEMENT',
      status: 'IN_REVIEW',
      priority: 'P2_MEDIUM',
      severity: 'MINOR',
      reporter_id: DEMO_PERSONAS.pm.id,
      assignee_id: DEMO_PERSONAS.dev.id,
      component_id: 'c3',
      version_id: 'v1',
      created_at: new Date(now.getTime() - 12 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
    },
    {
      id: 'issue-00000000-0000-0000-0000-000000001040',
      project_id: ecomId,
      key: 'ECOM-1040',
      issue_number: 1040,
      title: 'OAuth login token refresh race condition on concurrent tab focus',
      description: 'Opening 5 tabs simultaneously caused refresh tokens to be consumed twice resulting in involuntary logout.',
      issue_type: 'BUG',
      status: 'RESOLVED',
      priority: 'P0_CRITICAL',
      severity: 'BLOCKER',
      resolution: 'FIXED',
      reporter_id: DEMO_PERSONAS.reporter.id,
      assignee_id: DEMO_PERSONAS.dev.id,
      component_id: 'c2',
      version_id: 'v2',
      resolved_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
      created_at: new Date(now.getTime() - 48 * 3600 * 1000).toISOString(),
      updated_at: new Date(now.getTime() - 24 * 3600 * 1000).toISOString(),
    },
  ];

  seedIssues.forEach((i) => {
    const issue = i as Issue;
    issuesStore.set(issue.id, issue);

    // Seed initial history
    issueHistoryStore.set(issue.id, [
      {
        id: `h-${issue.id}-1`,
        issue_id: issue.id,
        actor_id: issue.reporter_id,
        field_name: 'CREATED',
        old_value: null,
        new_value: `Issue reported by ${issue.reporter_id === DEMO_PERSONAS.reporter.id ? 'Elena Rostova (QA)' : 'Engineer'}`,
        created_at: issue.created_at,
      },
      {
        id: `h-${issue.id}-2`,
        issue_id: issue.id,
        actor_id: DEMO_PERSONAS.pm.id,
        field_name: 'status',
        old_value: 'OPEN',
        new_value: issue.status,
        created_at: issue.updated_at,
      },
    ]);
  });
}

initSeedIssues();

export class IssueService {
  /**
   * Core Bug Creation Workflow:
   * 1. Validates project membership
   * 2. Atomically increments project issue counter (e.g. 1042 -> 1043)
   * 3. Generates human-readable key (e.g. ECOM-1043)
   * 4. Persists issue entity
   * 5. Creates immutable history audit entry
   * 6. Triggers assignment notification if assigned
   */
  static async createIssue(
    data: {
      project_id: string;
      title: string;
      description: string;
      issue_type?: IssueType;
      priority?: IssuePriority;
      severity?: IssueSeverity;
      assignee_id?: string | null;
      component_id?: string | null;
      version_id?: string | null;
      milestone_id?: string | null;
      environment?: string | null;
      repro_steps?: string | null;
      expected_behavior?: string | null;
      actual_behavior?: string | null;
      due_date?: string | null;
      labels?: string[];
    },
    reporterId: string
  ): Promise<Issue> {
    const project = await ProjectService.getProject(data.project_id);
    if (!project) throw AppError.notFound(`Project '${data.project_id}' not found`);

    const reporter = await UserService.getProfileById(reporterId);
    if (!reporter) throw AppError.unauthorized('Reporter profile not found');

    // Atomic key generation
    project.issue_counter = (project.issue_counter || 1000) + 1;
    project.open_issues_count = (project.open_issues_count || 0) + 1;
    const issueNumber = project.issue_counter;
    const issueKey = `${project.key}-${issueNumber}`;

    const issueId = `issue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newIssue: Issue = {
      id: issueId,
      project_id: project.id,
      key: issueKey,
      issue_number: issueNumber,
      title: data.title,
      description: data.description,
      issue_type: data.issue_type || 'BUG',
      status: 'OPEN',
      priority: data.priority || 'P2_MEDIUM',
      severity: data.severity || 'MAJOR',
      reporter_id: reporterId,
      assignee_id: data.assignee_id || null,
      component_id: data.component_id || null,
      version_id: data.version_id || null,
      milestone_id: data.milestone_id || null,
      environment: data.environment || null,
      repro_steps: data.repro_steps || null,
      expected_behavior: data.expected_behavior || null,
      actual_behavior: data.actual_behavior || null,
      due_date: data.due_date || null,
      created_at: now,
      updated_at: now,
    };

    issuesStore.set(issueId, newIssue);

    // Initial Audit History Entry
    const initialHistory: IssueHistoryItem[] = [
      {
        id: `hist-${Date.now()}-1`,
        issue_id: issueId,
        actor_id: reporterId,
        field_name: 'CREATED',
        old_value: null,
        new_value: `Issue created by ${reporter.full_name}`,
        created_at: now,
        actor: reporter,
      },
    ];

    // If assignee was designated at creation time
    if (data.assignee_id) {
      const assignee = await UserService.getProfileById(data.assignee_id);
      if (assignee) {
        initialHistory.push({
          id: `hist-${Date.now()}-2`,
          issue_id: issueId,
          actor_id: reporterId,
          field_name: 'assignee_id',
          old_value: null,
          new_value: assignee.full_name,
          created_at: now,
          actor: reporter,
        });

        // Trigger Notification
        await NotificationService.createNotification({
          user_id: data.assignee_id,
          actor_id: reporterId,
          issue_id: issueId,
          issue_key: issueKey,
          type: 'ASSIGNED',
          title: `Assigned: ${issueKey}`,
          message: `${reporter.full_name} assigned you to "${data.title}"`,
        });
      }
    }

    issueHistoryStore.set(issueId, initialHistory);

    logger.info(`✅ Created issue ${issueKey}: "${data.title}" by ${reporter.email}`);

    return this.getIssue(issueId) as Promise<Issue>;
  }

  /**
   * Fetch issue by ID or Key with all joined relations
   */
  static async getIssue(identifier: string): Promise<Issue | null> {
    let issue = issuesStore.get(identifier);
    if (!issue) {
      issue = Array.from(issuesStore.values()).find(
        (i) => i.key.toUpperCase() === identifier.toUpperCase()
      );
    }
    if (!issue) return null;

    // Join relations
    const [project, reporter, assignee, history] = await Promise.all([
      ProjectService.getProject(issue.project_id),
      UserService.getProfileById(issue.reporter_id),
      issue.assignee_id ? UserService.getProfileById(issue.assignee_id) : Promise.resolve(null),
      this.getIssueHistory(issue.id),
    ]);

    const components = await ProjectService.getComponents(issue.project_id);
    const component = components.find((c) => c.id === issue!.component_id) || null;

    const versions = await ProjectService.getVersions(issue.project_id);
    const version = versions.find((v) => v.id === issue!.version_id) || null;

    const milestones = await ProjectService.getMilestones(issue.project_id);
    const milestone = milestones.find((m) => m.id === issue!.milestone_id) || null;

    return {
      ...issue,
      project: project || undefined,
      reporter: reporter || undefined,
      assignee: assignee || null,
      component: component || null,
      version: version || null,
      milestone: milestone || null,
      history: history || [],
    };
  }

  /**
   * Retrieve immutable audit history for an issue
   */
  static async getIssueHistory(issueId: string): Promise<IssueHistoryItem[]> {
    const history = issueHistoryStore.get(issueId) || [];
    const populated = await Promise.all(
      history.map(async (h) => ({
        ...h,
        actor: h.actor_id ? (await UserService.getProfileById(h.actor_id)) || undefined : undefined,
      }))
    );
    return populated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  /**
   * Query and filter issues with pagination
   */
  static async listIssues(query: {
    project_id?: string;
    project_key?: string;
    search?: string;
    status?: string;
    priority?: string;
    severity?: string;
    issue_type?: string;
    assignee_id?: string;
    reporter_id?: string;
    component_id?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ issues: Issue[]; total: number }> {
    let list = Array.from(issuesStore.values());

    if (query.project_id) {
      list = list.filter((i) => i.project_id === query.project_id);
    } else if (query.project_key) {
      const p = await ProjectService.getProject(query.project_key);
      if (p) list = list.filter((i) => i.project_id === p.id);
    }

    if (query.status) {
      list = list.filter((i) => i.status === query.status);
    }
    if (query.priority) {
      list = list.filter((i) => i.priority === query.priority);
    }
    if (query.severity) {
      list = list.filter((i) => i.severity === query.severity);
    }
    if (query.issue_type) {
      list = list.filter((i) => i.issue_type === query.issue_type);
    }
    if (query.assignee_id) {
      list = list.filter((i) => i.assignee_id === query.assignee_id);
    }
    if (query.reporter_id) {
      list = list.filter((i) => i.reporter_id === query.reporter_id);
    }
    if (query.component_id) {
      list = list.filter((i) => i.component_id === query.component_id);
    }

    if (query.search) {
      const q = query.search.toLowerCase();
      list = list.filter(
        (i) =>
          i.key.toLowerCase().includes(q) ||
          i.title.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          (i.environment && i.environment.toLowerCase().includes(q))
      );
    }

    // Default sort by created_at desc
    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paginated = list.slice(offset, offset + limit);

    // Populate joined relations
    const populated = await Promise.all(paginated.map((i) => this.getIssue(i.id)));
    return {
      issues: populated.filter(Boolean) as Issue[],
      total,
    };
  }
}
