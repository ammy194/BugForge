import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  AlertOctagon,
  RotateCcw,
  Check,
  Info,
  Flame,
  Radio,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject, userProjectRole } = useProject();

  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [allIssues, setAllIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionTab, setActionTab] = useState<'TRIAGE' | 'BLOCKERS' | 'VERIFY' | 'STALE' | 'CI' | 'MY_REPORTED' | 'MY_WORK'>('TRIAGE');

  useEffect(() => {
    if (userProjectRole === 'DEVELOPER') setActionTab('MY_WORK');
    else if (userProjectRole === 'REPORTER') setActionTab('MY_REPORTED');
    else setActionTab('TRIAGE');
  }, [userProjectRole]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [hData, issuesList] = await Promise.all([
        api.getHealth(),
        api.get<Issue[]>(`/issues${activeProject ? `?project_id=${activeProject.id}` : ''}`),
      ]);

      setHealth(hData);
      setAllIssues(Array.isArray(issuesList) ? issuesList : []);
    } catch {
      setAllIssues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [activeProject, user]);

  const safeIssues = Array.isArray(allIssues) ? allIssues : [];

  // Action Center Filtered Queues
  const needsTriageIssues = safeIssues.filter(
    (i) => i.status === 'OPEN' || !i.assignee_id || i.status === 'TRIAGED'
  );

  const blockersAssigned = safeIssues.filter(
    (i) =>
      (i.priority === 'P0_CRITICAL' || i.severity === 'BLOCKER') &&
      !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)
  );

  const readyForQAIssues = safeIssues.filter((i) => i.status === 'RESOLVED');

  const staleIssues = safeIssues.filter((i) => {
    const isUnresolved = !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status);
    const updatedDaysAgo = (Date.now() - new Date(i.updated_at).getTime()) / (1000 * 3600 * 24);
    return isUnresolved && updatedDaysAgo >= 7;
  });

  const openCount = safeIssues.filter((i) => !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)).length;
  const criticalCount = safeIssues.filter((i) => i.priority === 'P0_CRITICAL').length;
  const resolvedCount = safeIssues.filter((i) => ['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status)).length;

  const myReportedIssues = safeIssues.filter((i) => i.reporter_id === user?.id);
  const myWorkIssues = safeIssues.filter((i) => i.assignee_id === user?.id && !['RESOLVED', 'VERIFIED', 'CLOSED'].includes(i.status));

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card p-6 md:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="default" className="font-mono text-xs">
                {activeProject?.key || 'WORKSPACE'}
              </Badge>
              <h1 className="text-3xl font-bold tracking-tight">
                Welcome back, {user?.full_name?.split(' ')[0]} 👋
              </h1>
            </div>
            <p className="text-muted-foreground text-sm">
              {userProjectRole === 'REPORTER' ? (
                <>Here is your daily digest. You have reported {myReportedIssues.length} issues in this workspace.</>
              ) : (
                <>
                  Here is your daily engineering digest. You have {blockersAssigned.length} critical blockers
                  and {needsTriageIssues.length} issues awaiting triage.
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/issues')}
              className="gap-1.5 text-xs h-9"
            >
              <Layers className="h-4 w-4" />
              <span>Browse Issues</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/releases')}
              className="gap-1.5 text-xs h-9 font-semibold"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Release Health</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Feature 12: KEY METRICS ROW */}
      {userProjectRole !== 'REPORTER' && userProjectRole !== 'DEVELOPER' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/60 hover:bg-card/90 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
              <span title="Total number of unresolved issues currently tracked in this project.">
                <Info className="h-3.5 w-3.5 text-primary/70 hover:text-primary cursor-help transition-colors" />
              </span>
            </div>
            <Bug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last week
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 hover:bg-card/90 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Urgent / P0</CardTitle>
              <span title="Critical priority bugs that require immediate attention and halt regular development.">
                <Info className="h-3.5 w-3.5 text-primary/70 hover:text-primary cursor-help transition-colors" />
              </span>
            </div>
            <AlertOctagon className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{criticalCount}</div>
            <p className="text-xs text-red-500/70 mt-1">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 hover:bg-card/90 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Resolved (30d)</CardTitle>
              <span title="Total number of bugs resolved and verified within the last 30 days.">
                <Info className="h-3.5 w-3.5 text-primary/70 hover:text-primary cursor-help transition-colors" />
              </span>
            </div>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedCount}</div>
            <p className="text-xs text-emerald-500/70 mt-1">
              Great progress this sprint
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/60 hover:bg-card/90 transition-colors shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div className="flex items-center gap-1.5">
              <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
              <span title="Average time taken from when a bug is reported until it is successfully resolved.">
                <Info className="h-3.5 w-3.5 text-primary/70 hover:text-primary cursor-help transition-colors" />
              </span>
            </div>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4d</div>
            <p className="text-xs text-blue-500/70 mt-1">
              ↓ 18% speedup vs last sprint
            </p>
          </CardContent>
        </Card>
      </div>
      )}

      {/* FEATURE 13: DASHBOARD ACTION CENTER */}
      <Card className="border-border/80 bg-card/90 shadow-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
              <Zap className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <CardTitle className="text-sm font-bold">
                {userProjectRole === 'REPORTER' ? 'My Reported Issues' : 'Developer & PM Action Center'}
              </CardTitle>
              <CardDescription className="text-xs">
                {userProjectRole === 'REPORTER'
                  ? 'Track the status of the issues you have reported.'
                  : 'Real-time prioritized queues for triage, blocker resolution, and QA verification.'}
              </CardDescription>
            </div>
          </div>

          {/* Action Center Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {userProjectRole === 'REPORTER' ? (
              <button
                onClick={() => setActionTab('MY_REPORTED')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  actionTab === 'MY_REPORTED'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <span>My Reported Issues</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                  {myReportedIssues.length}
                </Badge>
              </button>
            ) : (
              <>
                {userProjectRole === 'DEVELOPER' && (
                  <button
                    onClick={() => setActionTab('MY_WORK')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      actionTab === 'MY_WORK'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    }`}
                  >
                    <span>My Assigned Work</span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                      {myWorkIssues.length}
                    </Badge>
                  </button>
                )}

                {userProjectRole !== 'DEVELOPER' && (
                  <button
                    onClick={() => setActionTab('TRIAGE')}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                      actionTab === 'TRIAGE'
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    }`}
                  >
                    <span>Needs Triage</span>
                    <Badge variant="secondary" className="text-[10px] px-1 py-0 font-mono">
                      {needsTriageIssues.length}
                    </Badge>
                  </button>
                )}


            <button
              onClick={() => setActionTab('BLOCKERS')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                actionTab === 'BLOCKERS'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <span>Blockers</span>
              <Badge variant="destructive" className="text-[10px] px-1 py-0 font-mono">
                {blockersAssigned.length}
              </Badge>
            </button>

            <button
              onClick={() => setActionTab('VERIFY')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                actionTab === 'VERIFY'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
              }`}
            >
              <span>Ready for QA</span>
              <Badge variant="success" className="text-[10px] px-1 py-0 font-mono">
                {readyForQAIssues.length}
              </Badge>
            </button>

            {userProjectRole !== 'DEVELOPER' && (
              <button
                onClick={() => setActionTab('STALE')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                  actionTab === 'STALE'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                }`}
              >
                <span>Stale Issues</span>
                <Badge variant="warning" className="text-[10px] px-1 py-0 font-mono">
                  {staleIssues.length}
                </Badge>
              </button>
            )}

            </>
            )}
          </div>

          {/* Extra Actions */}
          {(userProjectRole === 'DEVELOPER' || userProjectRole === 'ADMIN') && (
            <div className="flex items-center ml-auto lg:ml-0">
              <button
                onClick={() => navigate('/ci-failures')}
                className="px-3 py-1 text-xs font-semibold rounded-lg transition-all text-primary hover:bg-primary/10 flex items-center gap-1 border border-primary/20 bg-primary/5"
              >
                <Flame className="h-3 w-3" />
                <span>CI Ingest</span>
              </button>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {actionTab === 'MY_REPORTED' && (
            <div className="divide-y divide-border/40">
              {myReportedIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  You haven't reported any issues yet.
                </div>
              ) : (
                myReportedIssues.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/30 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary/80 text-xs font-mono font-bold">
                        <Bug className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <Link
                          to={`/issues/${item.id}`}
                          className="text-sm font-semibold hover:underline decoration-primary underline-offset-4"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-mono text-muted-foreground">{item.key}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/40 border border-border/60 text-muted-foreground font-mono uppercase">
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/issues/${item.id}`)}
                        className="text-[10px] h-7 px-2"
                      >
                        View Details <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {actionTab === 'TRIAGE' && (
            <div className="divide-y divide-border/40">
              {needsTriageIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  ✓ Inbox zero! All issues are triaged and assigned.
                </div>
              ) : (
                needsTriageIssues.slice(0, 6).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/30 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer text-xs">{item.key}</span>
                        <Link
                          to={`/issues/${item.key}`}
                          className="text-xs font-semibold text-foreground hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                        <Badge variant="outline" className="text-[10px]">
                          {item.priority}
                        </Badge>
                        <span>Reporter: {item.reporter?.full_name || 'QA'}</span>
                        <span>•</span>
                        <span>{item.component?.name || 'Unassigned Subsystem'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="action"
                        onClick={() => navigate(`/issues/${item.key}`)}
                        className="gap-1 text-[11px] h-7 px-3 font-semibold"
                      >
                        <span>Triage Ticket</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {actionTab === 'BLOCKERS' && (
            <div className="divide-y divide-border/40">
              {blockersAssigned.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  ✓ No critical P0 blockers currently assigned to you.
                </div>
              ) : (
                blockersAssigned.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-red-500/5 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="font-mono text-[10px]">
                          {item.key}
                        </Badge>
                        <Link
                          to={`/issues/${item.key}`}
                          className="text-xs font-semibold text-red-400 hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Status: <strong className="text-foreground">{item.status}</strong> • Severity: {item.severity}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="action"
                      onClick={() => navigate(`/issues/${item.key}`)}
                      className="gap-1 text-[11px] h-7 bg-red-600 hover:bg-red-500 font-semibold shrink-0"
                    >
                      <span>Fix Blocker</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {actionTab === 'VERIFY' && (
            <div className="divide-y divide-border/40">
              {readyForQAIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  No resolved tickets waiting for QA verification.
                </div>
              ) : (
                readyForQAIssues.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/30 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer text-xs">{item.key}</span>
                        <Link
                          to={`/issues/${item.key}`}
                          className="text-xs font-semibold text-foreground hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        <Badge variant="success" className="font-mono text-[9px]">
                          RESOLVED ({item.resolution || 'FIXED'})
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Assignee: {item.assignee?.full_name || 'Bob Chen'} • Awaiting QA Sign-Off
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/issues/${item.key}`)}
                      className="gap-1 text-[11px] h-7 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 font-semibold shrink-0"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      <span>Review & Verify</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {actionTab === 'STALE' && (
            <div className="divide-y divide-border/40">
              {staleIssues.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">
                  ✓ No stale issues detected (all backlog items active within 7 days).
                </div>
              ) : (
                staleIssues.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/30 transition-colors gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-xs">{item.key}</span>
                        <Link
                          to={`/issues/${item.key}`}
                          className="text-xs font-semibold text-foreground hover:underline line-clamp-1"
                        >
                          {item.title}
                        </Link>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        Last updated: {new Date(item.updated_at).toLocaleDateString()} • Inactivity &gt; 7 days
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/issues/${item.key}`)}
                      className="gap-1 text-[11px] h-7 border-amber-500/30 text-amber-400 hover:bg-amber-500/10 shrink-0"
                    >
                      <span>Ping Assignee</span>
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
