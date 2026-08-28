import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';
import { WorkflowActions } from '../components/issues/WorkflowActions';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Issue, IssueStatus, IssuePriority, IssueSeverity, ProjectMember, Component } from '../types';
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

interface GitLink {
  id: string;
  link_type: 'COMMIT' | 'PR' | 'BRANCH' | 'CI_RUN';
  external_id: string;
  title: string;
  url: string;
  author?: string;
  status?: string;
  metadata?: any;
  created_at: string;
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

  const fetchIssueData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const issueData = await api.get<Issue>(`/issues/${id}`);
      setIssue(issueData);

      const [timelineData, gitLinksData, mList, cList] = await Promise.all([
        api.get<TimelineEvent[]>(`/issues/${id}/timeline`),
        api.get<GitLink[]>(`/issues/${id}/git-links`),
        getProjectMembers(issueData.project_id),
        getProjectComponents(issueData.project_id),
      ]);

      setTimeline(timelineData);
      setGitLinks(gitLinksData);
      setMembers(mList);
      setComponents(cList);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssueData();
  }, [id]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !id) return;

    setSubmittingComment(true);
    try {
      await api.post(`/issues/${id}/comments`, { content: commentText });
      setCommentText('');
      // Refresh timeline
      const updatedTimeline = await api.get<TimelineEvent[]>(`/issues/${id}/timeline`);
      setTimeline(updatedTimeline);
    } catch {
      //
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleAttributeChange = async (field: string, value: any) => {
    if (!id) return;
    try {
      const updated = await api.patch<Issue>(`/issues/${id}`, { [field]: value });
      setIssue(updated);
      const updatedTimeline = await api.get<TimelineEvent[]>(`/issues/${id}/timeline`);
      setTimeline(updatedTimeline);
    } catch {
      //
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-xs text-muted-foreground animate-pulse">
        Loading issue details and telemetry...
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-20 text-center space-y-3">
        <Bug className="h-10 w-10 text-muted-foreground mx-auto" />
        <h2 className="text-base font-bold text-foreground">Defect Not Found</h2>
        <p className="text-xs text-muted-foreground">The requested issue ID does not exist or has been removed.</p>
        <Button size="sm" variant="outline" onClick={() => navigate('/issues')}>
          Back to Issues
        </Button>
      </div>
    );
  }

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'CREATED':
        return <Bug className="h-3.5 w-3.5 text-primary" />;
      case 'STATUS_CHANGE':
        return <RotateCcw className="h-3.5 w-3.5 text-purple-400" />;
      case 'ASSIGNMENT_CHANGE':
        return <User className="h-3.5 w-3.5 text-indigo-400" />;
      case 'COMMENT':
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />;
      case 'GIT_LINK':
        return <GitPullRequest className="h-3.5 w-3.5 text-cyan-400" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header & Breadcrumbs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
            <Link to="/issues" className="hover:text-foreground flex items-center gap-1">
              <ArrowLeft className="h-3 w-3" />
              <span>Issues</span>
            </Link>
            <span>/</span>
            <span className="text-foreground font-bold">{issue.key}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={isWatching ? 'secondary' : 'outline'}
              onClick={() => {
                setIsWatching(!isWatching);
                setWatchersCount((prev) => (isWatching ? prev - 1 : prev + 1));
              }}
              className="gap-1.5 text-xs h-8"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{isWatching ? 'Watching' : 'Watch'} ({watchersCount})</span>
            </Button>
          </div>
        </div>

        {/* Issue Title & Status Badges */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="purple" className="font-mono text-xs font-bold">
                {issue.key}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {issue.issue_type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {issue.severity}
              </Badge>
              <Badge variant={issue.priority === 'P0_CRITICAL' ? 'destructive' : 'warning'} className="text-xs">
                {issue.priority}
              </Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">
              {issue.title}
            </h1>
          </div>

          {/* Workflow Action Bar */}
          <div className="shrink-0 flex items-center gap-2 bg-secondary/30 p-2 rounded-lg border border-border/60">
            <span className="text-[11px] font-semibold text-muted-foreground px-1">Status:</span>
            <Badge variant="purple" className="font-mono text-xs font-bold">
              {issue.status}
              {issue.resolution ? ` (${issue.resolution})` : ''}
            </Badge>
            <div className="h-4 w-px bg-border mx-1" />
            <WorkflowActions
              issue={issue}
              onStatusChanged={(updated) => {
                setIssue(updated);
                api.get<TimelineEvent[]>(`/issues/${id}/timeline`).then(setTimeline);
              }}
            />
          </div>
        </div>
      </div>

      {/* Two Column Layout: Main Content vs Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Main Column (2 spans) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold">Overview & Description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-foreground leading-relaxed">
              <p className="whitespace-pre-wrap">{issue.description}</p>

              {/* Repro Steps */}
              {issue.repro_steps && (
                <div className="p-3 rounded-lg bg-secondary/40 border border-border/50 space-y-1.5">
                  <span className="font-semibold text-primary flex items-center gap-1.5">
                    <Bug className="h-3.5 w-3.5" />
                    <span>Steps to Reproduce:</span>
                  </span>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap text-foreground/90 p-2 rounded bg-black/30">
                    {issue.repro_steps}
                  </pre>
                </div>
              )}

              {/* Expected vs Actual */}
              {(issue.expected_behavior || issue.actual_behavior) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {issue.expected_behavior && (
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 text-xs">
                      <span className="font-semibold text-emerald-400 block mb-1">Expected:</span>
                      <span className="text-muted-foreground">{issue.expected_behavior}</span>
                    </div>
                  )}
                  {issue.actual_behavior && (
                    <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/5 text-xs">
                      <span className="font-semibold text-red-400 block mb-1">Actual:</span>
                      <span className="text-muted-foreground">{issue.actual_behavior}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Environment */}
              {issue.environment && (
                <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                  <span className="font-semibold text-foreground">Environment:</span>
                  <span>{issue.environment}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unified Activity Timeline */}
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

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">
                            {event.actor?.full_name || 'System Automation'}
                          </span>
                          <span className="text-muted-foreground">{event.title}</span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {event.description && (
                          <div className="p-3 rounded-md bg-secondary/40 border border-border/40 text-foreground font-sans mt-1">
                            <p className="whitespace-pre-wrap">{event.description}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Comment Composer */}
                <form onSubmit={handlePostComment} className="pt-4 border-t border-border/60 space-y-3">
                  <div className="flex items-center gap-2">
                    <Avatar fallback={user?.full_name || 'User'} size="sm" />
                    <span className="text-xs font-semibold text-foreground">Leave a Comment / Technical Note</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">Supports @mentions & markdown</span>
                  </div>

                  <textarea
                    placeholder="Type your comment... Mention teammates with @Bob Chen"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    rows={3}
                    className="w-full rounded-md border border-input bg-secondary/40 p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  />

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      variant="glow"
                      size="sm"
                      disabled={submittingComment || !commentText.trim()}
                      className="gap-1.5"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{submittingComment ? 'Posting...' : 'Post Comment'}</span>
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

          {/* Related Development (Commits, PRs, CI) */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Related Development
              </CardTitle>
              <GitPullRequest className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              {gitLinks.length === 0 ? (
                <div className="text-[11px] text-muted-foreground">No linked git branches or pull requests yet.</div>
              ) : (
                gitLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block p-2.5 rounded-md border border-border/60 bg-secondary/30 hover:bg-secondary/60 transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-primary">
                        {link.link_type === 'PR' && <GitPullRequest className="h-3 w-3" />}
                        {link.link_type === 'COMMIT' && <GitCommit className="h-3 w-3" />}
                        {link.link_type === 'BRANCH' && <GitBranch className="h-3 w-3" />}
                        {link.link_type === 'CI_RUN' && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                        <span>{link.external_id}</span>
                      </div>
                      {link.status && (
                        <Badge variant="outline" className="text-[9px] font-mono px-1 py-0">
                          {link.status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{link.title}</p>
                  </a>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
