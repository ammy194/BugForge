import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { WorkflowActions } from '../components/issues/WorkflowActions';
import { GitHubActivityPanel } from '../components/issues/GitHubActivityPanel';
import { useRealtimeIssue } from '../hooks/useRealtimeIssue';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Issue, IssueStatus, IssuePriority, IssueSeverity, ProjectMember, Component, GitLink } from '../types';
import { api } from '../lib/api';
import {
  Bug,
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Layers,
  GitPullRequest,
  GitCommit,
  GitBranch,
  CheckCircle2,
  XCircle,
  Eye,
  Send,
  Sparkles,
  Paperclip,
  Share2,
  MessageSquare,
  AlertCircle,
  Play,
  RotateCcw,
  Wand2,
  Code2,
  Check,
  Flame,
  Radio,
  Users,
  RefreshCw,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: string;
  title: string;
  description?: string;
  old_value?: string | null;
  new_value?: string | null;
  actor?: any;
  created_at: string;
  metadata?: any;
}

interface RootCauseResult {
  root_cause: string;
  suspected_file: string;
  suspected_line?: number;
  explanation: string;
  suggested_fix_diff: string;
  prevention_tips: string[];
  ai_provider: string;
}

export const IssueDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getProjectMembers, getProjectComponents } = useProject();

  const [issue, setIssue] = useState<Issue | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [gitLinks, setGitLinks] = useState<GitLink[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isWatching, setIsWatching] = useState(true);
  const [watchersCount, setWatchersCount] = useState(4);

  // AI Root Cause State
  const [rootCause, setRootCause] = useState<RootCauseResult | null>(null);
  const [analyzingRootCause, setAnalyzingRootCause] = useState(false);
  const [copiedPatch, setCopiedPatch] = useState(false);

  // Realtime Hook
  const {
    activeViewers,
    typingUsers,
    conflictWarning,
    sendTypingNotification,
    dismissConflict,
  } = useRealtimeIssue({
    issueId: issue?.id || id || '',
    initialIssue: issue,
    onCommentReceived: (newComment) => {
      fetchTimeline();
    },
    onIssueUpdated: (updatedIssue) => {
      setIssue(updatedIssue);
      fetchTimeline();
    },
  });

  const fetchIssueData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const issueData = await api.get<Issue>(`/issues/${id}`);
      setIssue(issueData);

      if (issueData.project_id) {
        const [m, c] = await Promise.all([
          getProjectMembers(issueData.project_id),
          getProjectComponents(issueData.project_id),
        ]);
        setMembers(m);
        setComponents(c);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeline = async () => {
    if (!id) return;
    try {
      const events = await api.get<TimelineEvent[]>(`/issues/${id}/timeline`);
      setTimeline(events);
    } catch {
      //
    }
  };

  const fetchGitLinks = async () => {
    if (!id) return;
    try {
      const links = await api.get<GitLink[]>(`/issues/${id}/git-links`);
      setGitLinks(links);
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchIssueData();
    fetchTimeline();
    fetchGitLinks();
  }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    setSubmittingComment(true);
    try {
      await api.post(`/issues/${issue.id}/comments`, { body: commentText });
      setCommentText('');
      await fetchTimeline();
    } catch {
      //
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAttributeChange = async (field: string, value: any) => {
    if (!issue) return;
    try {
      const updated = await api.patch<Issue>(`/issues/${issue.id}`, { [field]: value });
      setIssue(updated);
      await fetchTimeline();
    } catch {
      //
    }
  };

  const handleAnalyzeRootCause = async () => {
    if (!issue) return;
    setAnalyzingRootCause(true);
    try {
      const res = await api.post<RootCauseResult>('/ai/root-cause', {
        title: issue.title,
        description: issue.description,
        stack_trace: issue.actual_behavior || '',
      });
      setRootCause(res);
    } catch {
      //
    } finally {
      setAnalyzingRootCause(false);
    }
  };

  const handleCopyPatch = () => {
    if (!rootCause) return;
    navigator.clipboard.writeText(rootCause.suggested_fix_diff);
    setCopiedPatch(true);
    setTimeout(() => setCopiedPatch(false), 2000);
  };

  const handleToggleWatch = async () => {
    if (!issue) return;
    try {
      if (isWatching) {
        await api.delete(`/issues/${issue.id}/watch`);
        setIsWatching(false);
        setWatchersCount((prev) => Math.max(0, prev - 1));
      } else {
        await api.post(`/issues/${issue.id}/watch`, {});
        setIsWatching(true);
        setWatchersCount((prev) => prev + 1);
      }
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground font-mono animate-pulse">
        Loading ticket, diagnostic telemetry, and realtime channel...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="p-12 text-center space-y-4">
        <Bug className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold text-foreground">Defect Ticket Not Found</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/issues')}>
          Return to Issues
        </Button>
      </div>
    );
  }

  const getPriorityBadge = (p: IssuePriority) => {
    switch (p) {
      case 'P0_CRITICAL':
        return <Badge variant="destructive" className="font-mono text-xs">P0 CRITICAL</Badge>;
      case 'P1_HIGH':
        return <Badge variant="warning" className="font-mono text-xs">P1 HIGH</Badge>;
      case 'P2_MEDIUM':
        return <Badge variant="secondary" className="font-mono text-xs">P2 MEDIUM</Badge>;
      default:
        return <Badge variant="outline" className="font-mono text-xs">P3 LOW</Badge>;
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'TRANSITION':
        return <Play className="h-3.5 w-3.5 text-primary" />;
      case 'COMMENT':
        return <MessageSquare className="h-3.5 w-3.5 text-primary" />;
      case 'GIT_COMMIT':
        return <GitCommit className="h-3.5 w-3.5 text-emerald-400" />;
      case 'GIT_PR':
        return <GitPullRequest className="h-3.5 w-3.5 text-primary" />;
      case 'CI_FAILURE':
        return <Flame className="h-3.5 w-3.5 text-red-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Non-intrusive Conflict Banner */}
      {conflictWarning && (
        <div className="flex items-center justify-between p-3 rounded-xl border border-amber-500/40 bg-amber-500/10 text-xs text-amber-300 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 font-medium">
            <Radio className="h-4 w-4 text-amber-400 animate-pulse" />
            <span>{conflictWarning}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                fetchIssueData();
                fetchTimeline();
                dismissConflict();
              }}
              className="gap-1 text-[11px] h-6 px-2.5 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Sync Changes</span>
            </Button>
            <button
              onClick={dismissConflict}
              className="text-amber-400 hover:text-amber-200 font-bold px-1.5"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Top Breadcrumbs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/issues')}
            className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Issues</span>
          </Button>
          <span className="text-muted-foreground/40 font-mono">/</span>
          <span className="font-mono text-xs font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer">{issue.key}</span>
        </div>

        {/* Realtime Presence Viewers & Watchers */}
        <div className="flex items-center gap-3">
          {/* Active Viewers Indicator */}
          {activeViewers.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300 font-mono">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{activeViewers.length} viewing</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleWatch}
            className={`gap-1.5 text-xs h-8 ${isWatching ? 'text-primary border-primary/40 bg-primary/10' : 'text-muted-foreground'}`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>{isWatching ? 'Watching' : 'Watch'}</span>
            <Badge variant="secondary" className="font-mono text-[10px] px-1 py-0 ml-0.5">
              {watchersCount}
            </Badge>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleAnalyzeRootCause}
            disabled={analyzingRootCause}
            className="gap-1.5 text-xs h-8 border-primary/40 text-primary hover:bg-primary/10 shadow-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>{analyzingRootCause ? 'Diagnosing...' : 'AI Root Cause'}</span>
          </Button>
        </div>
      </div>

      {/* Main Issue Header Card */}
      <Card className="border-border/80 bg-card/90 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default" className="font-mono text-xs">
              {issue.key}
            </Badge>
            <Badge variant="secondary" className="text-xs font-semibold">
              {issue.issue_type}
            </Badge>
            {getPriorityBadge(issue.priority)}
            <Badge variant="outline" className="text-xs">
              {issue.severity}
            </Badge>
            {issue.resolution && (
              <Badge variant="success" className="font-mono text-xs font-bold">
                RESOLVED: {issue.resolution}
              </Badge>
            )}
          </div>

          <h1 className="text-xl font-bold tracking-tight text-foreground">{issue.title}</h1>

          {/* Workflow Transitions Engine Bar */}
          <div className="pt-2 border-t border-border/60">
            <WorkflowActions
              issue={issue}
              onStatusChanged={(updated) => {
                setIssue(updated);
                fetchTimeline();
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description & Repro Steps Card */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Technical Context & Reproduction
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div>
                <span className="font-semibold text-foreground block mb-1">Description:</span>
                <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {issue.description}
                </p>
              </div>

              {issue.repro_steps && (
                <div className="p-3 rounded-lg bg-black/40 border border-border/60 space-y-1">
                  <span className="font-semibold text-foreground block font-mono text-[11px]">
                    Steps to Reproduce:
                  </span>
                  <p className="text-muted-foreground font-mono whitespace-pre-wrap text-[11px] leading-relaxed">
                    {issue.repro_steps}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/60">
                {issue.expected_behavior && (
                  <div className="p-2.5 rounded bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                    <span className="font-semibold text-emerald-400 block text-[11px]">
                      Expected Outcome:
                    </span>
                    <p className="text-muted-foreground text-[11px]">{issue.expected_behavior}</p>
                  </div>
                )}

                {issue.actual_behavior && (
                  <div className="p-2.5 rounded bg-red-500/5 border border-red-500/10 space-y-1">
                    <span className="font-semibold text-red-400 block text-[11px]">
                      Actual Failure:
                    </span>
                    <p className="text-muted-foreground text-[11px]">{issue.actual_behavior}</p>
                  </div>
                )}
              </div>

              {issue.environment && (
                <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-foreground">Environment:</span>
                  <span>{issue.environment}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Root Cause & Code Patch Diagnosis Card */}
          {rootCause && (
            <Card className="border-primary/40 bg-primary/10 animate-in fade-in">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wand2 className="h-4 w-4 text-primary" />
                  <CardTitle className="text-xs font-bold text-primary">
                    Grok AI Root Cause Analysis & Git Diff Patch
                  </CardTitle>
                </div>
                <Badge variant="default" className="text-[10px] font-mono">
                  {rootCause.ai_provider}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div>
                  <span className="font-semibold text-foreground block mb-1">Culprit Source:</span>
                  <span className="font-mono text-xs text-primary bg-black/40 px-2 py-1 rounded">
                    {rootCause.suspected_file}:{rootCause.suspected_line}
                  </span>
                </div>

                <div>
                  <span className="font-semibold text-foreground block mb-1">Diagnosis:</span>
                  <p className="text-muted-foreground leading-relaxed">{rootCause.explanation}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-foreground flex items-center gap-1">
                      <Code2 className="h-3.5 w-3.5 text-primary" />
                      <span>Suggested Code Patch (Unified Diff):</span>
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCopyPatch}
                      className="text-[11px] h-6 px-2 gap-1 border-primary/30"
                    >
                      {copiedPatch ? <Check className="h-3 w-3 text-emerald-400" /> : <Code2 className="h-3 w-3" />}
                      <span>{copiedPatch ? 'Copied Diff!' : 'Copy Patch'}</span>
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-black/50 border border-border/60 font-mono text-[11px] overflow-x-auto text-emerald-400/90 whitespace-pre">
                    {rootCause.suggested_fix_diff}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unified Activity & Collaboration Timeline */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span>Activity & Collaboration History</span>
              </h2>
              <span className="text-[11px] text-muted-foreground font-mono">
                {timeline.length} events logged
              </span>
            </div>

            <Card className="border-border/80 bg-card/80">
              <CardContent className="p-6 space-y-6">
                {/* Timeline Stream */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border/60">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative flex items-start gap-3 text-xs">
                      <div className="absolute -left-6 mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card border border-border">
                        {getTimelineIcon(event.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-foreground">{event.title}</span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-muted-foreground text-xs">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Live Typing Indicator */}
                {typingUsers.length > 0 && (
                  <div className="text-[11px] text-primary font-mono flex items-center gap-2 animate-pulse pt-2 border-t border-border/40">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    <span>{typingUsers.join(', ')} is typing a comment...</span>
                  </div>
                )}

                {/* Comment Box */}
                <form onSubmit={handleAddComment} className="pt-4 border-t border-border/60 space-y-3">
                  <textarea
                    placeholder="Add a comment or @mention an engineer (e.g. @bob)..."
                    value={commentText}
                    onChange={(e) => {
                      setCommentText(e.target.value);
                      sendTypingNotification();
                    }}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-secondary/40 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Markdown supported & live synced
                    </span>
                    <Button
                      type="submit"
                      variant="glow"
                      size="sm"
                      disabled={submittingComment || !commentText.trim()}
                      className="gap-1.5 text-xs font-semibold"
                    >
                      <Send className="h-3 w-3" />
                      <span>{submittingComment ? 'Posting...' : 'Comment'}</span>
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar (1 span) */}
        <div className="space-y-6">
          {/* Metadata Attributes Card */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Issue Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Assignee</label>
                <select
                  value={issue.assignee_id || ''}
                  onChange={(e) => handleAttributeChange('assignee_id', e.target.value || null)}
                  className="w-full h-8 rounded border border-input bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Unassigned --</option>
                  {members.map((m) => (
                    <option key={m.user_id} value={m.user_id}>
                      {m.user?.full_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Reporter */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Reporter</label>
                <div className="flex items-center gap-2 p-1.5 rounded bg-secondary/30">
                  <Avatar fallback={issue.reporter?.full_name || 'QA'} size="sm" />
                  <span className="font-semibold text-foreground">{issue.reporter?.full_name || 'Elena Rostova'}</span>
                </div>
              </div>

              {/* Component */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Subsystem Component</label>
                <select
                  value={issue.component_id || ''}
                  onChange={(e) => handleAttributeChange('component_id', e.target.value || null)}
                  className="w-full h-8 rounded border border-input bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- None --</option>
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Priority</label>
                <select
                  value={issue.priority}
                  onChange={(e) => handleAttributeChange('priority', e.target.value)}
                  className="w-full h-8 rounded border border-input bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="P0_CRITICAL">P0 Critical</option>
                  <option value="P1_HIGH">P1 High</option>
                  <option value="P2_MEDIUM">P2 Medium</option>
                  <option value="P3_LOW">P3 Low</option>
                </select>
              </div>

              {/* Target Release */}
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-muted-foreground">Target Release</label>
                <div className="p-2 rounded bg-secondary/30 text-foreground font-mono text-xs">
                  {issue.version?.name || 'v2.4.0 (Stabilizing)'}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* GitHub Activity & Development Panel */}
          <GitHubActivityPanel
            issue={issue}
            gitLinks={gitLinks}
            onGitLinkAdded={fetchGitLinks}
          />
        </div>
      </div>
    </div>
  );
};
