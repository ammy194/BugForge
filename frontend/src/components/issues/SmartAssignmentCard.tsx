import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { UserCheck, Check, Sparkles, ArrowRight, Shield } from 'lucide-react';

export interface AssigneeCandidate {
  user_id: string;
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  score: number;
  reasons: string[];
  open_issues: number;
  open_critical_issues: number;
}

export interface SmartAssignmentData {
  suggested_user_id: string;
  suggested_name: string;
  suggested_email: string;
  avatar_url?: string;
  confidence_score: number;
  reasons: string[];
  candidates: AssigneeCandidate[];
}

interface SmartAssignmentCardProps {
  assignmentData: SmartAssignmentData | null;
  currentAssigneeId?: string;
  onConfirmAssignee: (userId: string) => void;
  onDismiss?: () => void;
}

export const SmartAssignmentCard: React.FC<SmartAssignmentCardProps> = ({
  assignmentData,
  currentAssigneeId,
  onConfirmAssignee,
  onDismiss,
}) => {
  if (!assignmentData) return null;

  const isAlreadyAssigned = currentAssigneeId === assignmentData.suggested_user_id;

  return (
    <div className="p-3 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-indigo-950/20 via-secondary/20 to-black/30 space-y-2.5 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
            <UserCheck className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400">AI Recommended Assignee: {assignmentData.suggested_name}</span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              AI-driven analysis based on workload and expertise
            </span>
          </div>
        </div>

        <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/20 text-emerald-400">
          {assignmentData.confidence_score}% CONFIDENCE
        </Badge>
      </div>

      {/* Suggested Engineer Details */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2.5 rounded-lg bg-black/40 border border-primary/20">
        <div className="flex items-center gap-2.5">
          <Avatar fallback={assignmentData.suggested_name} size="sm" />
          <div>
            <span className="text-xs font-bold text-foreground block">{assignmentData.suggested_name}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{assignmentData.suggested_email}</span>
          </div>
        </div>

        <div className="shrink-0">
          {isAlreadyAssigned ? (
            <Badge variant="success" className="text-[10px] font-mono gap-1">
              <Check className="h-3 w-3" />
              <span>ASSIGNED</span>
            </Badge>
          ) : (
            <Button
              type="button"
              variant="glow"
              size="sm"
              onClick={() => onConfirmAssignee(assignmentData.suggested_user_id)}
              className="gap-1.5 text-[11px] h-7 font-semibold bg-primary text-emerald-400-foreground hover:bg-primary shadow-sm"
            >
              <Check className="h-3 w-3" />
              <span>Assign to {assignmentData.suggested_name.split(' ')[0]}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Reason Bullets */}
      <div className="space-y-1 pt-1">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase block font-mono">
          Why this engineer?
        </span>
        <div className="space-y-0.5">
          {assignmentData.reasons.map((r, idx) => (
            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="text-emerald-400 font-bold">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
