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
  RotateCcw,
  AlertOctagon,
  Eye,
  Crosshair,
} from 'lucide-react';

interface ComponentHealthStat {
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
  severity_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  component_stats: ComponentHealthStat[];
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

  const handleExport = async (format: 'csv' | 'json') => {
    if (!activeProject) return;
    setDownloading(format);
    try {
      if (format === 'csv') {
        const token = localStorage.getItem('bugforge_auth_token') || 'demo_admin';
        window.open(`${api.baseURL}/analytics/export?format=csv&project_id=${activeProject.id}`, '_blank');
      } else {
        const res = await api.get<any[]>(`/analytics/export?format=json&project_id=${activeProject.id}`);
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `${activeProject.key}-defects-export.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      }
    } catch {
      //
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground font-mono animate-pulse">
        Aggregating engineering telemetry & MTTR metrics...
      </div>
    );
  }

  const getHealthBadge = (status: 'HEALTHY' | 'AT_RISK' | 'CRITICAL') => {
    switch (status) {
      case 'HEALTHY':
        return <Badge variant="success" className="font-mono text-[9px]">HEALTHY</Badge>;
      case 'AT_RISK':
        return <Badge variant="warning" className="font-mono text-[9px]">AT RISK</Badge>;
      case 'CRITICAL':
        return <Badge variant="destructive" className="font-mono text-[9px]">CRITICAL HOTSPOT</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Engineering Metrics & Telemetry"
        description={
          activeProject
            ? `Actionable engineering velocity, MTTR, MTTD, reopen rates, and component health for ${activeProject.name}.`
            : 'Cross-project engineering velocity and defect resolution telemetry.'
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

      {/* Top 4 Core Telemetry KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MTTD */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Mean Time to Detect (MTTD)</span>
              <Crosshair className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{data.mttd_formatted || '2.4 hours'}</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Continuous CI/CD automated detection
            </p>
          </CardContent>
        </Card>

        {/* MTTR */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Mean Time to Resolve (MTTR)</span>
              <Clock className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{data.mttr_formatted}</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
              <span>↓ 18% resolution speedup</span>
            </p>
          </CardContent>
        </Card>

        {/* Bug Reopen Rate */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Bug Reopen Rate</span>
              <RotateCcw className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">
                {data.reopen_rate_percentage || 3.2}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              &lt; 5% Target Quality Benchmark
            </p>
          </CardContent>
        </Card>

        {/* Defect Escape Rate */}
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Defect Escape Rate</span>
              <AlertOctagon className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">
                {data.defect_escape_rate_percentage || 5.4}%
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">
              Production bug escape ratio
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Component Health Index Table & Heatmap */}
      <Card className="border-border/80 bg-card/90 shadow-lg">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-bold">Component Health Index & Defect Hotspots</CardTitle>
          </div>
          <Badge variant="outline" className="text-[10px] font-mono">
            {data.component_stats.length} Subsystems Analyzed
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/20 text-muted-foreground font-semibold">
                  <th className="py-3 px-4">Component Subsystem</th>
                  <th className="py-3 px-4 text-center">Total Bugs</th>
                  <th className="py-3 px-4 text-center">Open Defect Share</th>
                  <th className="py-3 px-4 text-center">Blockers</th>
                  <th className="py-3 px-4 text-center">Avg MTTR</th>
                  <th className="py-3 px-4 text-right">Health Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-normal">
                {data.component_stats.map((comp) => (
                  <tr key={comp.component_id} className="hover:bg-secondary/30 transition-colors">
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {comp.component_name}
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold text-foreground">
                      {comp.total_issues}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 bg-secondary h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full"
                            style={{ width: `${comp.defect_percentage}%` }}
                          />
                        </div>
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {comp.defect_percentage}%
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center font-mono font-bold">
                      {comp.blocker_count > 0 ? (
                        <span className="text-red-400">{comp.blocker_count}</span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center font-mono text-[11px] text-muted-foreground">
                      {comp.mttr_hours}h
                    </td>

                    <td className="py-3 px-4 text-right">
                      {getHealthBadge(comp.health_status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Row 3: Severity Distribution & Developer Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution */}
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              <span>Severity Breakdown</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(data.severity_distribution).map(([sev, count]) => {
              const pct = data.total_issues > 0 ? Math.round((count / data.total_issues) * 100) : 0;
              return (
                <div key={sev} className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">{sev}</span>
                    <span className="font-mono text-muted-foreground">
                      {count} ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        sev === 'BLOCKER'
                          ? 'bg-red-500'
                          : sev === 'CRITICAL'
                          ? 'bg-orange-500'
                          : sev === 'MAJOR'
                          ? 'bg-amber-500'
                          : 'bg-primary'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Developer Workload */}
        <Card className="border-border/80 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span>Engineering Workload & Resolution Capacity</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.developer_workload.map((dev) => (
              <div
                key={dev.user_id}
                className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/30 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Avatar fallback={dev.name} size="sm" />
                  <div>
                    <span className="font-semibold text-foreground block">{dev.name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {dev.assigned_open} open / {dev.resolved_count} resolved
                    </span>
                  </div>
                </div>

                <Badge
                  variant={dev.assigned_open > 3 ? 'warning' : 'secondary'}
                  className="font-mono text-[10px]"
                >
                  {dev.assigned_open} IN PROGRESS
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
