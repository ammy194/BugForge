import {
  Issue,
  IssueType,
  IssueStatus,
  IssuePriority,
  IssueSeverity,
  IssueResolution,
  IssueHistoryItem,
  Label,
} from '../types/issue';
import { ProjectService } from './projectService';
import { UserService, DEMO_PERSONAS } from './userService';
import { NotificationService } from './notificationService';
import { WorkflowEngine } from './workflowEngine';
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
      created_at: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
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
   * Core Bug Creation Workflow
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
   * Execute validated workflow transition
   */
  static async transitionStatus(
    issueId: string,
    nextStatus: IssueStatus,
    payload: { resolution?: IssueResolution | null; comment?: string | null; assignee_id?: string | null },
    actorId: string
  ): Promise<Issue> {
    const rawIssue = issuesStore.get(issueId) || Array.from(issuesStore.values()).find((i) => i.key.toUpperCase() === issueId.toUpperCase());
    if (!rawIssue) throw AppError.notFound(`Issue '${issueId}' not found`);

    const actor = await UserService.getProfileById(actorId);
    if (!actor) throw AppError.unauthorized('Actor not found');

    const member = await ProjectService.getMember(rawIssue.project_id, actorId);
    const userRole = actor.global_role === 'ADMIN' ? 'ADMIN' : (member?.role || 'DEVELOPER');
    const isReporter = rawIssue.reporter_id === actorId;

    // Validate Transition Rules using WorkflowEngine
    const validation = WorkflowEngine.validateTransition(
      rawIssue.status,
      nextStatus,
      payload.resolution,
      userRole,
      isReporter
    );

    if (!validation.valid) {
      throw AppError.badRequest(validation.reason || 'Invalid workflow transition');
    }

    const prevStatus = rawIssue.status;
    const now = new Date().toISOString();

    // Update Issue State
    rawIssue.status = nextStatus;
    rawIssue.updated_at = now;

    if (nextStatus === 'RESOLVED') {
      rawIssue.resolution = payload.resolution || 'FIXED';
      rawIssue.resolved_at = now;
    } else if (nextStatus === 'CLOSED') {
      rawIssue.closed_at = now;
      if (!rawIssue.resolution && payload.resolution) {
        rawIssue.resolution = payload.resolution;
      }
    } else if (nextStatus === 'REOPENED') {
      rawIssue.resolution = null;
      rawIssue.resolved_at = null;
      rawIssue.closed_at = null;
    }

    if (payload.assignee_id !== undefined) {
      rawIssue.assignee_id = payload.assignee_id;
    }

    // Log History
    const historyList = issueHistoryStore.get(rawIssue.id) || [];
    const historyItem: IssueHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      issue_id: rawIssue.id,
      actor_id: actorId,
      field_name: 'status',
      old_value: prevStatus,
      new_value: `${nextStatus}${payload.resolution ? ` (${payload.resolution})` : ''}${payload.comment ? ` - ${payload.comment}` : ''}`,
      created_at: now,
      actor,
    };
    historyList.push(historyItem);
    issueHistoryStore.set(rawIssue.id, historyList);

    // Notify Reporter and Assignee
    const notifyUsers = new Set<string>();
    if (rawIssue.reporter_id && rawIssue.reporter_id !== actorId) notifyUsers.add(rawIssue.reporter_id);
    if (rawIssue.assignee_id && rawIssue.assignee_id !== actorId) notifyUsers.add(rawIssue.assignee_id);

    for (const targetUserId of notifyUsers) {
      await NotificationService.createNotification({
        user_id: targetUserId,
        actor_id: actorId,
        issue_id: rawIssue.id,
        issue_key: rawIssue.key,
        type: nextStatus === 'RESOLVED' ? 'RESOLVED' : nextStatus === 'REOPENED' ? 'REOPENED' : 'STATUS_CHANGED',
        title: `Status Changed: ${rawIssue.key} → ${nextStatus}`,
        message: `${actor.full_name} changed status from ${prevStatus} to ${nextStatus}`,
      });
    }

    logger.info(`🔄 Transitioned ${rawIssue.key} from ${prevStatus} → ${nextStatus} by ${actor.email}`);

    return this.getIssue(rawIssue.id) as Promise<Issue>;
  }

  /**
   * Update issue attributes with granular audit trail diffing
   */
  static async updateAttributes(
    issueId: string,
    updates: Partial<Record<string, any>>,
    actorId: string
  ): Promise<Issue> {
    const rawIssue = issuesStore.get(issueId) || Array.from(issuesStore.values()).find((i) => i.key.toUpperCase() === issueId.toUpperCase());
    if (!rawIssue) throw AppError.notFound(`Issue '${issueId}' not found`);

    const actor = await UserService.getProfileById(actorId);
    if (!actor) throw AppError.unauthorized('Actor not found');

    const now = new Date().toISOString();
    const historyList = issueHistoryStore.get(rawIssue.id) || [];

    const fieldsToTrack = [
      'title',
      'priority',
      'severity',
      'issue_type',
      'assignee_id',
      'component_id',
      'version_id',
      'milestone_id',
      'due_date',
      'environment',
    ];

    for (const field of fieldsToTrack) {
      if (updates[field] !== undefined && (rawIssue as any)[field] !== updates[field]) {
        const oldValue = (rawIssue as any)[field];
        const newValue = updates[field];

        (rawIssue as any)[field] = newValue;

        // Populate friendly label for audit history
        let displayOld = String(oldValue || 'None');
        let displayNew = String(newValue || 'None');

        if (field === 'assignee_id') {
          const oldUser = oldValue ? await UserService.getProfileById(oldValue) : null;
          const newUser = newValue ? await UserService.getProfileById(newValue) : null;
          displayOld = oldUser?.full_name || 'Unassigned';
          displayNew = newUser?.full_name || 'Unassigned';

          // Trigger assignment notification
          if (newValue && newValue !== actorId) {
            await NotificationService.createNotification({
              user_id: newValue,
              actor_id: actorId,
              issue_id: rawIssue.id,
              issue_key: rawIssue.key,
              type: 'ASSIGNED',
              title: `Assigned: ${rawIssue.key}`,
              message: `${actor.full_name} assigned you to "${rawIssue.title}"`,
            });
          }
        }

        historyList.push({
          id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          issue_id: rawIssue.id,
          actor_id: actorId,
          field_name: field,
          old_value: displayOld,
          new_value: displayNew,
          created_at: now,
          actor,
        });
      }
    }

    if (updates.description !== undefined && updates.description !== rawIssue.description) {
      rawIssue.description = updates.description;
      historyList.push({
        id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        issue_id: rawIssue.id,
        actor_id: actorId,
        field_name: 'description',
        old_value: 'Previous description updated',
        new_value: 'Description modified',
        created_at: now,
        actor,
      });
    }

    rawIssue.updated_at = now;
    issueHistoryStore.set(rawIssue.id, historyList);

    return this.getIssue(rawIssue.id) as Promise<Issue>;
  }

  /**
   * Get legal next transition actions for an issue
   */
  static async getAvailableTransitions(issueId: string, actorId: string) {
    const issue = await this.getIssue(issueId);
    if (!issue) throw AppError.notFound(`Issue '${issueId}' not found`);

    const actor = await UserService.getProfileById(actorId);
    const member = await ProjectService.getMember(issue.project_id, actorId);
    const userRole = actor?.global_role === 'ADMIN' ? 'ADMIN' : (member?.role || 'DEVELOPER');
    const isReporter = issue.reporter_id === actorId;

    return WorkflowEngine.getAvailableTransitions(issue, userRole, isReporter);
  }

  /**
   * Fetch full issue with relations
   */
  static async getIssue(identifier: string): Promise<Issue | null> {
    let issue = issuesStore.get(identifier);
    if (!issue) {
      issue = Array.from(issuesStore.values()).find(
        (i) => i.key.toUpperCase() === identifier.toUpperCase()
      );
    }
    if (!issue) return null;

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
   * Retrieve audit history
   */
  static async getIssueHistory(identifier: string): Promise<IssueHistoryItem[]> {
    let issueId = identifier;
    if (!issuesStore.has(identifier)) {
      const found = Array.from(issuesStore.values()).find(
        (i) => i.key.toUpperCase() === identifier.toUpperCase()
      );
      if (found) issueId = found.id;
    }

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
   * List and filter issues
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

    list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = list.length;
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    const paginated = list.slice(offset, offset + limit);

    const populated = await Promise.all(paginated.map((i) => this.getIssue(i.id)));
    return {
      issues: populated.filter(Boolean) as Issue[],
      total,
    };
  }
}
