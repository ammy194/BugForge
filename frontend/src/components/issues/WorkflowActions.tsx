import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Issue, IssueStatus, IssueResolution } from '../../types';
import { api } from '../../lib/api';
import {
  Play,
  CheckCircle2,
  GitPullRequest,
  RotateCcw,
  CheckCheck,
  XCircle,
  X,
  MessageSquare,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface AvailableTransition {
  to: IssueStatus;
  label: string;
  requiresResolution: boolean;
}

import { useProject } from '../../contexts/ProjectContext';

interface WorkflowActionsProps {
  issue: Issue;
  onStatusChanged: (updatedIssue: Issue) => void;
}

export const WorkflowActions: React.FC<WorkflowActionsProps> = ({ issue, onStatusChanged }) => {
  const { userProjectRole } = useProject();

  const [transitions, setTransitions] = useState<AvailableTransition[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTransition, setSelectedTransition] = useState<AvailableTransition | null>(null);
  const [resolution, setResolution] = useState<IssueResolution>('FIXED');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (userProjectRole === 'REPORTER') {
    return null;
  }

  const fetchTransitions = async () => {
    try {
      const list = await api.get<AvailableTransition[]>(`/issues/${issue.id}/transitions`);
      setTransitions(list);
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchTransitions();
  }, [issue.status, issue.id]);

  const handleExecuteTransition = async (toStatus: IssueStatus, resValue?: IssueResolution, note?: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const updated = await api.post<Issue>(`/issues/${issue.id}/transition`, {
        status: toStatus,
        resolution: resValue || null,
        comment: note || null,
      });

      onStatusChanged(updated);
      setSelectedTransition(null);
      setComment('');
      setResolution('FIXED');
    } catch (err: any) {
      const details = err.details ? ` - ${JSON.stringify(err.details)}` : '';
      setError((err.message || 'Transition failed') + details);
    } finally {
      setSubmitting(false);
    }
  };

  const getButtonIcon = (status: IssueStatus) => {
    switch (status) {
      case 'IN_PROGRESS':
        return <Play className="h-3.5 w-3.5" />;
      case 'IN_REVIEW':
        return <GitPullRequest className="h-3.5 w-3.5" />;
      case 'RESOLVED':
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case 'VERIFIED':
        return <CheckCheck className="h-3.5 w-3.5" />;
      case 'CLOSED':
        return <XCircle className="h-3.5 w-3.5" />;
      case 'REOPENED':
        return <RotateCcw className="h-3.5 w-3.5" />;
      default:
        return <ArrowRight className="h-3.5 w-3.5" />;
    }
  };

  const getButtonVariant = (status: IssueStatus) => {
    switch (status) {
      case 'RESOLVED':
      case 'VERIFIED':
        return 'default';
      case 'REOPENED':
        return 'destructive';
      case 'IN_PROGRESS':
      case 'IN_REVIEW':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (transitions.length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground font-mono">
        No workflow actions available for current role.
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {transitions.map((t) => (
        <Button
          key={t.to}
          size="sm"
          variant={getButtonVariant(t.to)}
          onClick={(e) => {
            e.stopPropagation();
            if (t.requiresResolution || t.to === 'RESOLVED') {
              setSelectedTransition(t);
            } else {
              handleExecuteTransition(t.to);
            }
          }}
          disabled={submitting}
          className="gap-1.5 text-xs h-7 px-2.5 font-medium shadow-sm"
        >
          {getButtonIcon(t.to)}
          <span>{t.label}</span>
        </Button>
      ))}
      
      {error && !selectedTransition && (
        <div className="w-full mt-2 rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Transition Dialog for Resolutions / Comments */}
      {selectedTransition && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedTransition(null);
          }}
        >
          <Card 
            className="w-full max-w-md bg-card border-border/80 shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3 shrink-0">
              <div>
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <span>{selectedTransition.label}</span>
                  <Badge variant="default" className="font-mono text-[10px]">
                    {issue.key}
                  </Badge>
                </CardTitle>
                <CardDescription className="text-xs">
                  Transition status from <strong className="text-foreground">{issue.status}</strong> →{' '}
                  <strong className="text-primary">{selectedTransition.to}</strong>.
                </CardDescription>
              </div>
              <button
                onClick={() => setSelectedTransition(null)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4 overflow-y-auto flex-1">
              {error && (
                <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400">
                  {error}
                </div>
              )}

              {selectedTransition.requiresResolution && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Resolution</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value as IssueResolution)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="FIXED">FIXED (Code merged & deployed)</option>
                    <option value="WONT_FIX">WONT_FIX (Working as intended / Out of scope)</option>
                    <option value="DUPLICATE">DUPLICATE (Merged into existing issue)</option>
                    <option value="INVALID">INVALID (Cannot reproduce / False alarm)</option>
                    <option value="CANNOT_REPRODUCE">CANNOT_REPRODUCE (Insufficient repro steps)</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Audit Transition Note (Optional)</label>
                <textarea
                  placeholder="e.g. PR #382 merged, fixes expired coupon validation branch."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-y min-h-[80px]"
                />
              </div>
            </CardContent>

            <div className="flex justify-end gap-2 p-4 pt-3 border-t border-border/60 bg-card/95 shrink-0 rounded-b-xl">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedTransition(null)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="glow"
                size="sm"
                onClick={() => handleExecuteTransition(selectedTransition.to, resolution, comment)}
                disabled={submitting}
                className="gap-1.5"
              >
                {getButtonIcon(selectedTransition.to)}
                <span>{submitting ? 'Executing Transition...' : 'Confirm Transition'}</span>
              </Button>
            </div>
          </Card>
        </div>,
        document.body
      )}
    </div>
  );
};
