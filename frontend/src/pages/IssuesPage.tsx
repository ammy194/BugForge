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
  Wand2,
  X,
  Radio,
  Check,
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

  // Natural Language Search State
  const [showNlSearch, setShowNlSearch] = useState(false);
  const [nlQuery, setNlQuery] = useState('');
  const [nlParsing, setNlParsing] = useState(false);
  const [nlExplanation, setNlExplanation] = useState<string | null>(null);

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

  const handleNlSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlQuery.trim()) return;
    setNlParsing(true);
    try {
      const res = await api.post<any>('/ai/nl-query', { query: nlQuery });
      const f = res.structured_filters || res.filters || {};

      if (f.priority) setSelectedPriority(Array.isArray(f.priority) ? f.priority[0] : f.priority);
      if (f.status) setSelectedStatus(Array.isArray(f.status) ? f.status[0] : f.status);
      if (f.search) setSearch(f.search);
      setNlExplanation(res.explanation || `Filtered by: "${nlQuery}"`);
    } catch {
      //
    } finally {
      setNlParsing(false);
    }
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
    setNlExplanation(null);
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
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Issues & Discovery Hub"
        description="Filter defects via Backlog Table, Agile Kanban Board, and Saved Custom Views."
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
            variant="outline"
            size="sm"
            onClick={() => setShowNlSearch(!showNlSearch)}
            className={`gap-1.5 text-xs h-9 border-purple-500/40 text-purple-300 ${
              showNlSearch ? 'bg-purple-950/40' : 'hover:bg-purple-950/20'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>AI Natural Search</span>
          </Button>

          <Button
            variant="glow"
            size="sm"
            onClick={() => setShowModal(true)}
            className="gap-1.5 text-xs h-9 font-semibold"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Report Bug</span>
          </Button>
        </div>
      </PageHeader>

      {/* AI Natural Language Query Expansion Drawer */}
      {showNlSearch && (
        <Card className="border-purple-500/40 bg-purple-950/20 p-4 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <Wand2 className="h-4 w-4" />
              <span>Search with Natural Language (Grok AI)</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">
              e.g. "Show all open critical checkout bugs assigned to Bob"
            </span>
          </div>

          <form onSubmit={handleNlSearch} className="flex gap-2">
            <Input
              placeholder="e.g. Show all open critical checkout bugs assigned to Bob..."
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              className="text-xs h-9 font-medium border-purple-500/30 bg-black/40"
            />
            <Button
              type="submit"
              variant="glow"
              size="sm"
              disabled={nlParsing || !nlQuery.trim()}
              className="gap-1 text-xs h-9 font-semibold shrink-0 bg-purple-600 hover:bg-purple-500"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>{nlParsing ? 'Parsing...' : 'Filter'}</span>
            </Button>
          </form>
        </Card>
      )}

      {/* AI Filter Applied Notice */}
      {nlExplanation && (
        <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-xs text-purple-300">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span><strong>Active AI Filter:</strong> {nlExplanation}</span>
          </div>
          <button
            onClick={handleClearFilters}
            className="text-[11px] font-semibold text-purple-400 hover:text-purple-200 underline"
          >
            Clear AI Filters
          </button>
        </div>
      )}

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
              ? 'border-primary bg-primary/15 text-primary font-bold'
              : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
          }`}
        >
          All Issues
        </button>

        {/* Quick Filter: P0 Criticals */}
        <button
          onClick={() => {
            setSelectedPriority('P0_CRITICAL');
            setSelectedStatus('');
            setActiveSavedViewId('p0-critical');
          }}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
            activeSavedViewId === 'p0-critical'
              ? 'border-red-500 bg-red-500/20 text-red-300 font-bold'
              : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
          }`}
        >
          <Flame className="h-3 w-3 text-red-400" />
          <span>P0 Criticals</span>
        </button>

        {/* Quick Filter: Needs QA Verification */}
        <button
          onClick={() => {
            setSelectedStatus('RESOLVED');
            setSelectedPriority('');
            setActiveSavedViewId('needs-qa');
          }}
          className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
            activeSavedViewId === 'needs-qa'
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
              : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
          }`}
        >
          <CheckCircle2 className="h-3 w-3 text-emerald-400" />
          <span>Needs QA Verification</span>
        </button>

        {savedViews.map((v) => (
          <button
            key={v.id}
            onClick={() => handleApplySavedView(v)}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all shrink-0 flex items-center gap-1 ${
              activeSavedViewId === v.id
                ? 'border-purple-500 bg-purple-500/15 text-purple-300 font-bold'
                : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
            }`}
          >
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
                ? 'border-primary bg-primary/15 text-primary font-bold'
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
              <div className="py-12 text-center text-xs text-muted-foreground animate-pulse font-mono">
                Querying defect records from backend...
              </div>
            ) : issues.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Bug className="h-10 w-10 text-muted-foreground/50 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-foreground">No matching issues found</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Try adjusting your filters or search query to find relevant issues.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/60 bg-secondary/20 text-muted-foreground font-semibold">
                      <th className="py-3 px-4">Key</th>
                      <th className="py-3 px-4">Summary</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Severity</th>
                      <th className="py-3 px-4">Assignee</th>
                      <th className="py-3 px-4">Component</th>
                      <th className="py-3 px-4 text-right">Updated</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40 font-normal">
                    {issues.map((issue) => (
                      <tr
                        key={issue.id}
                        onClick={() => navigate(`/issues/${issue.key}`)}
                        className="hover:bg-secondary/40 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                          {issue.key}
                        </td>
                        <td className="py-3 px-4 font-medium text-foreground max-w-md truncate">
                          {issue.title}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">{getStatusBadge(issue.status)}</td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getPriorityBadge(issue.priority)}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-mono text-muted-foreground text-[11px]">
                            {issue.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-foreground text-[11px]">
                            {issue.assignee?.full_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="text-muted-foreground text-[11px]">
                            {issue.component?.name || '---'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-muted-foreground text-[11px] whitespace-nowrap">
                          {new Date(issue.updated_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create Issue Modal */}
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
