import { Issue, IssueStatus, IssueResolution } from '../types/issue';
import { ProjectRole } from '../types/project';
import { AppError } from '../utils/appError';

export interface WorkflowTransitionRule {
  from: IssueStatus;
  to: IssueStatus;
  label: string;
  allowedRoles: ProjectRole[];
  allowReporter: boolean;
  requiresResolution?: boolean;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransitionRule[] = [
  // From OPEN
  { from: 'OPEN', to: 'TRIAGED', label: 'Triage Issue', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: false },
  { from: 'OPEN', to: 'IN_PROGRESS', label: 'Start Progress', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },
  { from: 'OPEN', to: 'CLOSED', label: 'Close as Invalid/Duplicate', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: true, requiresResolution: true },

  // From TRIAGED
  { from: 'TRIAGED', to: 'IN_PROGRESS', label: 'Start Progress', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },
  { from: 'TRIAGED', to: 'CLOSED', label: 'Reject / Close', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: true, requiresResolution: true },

  // From IN_PROGRESS
  { from: 'IN_PROGRESS', to: 'IN_REVIEW', label: 'Submit for Review', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },
  { from: 'IN_PROGRESS', to: 'OPEN', label: 'Stop Progress / Unassign', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },

  // From IN_REVIEW
  { from: 'IN_REVIEW', to: 'RESOLVED', label: 'Mark Resolved (PR Merged)', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false, requiresResolution: true },
  { from: 'IN_REVIEW', to: 'IN_PROGRESS', label: 'Request Changes', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },

  // From RESOLVED
  { from: 'RESOLVED', to: 'VERIFIED', label: 'Verify Fix (QA Passed)', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'REPORTER'], allowReporter: true },
  { from: 'RESOLVED', to: 'REOPENED', label: 'Reopen (QA Failed)', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER'], allowReporter: true },
  { from: 'RESOLVED', to: 'CLOSED', label: 'Close Ticket', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: true },

  // From VERIFIED
  { from: 'VERIFIED', to: 'CLOSED', label: 'Close (Release Ready)', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: true },
  { from: 'VERIFIED', to: 'REOPENED', label: 'Reopen (Regression)', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER'], allowReporter: true },

  // From CLOSED
  { from: 'CLOSED', to: 'REOPENED', label: 'Reopen Defect', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER', 'REPORTER'], allowReporter: true },

  // From REOPENED
  { from: 'REOPENED', to: 'IN_PROGRESS', label: 'Resume Progress', allowedRoles: ['ADMIN', 'PROJECT_MANAGER', 'DEVELOPER'], allowReporter: false },
  { from: 'REOPENED', to: 'TRIAGED', label: 'Send to Triage', allowedRoles: ['ADMIN', 'PROJECT_MANAGER'], allowReporter: false },
];

export class WorkflowEngine {
  /**
   * Validate if a transition from currentStatus -> nextStatus is legal
   */
  static validateTransition(
    currentStatus: IssueStatus,
    nextStatus: IssueStatus,
    resolution: IssueResolution | null | undefined,
    userRole: ProjectRole | 'ADMIN',
    isReporter: boolean = false
  ): { valid: boolean; rule?: WorkflowTransitionRule; reason?: string } {
    if (currentStatus === nextStatus) {
      return { valid: false, reason: `Issue is already in status '${currentStatus}'` };
    }

    // Direct transition from CLOSED to IN_PROGRESS is strictly forbidden without reopening
    if (currentStatus === 'CLOSED' && nextStatus === 'IN_PROGRESS') {
      return {
        valid: false,
        reason: 'Cannot transition directly from CLOSED to IN PROGRESS. The issue must be REOPENED first.',
      };
    }

    const rule = WORKFLOW_TRANSITIONS.find(
      (r) => r.from === currentStatus && r.to === nextStatus
    );

    if (!rule) {
      return {
        valid: false,
        reason: `Illegal workflow transition from '${currentStatus}' to '${nextStatus}'.`,
      };
    }

    // Check resolution requirement
    if (rule.requiresResolution && !resolution && nextStatus === 'RESOLVED') {
      return {
        valid: false,
        reason: "Transition to 'RESOLVED' requires a valid resolution (e.g. 'FIXED', 'WONT_FIX', 'DUPLICATE', 'INVALID', 'CANNOT_REPRODUCE').",
      };
    }

    // Role check (Global Admin or Project Admin bypasses role check)
    if (userRole !== 'ADMIN') {
      const hasRole = rule.allowedRoles.includes(userRole as ProjectRole);
      const hasReporterAccess = rule.allowReporter && isReporter;

      if (!hasRole && !hasReporterAccess) {
        return {
          valid: false,
          reason: `Insufficient role permissions to transition issue to '${nextStatus}'. Required roles: [${rule.allowedRoles.join(', ')}]`,
        };
      }
    }

    return { valid: true, rule };
  }

  /**
   * Get all legal next statuses and transition actions for an issue
   */
  static getAvailableTransitions(
    issue: Issue,
    userRole: ProjectRole | 'ADMIN',
    isReporter: boolean
  ): Array<{ to: IssueStatus; label: string; requiresResolution: boolean }> {
    return WORKFLOW_TRANSITIONS.filter((rule) => {
      if (rule.from !== issue.status) return false;
      if (userRole === 'ADMIN') return true;
      const hasRole = rule.allowedRoles.includes(userRole as ProjectRole);
      const hasReporterAccess = rule.allowReporter && isReporter;
      return hasRole || hasReporterAccess;
    }).map((r) => ({
      to: r.to,
      label: r.label,
      requiresResolution: Boolean(r.requiresResolution),
    }));
  }
}
