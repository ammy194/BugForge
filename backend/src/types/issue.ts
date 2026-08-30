import { AuthenticatedUser } from './auth';
import { Project, Component, Version, Milestone } from './project';

export type IssueType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';

export type IssueStatus =
  | 'OPEN'
  | 'TRIAGED'
  | 'IN_PROGRESS'
  | 'IN_REVIEW'
  | 'RESOLVED'
  | 'VERIFIED'
  | 'CLOSED'
  | 'REOPENED';

export type IssuePriority = 'P0_CRITICAL' | 'P1_HIGH' | 'P2_MEDIUM' | 'P3_LOW';

export type IssueSeverity = 'BLOCKER' | 'CRITICAL' | 'MAJOR' | 'MINOR' | 'TRIVIAL';

export type IssueResolution = 'FIXED' | 'WONT_FIX' | 'DUPLICATE' | 'INVALID' | 'CANNOT_REPRODUCE';

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface IssueHistoryItem {
  id: string;
  issue_id: string;
  actor_id?: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  actor?: AuthenticatedUser;
}

export interface CreateIssueDto {
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
}

export interface Issue {
  id: string;
  project_id: string;
  key: string;
  issue_number: number;
  title: string;
  description: string;
  issue_type: IssueType;
  status: IssueStatus;
  priority: IssuePriority;
  severity: IssueSeverity;
  reporter_id: string;
  assignee_id?: string | null;
  component_id?: string | null;
  version_id?: string | null;
  milestone_id?: string | null;
  environment?: string | null;
  repro_steps?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
  resolution?: IssueResolution | null;
  duplicate_of_id?: string | null;
  due_date?: string | null;
  resolved_at?: string | null;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;

  // Joined metadata
  project?: Project;
  reporter?: AuthenticatedUser;
  assignee?: AuthenticatedUser | null;
  component?: Component | null;
  version?: Version | null;
  milestone?: Milestone | null;
  labels?: Label[];
  history?: IssueHistoryItem[];
  comments_count?: number;
  attachments_count?: number;
  git_links_count?: number;
}

export type NotificationType =
  | 'ASSIGNED'
  | 'MENTIONED'
  | 'STATUS_CHANGED'
  | 'COMMENTED'
  | 'RESOLVED'
  | 'REOPENED'
  | 'CI_FAILURE'
  | 'PROJECT_INVITE';

export interface Notification {
  id: string;
  user_id: string;
  actor_id?: string | null;
  issue_id?: string | null;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  actor?: AuthenticatedUser;
  issue_key?: string;
}
