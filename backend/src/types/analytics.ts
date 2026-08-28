import { IssuePriority, IssueSeverity, IssueStatus } from './issue';

export interface TrendDataPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface ComponentHealthStat {
  component_id: string;
  component_name: string;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  blocker_count: number;
  defect_percentage: number;
  health_status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL';
  mttr_hours: number;
}

export interface DeveloperWorkloadStat {
  user_id: string;
  name: string;
  avatar_url?: string;
  assigned_open: number;
  resolved_count: number;
}

export interface ReleaseReadinessReport {
  version_name: string;
  status: string;
  readiness_percentage: number;
  blockers_count: number;
  critical_count: number;
  total_issues: number;
  resolved_issues: number;
  target_release_date?: string;
  recommendation: 'READY_FOR_DEPLOY' | 'BLOCKED_BY_DEFECTS' | 'IN_STABILIZATION';
}

export interface ProjectAnalyticsOverview {
  project_id: string;
  project_key: string;
  mttd_hours: number;
  mttd_formatted: string;
  mttr_hours: number;
  mttr_formatted: string;
  reopen_rate_percentage: number;
  defect_escape_rate_percentage: number;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  discovery_rate_weekly: number;
  fix_rate_weekly: number;
  velocity_ratio: number;
  regression_rate_percentage: number;
  severity_distribution: Record<IssueSeverity, number>;
  priority_distribution: Record<IssuePriority, number>;
  component_stats: ComponentHealthStat[];
  developer_workload: DeveloperWorkloadStat[];
  release_readiness: ReleaseReadinessReport;
  weekly_trends: TrendDataPoint[];
}
