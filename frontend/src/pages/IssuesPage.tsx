import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useProject } from '../contexts/ProjectContext';
import { CreateIssueModal } from '../components/issues/CreateIssueModal';
import { Issue, IssueStatus, IssuePriority } from '../types';
import { api } from '../lib/api';
import {
  Bug,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  MessageSquare,
  Paperclip,
  GitPullRequest,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const { activeProject } = useProject();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [totalIssues, setTotalIssues] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeProject) params.append('project_id', activeProject.id);
      if (search) params.append('search', search);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);

      const res = await api.get<Issue[]>(`/issues?${params.toString()}`);
      setIssues(res);
      setTotalIssues(res.length);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [activeProject, selectedStatus, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const getStatusBadge = (status: IssueStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="info" className="text-[10px] font-mono">OPEN</Badge>;
      case 'TRIAGED':
        return <Badge variant="purple" className="text-[10px] font-mono">TRIAGED</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="warning" className="text-[10px] font-mono">IN PROGRESS</Badge>;
      case 'IN_REVIEW':
        return <Badge variant="purple" className="text-[10px] font-mono">IN REVIEW</Badge>;
      case 'RESOLVED':
        return <Badge variant="success" className="text-[10px] font-mono">RESOLVED</Badge>;
      case 'VERIFIED':
        return <Badge variant="success" className="text-[10px] font-mono">VERIFIED</Badge>;
      case 'CLOSED':
        return <Badge variant="secondary" className="text-[10px] font-mono">CLOSED</Badge>;
      case 'REOPENED':
        return <Badge variant="destructive" className="text-[10px] font-mono">REOPENED</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-mono">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'P0_CRITICAL':
        return <Badge variant="destructive" className="text-[10px]">P0 CRITICAL</Badge>;
      case 'P1_HIGH':
        return <Badge variant="warning" className="text-[10px]">P1 HIGH</Badge>;
      case 'P2_MEDIUM':
        return <Badge variant="secondary" className="text-[10px]">P2 MEDIUM</Badge>;
      case 'P3_LOW':
        return <Badge variant="outline" className="text-[10px]">P3 LOW</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues & Defect Backlog"
        description={`Track, assign, and resolve issues in ${activeProject?.name || 'current project'}.`}
        badge={
          <Badge variant="purple" className="font-mono text-[11px]">
            {activeProject?.key || '---'}
          </Badge>
        }
      >
        <Button
          variant="glow"
          size="sm"
          onClick={() => setShowModal(true)}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Report Bug</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Input
            placeholder="Search by key, title, description, or environment... (Press Enter)"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="TRIAGED">Triaged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="VERIFIED">Verified</option>
            <option value="CLOSED">Closed</option>
            <option value="REOPENED">Reopened</option>
          </select>

          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All Priorities</option>
            <option value="P0_CRITICAL">P0 Critical</option>
            <option value="P1_HIGH">P1 High</option>
            <option value="P2_MEDIUM">P2 Medium</option>
            <option value="P3_LOW">P3 Low</option>
          </select>
        </div>
      </div>

      {/* Issues Table List */}
      <Card className="border-border/80 bg-card/80">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
              Querying defect records from backend...
            </div>
          ) : issues.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <Bug className="h-10 w-10 text-muted-foreground/50 mx-auto" />
              <h3 className="text-sm font-semibold text-foreground">No defects match your query</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No open issues found matching current filters. Click "Report Bug" to log a new defect.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-secondary/30 transition-all cursor-pointer gap-3"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">
                      <Bug className={`h-4 w-4 ${issue.priority === 'P0_CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-primary group-hover:underline">
                          {issue.key}
                        </span>
                        <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                          {issue.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono flex-wrap">
                        <span>
                          Assignee: <strong className="text-foreground">{issue.assignee?.full_name || 'Unassigned'}</strong>
                        </span>
                        {issue.component && (
                          <>
                            <span>•</span>
                            <span className="text-indigo-300 font-sans">{issue.component.name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Severity: {issue.severity}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                    {getPriorityBadge(issue.priority)}
                    {getStatusBadge(issue.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateIssueModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onIssueCreated={() => {
          fetchIssues();
        }}
      />
    </div>
  );
};
