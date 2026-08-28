import { IssuePriority, IssueSeverity } from './issue';

export interface DuplicateMatch {
  issue_id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  similarity_score: number;
  reason: string;
}

export interface ExtractedBugFields {
  title?: string;
  description?: string;
  repro_steps?: string;
  expected_behavior?: string;
  actual_behavior?: string;
  environment?: string;
  suggested_priority?: IssuePriority;
  suggested_severity?: IssueSeverity;
  suggested_component?: string;
}

export interface RootCauseAnalysisResult {
  root_cause: string;
  suspected_file: string;
  suspected_line?: number;
  explanation: string;
  suggested_fix_diff: string;
  prevention_tips: string[];
  ai_provider: string;
}

export interface NaturalLanguageQueryResult {
  filters: {
    status?: string[];
    priority?: IssuePriority[];
    severity?: IssueSeverity[];
    assignee_name?: string;
    component_name?: string;
    search_query?: string;
  };
  explanation: string;
}

export interface MissingInfoItem {
  field: string;
  label: string;
  reason: string;
}

export interface AITriageResult {
  suggested_severity: IssueSeverity;
  suggested_priority: IssuePriority;
  suggested_component_id?: string;
  suggested_component_name?: string;
  suggested_labels: string[];
  missing_information: MissingInfoItem[];
  confidence_score: number;
  triage_summary: string;
  ai_provider: string;
}
