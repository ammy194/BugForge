export type WebhookEventType =
  | 'issue.created'
  | 'issue.updated'
  | 'issue.status_changed'
  | 'issue.resolved'
  | 'comment.created'
  | 'ci.failed';

export interface Webhook {
  id: string;
  project_id: string;
  url: string;
  secret?: string;
  events: WebhookEventType[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubCommitPayload {
  id: string;
  message: string;
  url: string;
  author: {
    name: string;
    email: string;
  };
  timestamp: string;
}

export interface GitHubPullRequestPayload {
  action: 'opened' | 'closed' | 'merged' | 'reopened';
  number: number;
  pull_request: {
    title: string;
    html_url: string;
    body?: string;
    head: {
      ref: string;
    };
    user: {
      login: string;
    };
    merged: boolean;
  };
}

export interface CIFailurePayload {
  project_key: string;
  test_name: string;
  build_id: string;
  build_url: string;
  branch: string;
  commit_sha: string;
  commit_author?: string;
  error_message: string;
  stack_trace?: string;
}
