import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Flame, ExternalLink, ArrowRight, X, Check, Copy } from 'lucide-react';

export interface DuplicateCandidate {
  issue_id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  similarity_score: number;
  reason: string;
}

interface DuplicateResolutionCardProps {
  duplicates: DuplicateCandidate[];
  onOpenExisting: (key: string) => void;
  onMarkAsDuplicate: (key: string) => void;
  onContinueCreating: () => void;
  onCancel: () => void;
}

export const DuplicateResolutionCard: React.FC<DuplicateResolutionCardProps> = ({
  duplicates,
  onOpenExisting,
  onMarkAsDuplicate,
  onContinueCreating,
  onCancel,
}) => {
  if (duplicates.length === 0) return null;

  const top = duplicates[0];

  return (
    <div className="p-4 rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-secondary/20 to-black/40 space-y-3.5 animate-in slide-in-from-top-2 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-amber-500/20 text-amber-400">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-amber-400">
              Potential Duplicate Detected ({top.similarity_score}% Match)
            </span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              Review existing ticket before filing a duplicate
            </span>
          </div>
        </div>

        <Badge variant="outline" className="font-mono text-[10px] border-amber-500/40 text-amber-300">
          2-TIER RADAR ACTIVE
        </Badge>
      </div>

      {/* Duplicate Candidate List */}
      <div className="space-y-2">
        {duplicates.map((d) => (
          <div
            key={d.issue_id}
            className="p-3 rounded-lg bg-black/40 border border-amber-500/20 space-y-2 text-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary">{d.key}</span>
                <span className="font-semibold text-foreground line-clamp-1">{d.title}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 font-mono">
                <Badge variant="outline" className="text-[9px] text-amber-400 border-amber-500/30">
                  {d.similarity_score}% MATCH
                </Badge>
                <Badge variant="secondary" className="text-[9px]">
                  {d.status}
                </Badge>
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground leading-tight">
              <strong>Why:</strong> {d.reason}
            </p>

            {/* Actions for this specific candidate */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenExisting(d.key)}
                className="gap-1 text-[11px] h-6 px-2 border-border/60 hover:text-primary"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open {d.key}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onMarkAsDuplicate(d.key)}
                className="gap-1 text-[11px] h-6 px-2 border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <Copy className="h-3 w-3" />
                <span>Mark as Duplicate of {d.key}</span>
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Dismiss / Continue row */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-border/40">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="text-xs h-7"
        >
          Cancel Creation
        </Button>
        <Button
          type="button"
          variant="glow"
          size="sm"
          onClick={onContinueCreating}
          className="gap-1.5 text-xs h-7 font-semibold"
        >
          <span>Continue Creating Anyway</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
