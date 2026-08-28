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

export type IssueResolution = 'FIXED' | 'WONT_FIX' | 'DUPLICATE' | 'INVALID' | 'CANNOT_REPRODUCE';

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
  resolved_issues_count?: number;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  user?: UserProfile;
}

export interface Component {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  default_assignee_id?: string;
  created_at?: string;
  default_assignee?: UserProfile;
}

export type VersionStatus = 'UNRELEASED' | 'RELEASED' | 'ARCHIVED';

export interface Version {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: VersionStatus;
  release_date?: string;
  created_at: string;
  total_issues_count?: number;
  resolved_issues_count?: number;
}

export type MilestoneStatus = 'OPEN' | 'CLOSED';

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  status: MilestoneStatus;
  due_date?: string;
  created_at: string;
  total_issues_count?: number;
  resolved_issues_count?: number;
}

export interface Label {
  id: string;
  project_id: string;
  name: string;
  color: string;
}

export interface IssueHistoryItem {
  id: string;
  issue_id: string;
  actor_id?: string;
  field_name: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
  actor?: UserProfile;
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

  // Joined relations
  reporter?: UserProfile;
  assignee?: UserProfile | null;
  project?: Project;
  component?: Component | null;
  version?: Version | null;
  milestone?: Milestone | null;
  labels?: Label[];
  history?: IssueHistoryItem[];
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

export type GitLinkType = 'COMMIT' | 'PR' | 'BRANCH' | 'CI_RUN';

export interface GitLink {
  id: string;
  issue_id?: string;
  link_type: GitLinkType;
  external_id: string;
  title: string;
  url: string;
  author?: string;
  status?: string;
  metadata?: any;
  created_at?: string;
}

export interface Comment {
  id: string;
  issue_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at?: string;
  user?: UserProfile;
}
