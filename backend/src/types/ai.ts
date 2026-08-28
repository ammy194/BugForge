import { IssuePriority, IssueSeverity, IssueType } from './issue';
import { SavedViewFilters } from './view';

export interface DuplicateMatch {
  issue_id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  similarity_score: number; // 0 to 100
  reason: string;
}

export interface ExtractedBugFields {
  title: string;
  description: string;
  repro_steps: string;
  expected_behavior: string;
  actual_behavior: string;
  environment: string;
  suggested_priority: IssuePriority;
  suggested_severity: IssueSeverity;
  suggested_component?: string;
  confidence_score: number;
}

export interface RootCauseAnalysisResult {
  root_cause: string;
  suspected_file: string;
  suspected_line?: number;
  explanation: string;
  suggested_fix_diff: string;
  prevention_tips: string[];
  ai_provider: 'GROK_AI' | 'HEURISTIC_FALLBACK';
}

export interface NaturalLanguageQueryResult {
  raw_query: string;
  structured_filters: SavedViewFilters;
  explanation: string;
}
