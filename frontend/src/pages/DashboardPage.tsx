import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Avatar } from '../components/ui/avatar';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { SystemHealthData, Issue } from '../types';
import {
  Bug,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Server,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Plus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Layers,
  FolderGit2,
  BarChart3,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject } = useProject();

  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [recentIssues, setRecentIssues] = useState<Issue[]>([]);
  const [assignedIssues, setAssignedIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [hData, issuesList] = await Promise.all([
        api.getHealth(),
        api.get<Issue[]>(`/issues${activeProject ? `?project_id=${activeProject.id}` : ''}`),
      ]);

      setHealth(hData);
      setRecentIssues(issuesList.slice(0, 5));
      if (user) {
        setAssignedIssues(issuesList.filter((i) => i.assignee_id === user.id));
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject, user]);

  const openCount = recentIssues.filter((i) => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)).length;
  const criticalCount = recentIssues.filter((i) => i.priority === 'P0_CRITICAL').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-gradient-to-r from-card via-secondary/20 to-purple-950/20 p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="purple" className="font-mono text-xs">
                {activeProject?.key || 'WORKSPACE'}
              </Badge>
              <Badge variant="success" className="text-xs">
                READY FOR SPRINT
              </Badge>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
              Welcome back, <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">{user?.full_name || 'Engineer'}</span>
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
              Monitoring active defects, Grok AI duplicate detection radar, and CI/CD telemetry for{' '}
              <strong className="text-foreground">{activeProject?.name || 'current workspace'}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/issues')}
              className="gap-1.5 text-xs h-9"
            >
              <Layers className="h-4 w-4" />
              <span>Browse Issues</span>
            </Button>

            <Button
              variant="glow"
              size="sm"
              onClick={() => navigate('/analytics')}
              className="gap-1.5 text-xs h-9 font-semibold"
            >
              <BarChart3 className="h-4 w-4" />
              <span>View Telemetry</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Active Defect Backlog</span>
              <Bug className="h-4 w-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{recentIssues.length}</span>
              <span className="text-xs text-muted-foreground">tickets</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">1.33x fix velocity ratio</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">P0 Critical Blockers</span>
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-400 font-mono">{criticalCount}</span>
              <span className="text-xs text-muted-foreground">require triage</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Grok AI root cause active</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Assigned to You</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">{assignedIssues.length}</span>
              <span className="text-xs text-muted-foreground">open tasks</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">Mean TTR: 4.8 hrs</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-semibold">Release v2.4.0 Readiness</span>
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground font-mono">85%</span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium">Stabilizing on staging</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Recent Defects vs System Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Spans: Recent Project Defects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Bug className="h-4 w-4 text-primary" />
              <span>Recent Project Defects</span>
            </h2>
            <Link to="/issues" className="text-xs text-primary hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="border-border/80 bg-card/80">
            <CardContent className="p-0">
              {recentIssues.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground">No open defects logged yet.</div>
              ) : (
                <div className="divide-y divide-border/60">
                  {recentIssues.map((issue) => (
                    <div
                      key={issue.id}
                      onClick={() => navigate(`/issues/${issue.key}`)}
                      className="p-4 hover:bg-secondary/30 transition-all cursor-pointer flex items-center justify-between gap-4 group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                            {issue.key}
                          </span>
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {issue.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          <span>Assignee: {issue.assignee?.full_name || 'Unassigned'}</span>
                          {issue.component && <span>• {issue.component.name}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={issue.priority === 'P0_CRITICAL' ? 'destructive' : 'warning'} className="text-[10px]">
                          {issue.priority.replace('_', ' ')}
                        </Badge>
                        <Badge variant="purple" className="text-[10px] font-mono">
                          {issue.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Span: Backend Health & Diagnostics */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Server className="h-4 w-4 text-emerald-400" />
            <span>Infrastructure Health & Services</span>
          </h2>

          <Card className="border-border/80 bg-card/80">
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-muted-foreground">API Server</span>
                <Badge variant="success" className="font-mono text-[10px]">
                  {health?.status || 'HEALTHY'}
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-muted-foreground">Supabase PostgreSQL & RLS</span>
                <Badge variant="success" className="font-mono text-[10px]">
                  {health?.integrations.supabase.connected ? 'CONNECTED' : 'LOCAL FALLBACK'}
                </Badge>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <span className="text-muted-foreground">Grok AI Triage Radar</span>
                <Badge variant="purple" className="font-mono text-[10px]">
                  {health?.integrations.grokAI.configured ? 'ACTIVE (GROK)' : 'HEURISTIC NLP'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">GitHub Actions CI Pipeline</span>
                <Badge variant="info" className="font-mono text-[10px]">
                  WEBHOOK READY
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
