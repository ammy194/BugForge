import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Avatar } from '../ui/avatar';
import { Issue, IssueStatus, IssuePriority } from '../../types';
import { Bug, Sparkles, MessageSquare, AlertCircle, ArrowRight } from 'lucide-react';

interface KanbanBoardProps {
  issues: Issue[];
  onStatusDrop?: (issueId: string, newStatus: IssueStatus) => void;
}

const COLUMNS: { status: IssueStatus; label: string; color: string }[] = [
  { status: 'OPEN', label: 'Open Backlog', color: 'border-blue-500/40 text-blue-400' },
  { status: 'TRIAGED', label: 'Triaged', color: 'border-purple-500/40 text-purple-400' },
  { status: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-500/40 text-amber-400' },
  { status: 'IN_REVIEW', label: 'In Review', color: 'border-indigo-500/40 text-indigo-400' },
  { status: 'RESOLVED', label: 'Resolved (QA)', color: 'border-emerald-500/40 text-emerald-400' },
  { status: 'CLOSED', label: 'Closed', color: 'border-zinc-500/40 text-zinc-400' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ issues, onStatusDrop }) => {
  const navigate = useNavigate();

  const getPriorityBadge = (priority: IssuePriority) => {
    switch (priority) {
      case 'P0_CRITICAL':
        return <Badge variant="destructive" className="text-[9px] px-1 py-0 font-bold">P0</Badge>;
      case 'P1_HIGH':
        return <Badge variant="warning" className="text-[9px] px-1 py-0">P1</Badge>;
      case 'P2_MEDIUM':
        return <Badge variant="secondary" className="text-[9px] px-1 py-0">P2</Badge>;
      case 'P3_LOW':
        return <Badge variant="outline" className="text-[9px] px-1 py-0">P3</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
      {COLUMNS.map((col) => {
        const colIssues = issues.filter((i) => i.status === col.status);

        return (
          <div
            key={col.status}
            className="flex flex-col rounded-xl border border-border/70 bg-card/50 p-3 min-h-[480px] shadow-sm backdrop-blur-sm"
          >
            {/* Column Header */}
            <div className={`flex items-center justify-between pb-3 mb-3 border-b border-border/60 ${col.color}`}>
              <div className="flex items-center gap-1.5 font-bold text-xs">
                <span>{col.label}</span>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px] px-1.5 py-0">
                {colIssues.length}
              </Badge>
            </div>

            {/* Cards List */}
            <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
              {colIssues.length === 0 ? (
                <div className="h-24 flex items-center justify-center border border-dashed border-border/40 rounded-lg text-[11px] text-muted-foreground/60">
                  No issues
                </div>
              ) : (
                colIssues.map((issue) => (
                  <div
                    key={issue.id}
                    onClick={() => navigate(`/issues/${issue.key}`)}
                    className="group p-3 rounded-lg border border-border/60 bg-secondary/30 hover:bg-secondary/70 hover:border-primary/50 transition-all cursor-pointer shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-primary group-hover:underline">
                        {issue.key}
                      </span>
                      {getPriorityBadge(issue.priority)}
                    </div>

                    <p className="text-xs font-medium text-foreground line-clamp-2 leading-snug">
                      {issue.title}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        {issue.component && (
                          <span className="text-indigo-300 font-medium">{issue.component.name}</span>
                        )}
                      </div>

                      <Avatar
                        fallback={issue.assignee?.full_name || 'U'}
                        size="sm"
                        className="h-5 w-5 text-[9px]"
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
