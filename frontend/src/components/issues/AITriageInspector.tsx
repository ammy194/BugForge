import React from 'react';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Sparkles, Check, X, AlertTriangle, Wand2, ArrowRight } from 'lucide-react';
import { IssuePriority, IssueSeverity, Component } from '../../types';

export interface MissingInfoItem {
  field: string;
  label: string;
  reason: string;
}

export interface AITriageData {
  suggested_severity: IssueSeverity;
  suggested_priority: IssuePriority;
  suggested_component_id?: string;
  suggested_component_name?: string;
  suggested_labels: string[];
  missing_information: MissingInfoItem[];
  confidence_score: number;
  triage_summary: string;
  ai_provider: string;
}

interface AITriageInspectorProps {
  triageData: AITriageData | null;
  loading: boolean;
  onAcceptAll: () => void;
  onAcceptPrioritySeverity: (priority: IssuePriority, severity: IssueSeverity) => void;
  onAcceptComponent: (componentId?: string) => void;
  onAcceptLabels: (labels: string[]) => void;
  onDismiss: () => void;
}

export const AITriageInspector: React.FC<AITriageInspectorProps> = ({
  triageData,
  loading,
  onAcceptAll,
  onAcceptPrioritySeverity,
  onAcceptComponent,
  onAcceptLabels,
  onDismiss,
}) => {
  if (loading) {
    return (
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center gap-2 text-xs text-emerald-400 animate-pulse">
        <Sparkles className="h-4 w-4 animate-spin text-emerald-400" />
        <span>Grok AI is triaging defect impact, component, and missing diagnostics...</span>
      </div>
    );
  }

  if (!triageData) return null;

  return (
    <div className="p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-br from-primary/10 via-secondary/30 to-black/40 space-y-3.5 animate-in slide-in-from-top-2 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
            <Wand2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <span className="text-xs font-bold text-emerald-400">
              Grok AI Triage Analysis ({triageData.confidence_score}% Confidence)
            </span>
            <span className="text-[10px] text-muted-foreground block font-mono">
              AI Suggestions (Review before applying)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onDismiss}
            className="text-[11px] h-6 px-2 text-muted-foreground hover:text-foreground"
          >
            Ignore
          </Button>
          <Button
            type="button"
            variant="glow"
            size="sm"
            onClick={onAcceptAll}
            className="gap-1.5 text-[11px] h-6 px-2.5 font-semibold bg-primary text-emerald-400-foreground hover:bg-primary shadow-sm"
          >
            <Check className="h-3 w-3" />
            <span>Accept All Suggestions</span>
          </Button>
        </div>
      </div>

      {/* Triage Summary explanation */}
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        {triageData.triage_summary}
      </p>

      {/* Suggested Attributes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
        {/* Priority & Severity Card */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-primary/20 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Suggested Impact:
            </span>
            <div className="flex items-center gap-1.5">
              <Badge variant="warning" className="text-[10px] font-mono">
                {triageData.suggested_priority.replace('_', ' ')}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {triageData.suggested_severity}
              </Badge>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              onAcceptPrioritySeverity(triageData.suggested_priority, triageData.suggested_severity)
            }
            className="mt-2 text-[10px] font-semibold text-emerald-400 hover:underline flex items-center gap-1 self-end"
          >
            <span>Apply Impact</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>

        {/* Component Card */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-primary/20 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Suggested Component:
            </span>
            <div className="font-mono text-xs font-semibold text-foreground truncate">
              {triageData.suggested_component_name || 'General Subsystem'}
            </div>
          </div>
          {triageData.suggested_component_id && (
            <button
              type="button"
              onClick={() => onAcceptComponent(triageData.suggested_component_id)}
              className="mt-2 text-[10px] font-semibold text-emerald-400 hover:underline flex items-center gap-1 self-end"
            >
              <span>Apply Component</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </button>
          )}
        </div>

        {/* Smart Labels Card */}
        <div className="p-2.5 rounded-lg bg-black/40 border border-primary/20 flex flex-col justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">
              Suggested Labels:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {triageData.suggested_labels.map((lbl) => (
                <Badge key={lbl} variant="outline" className="text-[9px] font-mono px-1 py-0">
                  {lbl}
                </Badge>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAcceptLabels(triageData.suggested_labels)}
            className="mt-2 text-[10px] font-semibold text-emerald-400 hover:underline flex items-center gap-1 self-end"
          >
            <span>Apply Labels</span>
            <ArrowRight className="h-2.5 w-2.5" />
          </button>
        </div>
      </div>

      {/* Missing Information Checklist */}
      {triageData.missing_information.length > 0 && (
        <div className="pt-2 border-t border-primary/20 space-y-1.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Missing Diagnostic Information Checklist:</span>
          </div>
          <div className="space-y-1">
            {triageData.missing_information.map((item) => (
              <div
                key={item.field}
                className="flex items-start gap-2 text-[11px] text-muted-foreground bg-amber-500/5 p-1.5 rounded border border-amber-500/10"
              >
                <span className="text-amber-400 font-bold">•</span>
                <div>
                  <strong className="text-foreground">{item.label}:</strong>{' '}
                  <span>{item.reason}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
