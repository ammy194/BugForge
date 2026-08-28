import { IssueStatus, IssuePriority, IssueSeverity, IssueType } from './issue';

export interface SavedViewFilters {
  project_id?: string;
  project_key?: string;
  search?: string;
  status?: IssueStatus | string;
  priority?: IssuePriority | string;
  severity?: IssueSeverity | string;
  issue_type?: IssueType | string;
  assignee_id?: string;
  reporter_id?: string;
  component_id?: string;
  version_id?: string;
  milestone_id?: string;
  assigned_to_me?: boolean;
  reported_by_me?: boolean;
}

export interface SavedView {
  id: string;
  user_id: string;
  project_id?: string | null;
  name: string;
  icon?: string;
  query_filters: SavedViewFilters;
  is_shared: boolean;
  is_system?: boolean;
  created_at: string;
  updated_at: string;
}
