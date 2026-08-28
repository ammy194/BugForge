import { AuthenticatedUser } from './auth';

export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author?: AuthenticatedUser;
}

export interface Attachment {
  id: string;
  issue_id: string;
  uploader_id: string;
  file_name: string;
  sanitized_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
  uploader?: AuthenticatedUser;
}

export type GitLinkType = 'COMMIT' | 'PR' | 'BRANCH' | 'CI_RUN';

export interface GitLink {
  id: string;
  issue_id: string;
  link_type: GitLinkType;
  external_id: string;
  title: string;
  url: string;
  author?: string;
  status?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type TimelineEventType =
  | 'CREATED'
  | 'STATUS_CHANGE'
  | 'ASSIGNMENT_CHANGE'
  | 'PRIORITY_CHANGE'
  | 'FIELD_CHANGE'
  | 'COMMENT'
  | 'GIT_LINK';

export interface TimelineEvent {
  id: string;
  issue_id: string;
  type: TimelineEventType;
  title: string;
  description?: string;
  old_value?: string | null;
  new_value?: string | null;
  actor?: AuthenticatedUser;
  created_at: string;
  metadata?: Record<string, any>;
}
