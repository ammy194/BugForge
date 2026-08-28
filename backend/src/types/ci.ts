export type CIProviderType = 'github_actions' | 'gitlab_ci' | 'circleci' | 'generic';

export type CIFailureStatus = 'UNRESOLVED' | 'CONVERTED_TO_ISSUE' | 'IGNORED';

export interface NormalizedCIFailure {
  provider: CIProviderType;
  project_key: string;
  test_suite: string;
  test_name: string;
  error_message: string;
  stack_trace?: string;
  expected_result?: string;
  actual_result?: string;
  build_id: string;
  build_url: string;
  branch: string;
  commit_sha: string;
  commit_author?: string;
  environment?: string;
}

export interface CIFailureRecord {
  id: string;
  project_id: string;
  provider: CIProviderType;
  ci_run_id?: string;
  test_suite: string;
  test_name: string;
  error_message: string;
  stack_trace?: string;
  expected_result?: string;
  actual_result?: string;
  build_id: string;
  build_url: string;
  branch: string;
  commit_sha: string;
  commit_author?: string;
  environment?: string;
  status: CIFailureStatus;
  converted_issue_id?: string;
  converted_issue_key?: string;
  created_at: string;
  updated_at: string;
}
