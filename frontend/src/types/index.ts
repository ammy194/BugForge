export type GlobalRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'REPORTER';

export type ProjectRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'REPORTER';

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

export type IssueType = 'BUG' | 'FEATURE' | 'TASK' | 'IMPROVEMENT';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  global_role: GlobalRole;
  created_at: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description?: string;
  owner_id: string;
  issue_counter: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
  members_count?: number;
  open_issues_count?: number;
}

export interface Component {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  default_assignee_id?: string;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
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
  assignee_id?: string;
  component_id?: string;
  version_id?: string;
  milestone_id?: string;
  environment?: string;
  repro_steps?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  resolution?: string;
  duplicate_of_id?: string;
  due_date?: string;
  resolved_at?: string;
  closed_at?: string;
  created_at: string;
  updated_at: string;

  // Joined relations
  reporter?: UserProfile;
  assignee?: UserProfile;
  project?: Project;
  component?: Component;
  labels?: Label[];
  comments_count?: number;
  attachments_count?: number;
}

export interface SystemHealthData {
  status: string;
  service: string;
  version: string;
  environment: string;
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memory: {
      rssMb: number;
      heapUsedMb: number;
      heapTotalMb: number;
    };
  };
  integrations: {
    supabase: {
      connected: boolean;
      latencyMs?: number;
      message?: string;
    };
    grokAI: {
      configured: boolean;
      endpoint: string;
    };
    github: {
      configured: boolean;
    };
  };
}
