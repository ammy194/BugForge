import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { CreateIssueModal } from '../components/issues/CreateIssueModal';
import { KanbanBoard } from '../components/views/KanbanBoard';
import { Issue, IssueStatus, IssuePriority } from '../types';
import { api } from '../lib/api';
import {
  Bug,
  Search,
  Filter,
  Plus,
  LayoutGrid,
  List,
  Bookmark,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface SavedView {
  id: string;
  name: string;
  icon?: string;
  query_filters: any;
  is_shared: boolean;
}

export const IssuesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeProject } = useProject();

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [activeSavedViewId, setActiveSavedViewId] = useState<string>('all');

  const fetchSavedViews = async () => {
    try {
      const views = await api.get<SavedView[]>('/views');
      setSavedViews(views);
    } catch {
      //
    }
  };

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeProject) params.append('project_id', activeProject.id);
      if (search) params.append('search', search);
      if (selectedStatus) params.append('status', selectedStatus);
      if (selectedPriority) params.append('priority', selectedPriority);
      if (selectedAssignee) params.append('assignee_id', selectedAssignee);

      const res = await api.get<Issue[]>(`/issues?${params.toString()}`);
      setIssues(res);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedViews();
  }, [activeProject]);

  useEffect(() => {
    fetchIssues();
  }, [activeProject, selectedStatus, selectedPriority, selectedAssignee]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIssues();
  };

  const handleApplySavedView = (view: SavedView) => {
    setActiveSavedViewId(view.id);
    if (view.query_filters.status) setSelectedStatus(view.query_filters.status);
    else setSelectedStatus('');

    if (view.query_filters.priority) setSelectedPriority(view.query_filters.priority);
    else setSelectedPriority('');

    if (view.query_filters.assignee_id) setSelectedAssignee(view.query_filters.assignee_id);
    else setSelectedAssignee('');
  };

  const handleClearFilters = () => {
    setActiveSavedViewId('all');
    setSelectedStatus('');
    setSelectedPriority('');
    setSelectedAssignee('');
    setSearch('');
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
        title="Issues & Discovery Hub"
        description={`Explore defects via Backlog Table, Agile Kanban Board, and Saved Custom Views.`}
        badge={
          <Badge variant="purple" className="font-mono text-[11px]">
            {activeProject?.key || '---'}
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-secondary/50 rounded-lg p-0.5 border border-border/60">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-1.5 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Report Bug</span>
          </Button>
        </div>
      </PageHeader>

      {/* Saved Views & Quick Filters Ribbon */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-muted-foreground font-semibold shrink-0 flex items-center gap-1">
          <Bookmark className="h-3.5 w-3.5 text-primary" />
          <span>Views:</span>
        </span>

        <button
          onClick={handleClearFilters}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 ${
            activeSavedViewId === 'all'
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
          }`}
        >
          All Issues
        </button>

        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => handleApplySavedView(v)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
              activeSavedViewId === v.id
                ? 'border-purple-500 bg-purple-500/15 text-purple-300'
                : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
            }`}
          >
            {v.name.includes('Critical') && <Flame className="h-3 w-3 text-red-400" />}
            <span>{v.name}</span>
          </button>
        ))}

        {user && (
          <button
            onClick={() => {
              setSelectedAssignee(user.id);
              setActiveSavedViewId('assigned-me');
            }}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 ${
              activeSavedViewId === 'assigned-me'
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
            }`}
          >
            Assigned to Me
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Input
            placeholder="Search by key (ECOM-1042), title, description, or environment... (Press Enter)"
            icon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-xs h-9"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setActiveSavedViewId('custom');
            }}
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
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setActiveSavedViewId('custom');
            }}
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

      {/* Main View Area (List or Kanban) */}
      {viewMode === 'kanban' ? (
        <KanbanBoard issues={issues} />
      ) : (
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">
                Querying defect records from backend...
              </div>
            ) : issues.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Bug className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <h3 className="text-sm font-semibold text-foreground">No defects match your view filter</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Try clearing your search query or selecting "All Issues" view above.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {issues.map((issue) => (
                  <div
                    key={issue.id}
                    className="group flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-secondary/30 transition-all cursor-pointer gap-3"
                    onClick={() => navigate(`/issues/${issue.key}`)}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-0.5">
                        <Bug className={`h-4 w-4 ${issue.priority === 'P0_CRITICAL' ? 'text-red-400' : 'text-amber-400'}`} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to={`/issues/${issue.key}`}
                            className="font-mono text-xs font-bold text-primary group-hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {issue.key}
                          </Link>
                          <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {issue.title}
                          </span>
                          {issue.resolution && (
                            <Badge variant="purple" className="text-[9px] font-mono px-1 py-0">
                              {issue.resolution}
                            </Badge>
                          )}
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
      )}

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
