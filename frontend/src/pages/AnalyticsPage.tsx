import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { useProject } from '../contexts/ProjectContext';
import { api } from '../lib/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download,
  Flame,
  Layers,
  Users,
  ShieldCheck,
  Zap,
  Activity,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';

interface ComponentStat {
  component_id: string;
  component_name: string;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  blocker_count: number;
  defect_percentage: number;
}

interface DeveloperWorkload {
  user_id: string;
  name: string;
  avatar_url?: string;
  assigned_open: number;
  resolved_count: number;
}

interface ReleaseReadiness {
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

interface TrendPoint {
  date: string;
  created: number;
  resolved: number;
}

interface AnalyticsData {
  mttr_hours: number;
  mttr_formatted: string;
  total_issues: number;
  open_issues: number;
  resolved_issues: number;
  discovery_rate_weekly: number;
  fix_rate_weekly: number;
  velocity_ratio: number;
  regression_rate_percentage: number;
  severity_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  component_stats: ComponentStat[];
  developer_workload: DeveloperWorkload[];
  release_readiness: ReleaseReadiness;
  weekly_trends: TrendPoint[];
}

export const AnalyticsPage: React.FC = () => {
  const { activeProject } = useProject();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get<AnalyticsData>(
        `/analytics/overview${activeProject ? `?project_id=${activeProject.id}` : ''}`
      );
      setData(res);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [activeProject]);

  const handleExport = (format: 'csv' | 'json') => {
    setDownloading(format);
    const url = `/api/v1/analytics/export/${format}${activeProject ? `?project_id=${activeProject.id}` : ''}`;
    window.open(url, '_blank');
    setTimeout(() => setDownloading(null), 1500);
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
        Aggregating engineering telemetry and quality metrics...
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Engineering Metrics & Quality Telemetry"
        description="Mean Time to Resolution (MTTR), defect density, release readiness, and team velocity insights."
        badge={
          <Badge variant="purple" className="font-mono text-[11px]">
            {activeProject?.key || 'PROJECT'}
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={Boolean(downloading)}
            className="gap-1.5 text-xs h-8"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('json')}
            disabled={Boolean(downloading)}
            className="gap-1.5 text-xs h-8"
          >
            <FileCode className="h-3.5 w-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </Button>
        </div>
      </PageHeader>

      {/* Top 4 KPI Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MTTR */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Mean Time to Resolution</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{data.mttr_formatted}</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span>↓ 18% improvement</span>
              <span className="text-muted-foreground font-normal">vs last cycle</span>
            </p>
          </CardContent>
        </Card>

        {/* Velocity Ratio */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Fix vs Discovery Velocity</span>
              <TrendingUp className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{data.velocity_ratio}x</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Resolving {data.fix_rate_weekly} bugs / wk (Intake: {data.discovery_rate_weekly}/wk)
            </p>
          </CardContent>
        </Card>

        {/* Release Readiness */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Release Readiness ({data.release_readiness.version_name.split(' ')[0]})</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">
                {data.release_readiness.readiness_percentage}%
              </span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full"
                style={{ width: `${data.release_readiness.readiness_percentage}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Defect Regression Rate */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Defect Regression Rate</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">
                {data.regression_rate_percentage}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Optimal &lt; 5% quality threshold
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Problematic Components vs Severity Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Problematic Components */}
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Subsystem Defect Distribution & Hotspots</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Ranked breakdown of components generating the highest defect volume.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {data.component_stats.map((c) => (
              <div key={c.component_id} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-foreground">{c.component_name}</span>
                  <div className="flex items-center gap-2 text-muted-foreground font-mono">
                    {c.blocker_count > 0 && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0">
                        {c.blocker_count} BLOCKER
                      </Badge>
                    )}
                    <span>{c.total_issues} defects ({c.defect_percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full rounded-full"
                    style={{ width: `${Math.max(8, c.defect_percentage)}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-amber-400" />
              <span>Defect Severity & Impact Classification</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Current active breakdown across severity tiers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-5 gap-2 text-center">
              <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10">
                <span className="text-[10px] font-bold text-red-400 block">BLOCKER</span>
                <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                  {data.severity_distribution.BLOCKER || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-orange-500/30 bg-orange-500/10">
                <span className="text-[10px] font-bold text-orange-400 block">CRITICAL</span>
                <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                  {data.severity_distribution.CRITICAL || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10">
                <span className="text-[10px] font-bold text-amber-400 block">MAJOR</span>
                <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                  {data.severity_distribution.MAJOR || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/10">
                <span className="text-[10px] font-bold text-blue-400 block">MINOR</span>
                <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                  {data.severity_distribution.MINOR || 0}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-zinc-500/30 bg-zinc-500/10">
                <span className="text-[10px] font-bold text-zinc-400 block">TRIVIAL</span>
                <span className="text-xl font-bold font-mono text-foreground mt-1 block">
                  {data.severity_distribution.TRIVIAL || 0}
                </span>
              </div>
            </div>

            {/* Weekly Velocity Trend Chart */}
            <div className="pt-4 border-t border-border/60 space-y-2">
              <span className="font-semibold text-foreground block">Weekly Intake vs Resolution Velocity:</span>
              <div className="grid grid-cols-7 gap-2 pt-2 text-center">
                {data.weekly_trends.map((t) => (
                  <div key={t.date} className="space-y-1">
                    <div className="h-20 flex items-end justify-center gap-1">
                      <div
                        className="w-3 bg-red-400/80 rounded-t"
                        style={{ height: `${t.created * 10}px` }}
                        title={`Created: ${t.created}`}
                      />
                      <div
                        className="w-3 bg-emerald-400/80 rounded-t"
                        style={{ height: `${t.resolved * 10}px` }}
                        title={`Resolved: ${t.resolved}`}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono">{t.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-1">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-red-400 rounded-sm" />
                  <span>Reported Defects</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-emerald-400 rounded-sm" />
                  <span>Resolved Fixes</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Team Workload Throughput */}
      <Card className="border-border/80 bg-card/80">
        <CardHeader>
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span>Engineering Team Workload & Throughput</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Active defect assignments and resolution volume per engineer.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {data.developer_workload.map((dev) => (
              <div key={dev.user_id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Avatar fallback={dev.name} size="sm" />
                  <div>
                    <span className="font-bold text-foreground block">{dev.name}</span>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {dev.assigned_open} active tickets assigned
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 font-mono">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400 block">{dev.resolved_count}</span>
                    <span className="text-[10px] text-muted-foreground">Resolved</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-foreground block">{dev.assigned_open}</span>
                    <span className="text-[10px] text-muted-foreground">Open</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
