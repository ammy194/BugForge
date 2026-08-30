import { AuthenticatedUser } from './auth';

export type ProjectRole = 'ADMIN' | 'PROJECT_MANAGER' | 'DEVELOPER' | 'REPORTER';

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
  /**
   * True only for the platform's built-in demo/showcase projects. Always
   * server-derived; custom accounts never see or create demo projects.
   */
  is_demo?: boolean;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';

export interface ProjectInvitation {
  id: string;
  project_id: string;
  inviter_id: string;
  invitee_id: string;
  invitee_email: string;
  role: ProjectRole;
  status: InvitationStatus;
  created_at: string;
  updated_at: string;
  responded_at?: string | null;
  expires_at: string;
  project?: Pick<Project, 'id' | 'key' | 'name'>;
  inviter?: { id: string; full_name: string; email: string };
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: ProjectRole;
  created_at: string;
  user?: AuthenticatedUser;
}

export interface Component {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  default_assignee_id?: string;
  created_at: string;
  default_assignee?: AuthenticatedUser;
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
