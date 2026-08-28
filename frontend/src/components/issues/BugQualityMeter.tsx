import React, { useState } from 'react';
import { Badge } from '../ui/badge';
import { CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';

export interface QualityCheckItem {
  id: string;
  label: string;
  passed: boolean;
  points: number;
  tip?: string;
}

export interface BugQualityScoreData {
  score: number;
  rating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  checklist: QualityCheckItem[];
  recommendations: string[];
}

interface BugQualityMeterProps {
  scoreData: BugQualityScoreData;
}

export const BugQualityMeter: React.FC<BugQualityMeterProps> = ({ scoreData }) => {
  const [expanded, setExpanded] = useState(false);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'EXCELLENT':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'GOOD':
        return 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10';
      case 'FAIR':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      default:
        return 'text-red-400 border-red-500/40 bg-red-500/10';
    }
  };

  const getProgressGradient = (score: number) => {
    if (score >= 85) return 'from-emerald-500 to-teal-400';
    if (score >= 70) return 'from-indigo-500 to-purple-400';
    if (score >= 50) return 'from-amber-500 to-orange-400';
    return 'from-red-500 to-pink-500';
  };

  const passedCount = scoreData.checklist.filter((c) => c.passed).length;

  return (
    <div className="p-3.5 rounded-xl border border-border/80 bg-secondary/20 space-y-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span className="text-xs font-bold text-foreground">Bug Quality Score:</span>
          <span className="font-mono text-sm font-extrabold text-foreground">{scoreData.score} / 100</span>
          <Badge className={`text-[10px] font-mono font-bold uppercase ${getRatingColor(scoreData.rating)}`}>
            {scoreData.rating}
          </Badge>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          <span>{passedCount}/{scoreData.checklist.length} Passed</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
        <div
          className={`bg-gradient-to-r ${getProgressGradient(scoreData.score)} h-full rounded-full transition-all duration-300`}
          style={{ width: `${Math.max(5, scoreData.score)}%` }}
        />
      </div>

      {/* Expandable Checklist */}
      {expanded && (
        <div className="pt-2 border-t border-border/50 space-y-1.5 animate-in slide-in-from-top-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
            {scoreData.checklist.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-1.5 p-1.5 rounded ${
                  item.passed ? 'text-foreground/90 bg-emerald-500/5' : 'text-muted-foreground bg-secondary/30'
                }`}
              >
                {item.passed ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 leading-tight">
                  <span className={item.passed ? 'font-medium' : ''}>{item.label}</span>
                  {!item.passed && item.tip && (
                    <span className="block text-[10px] text-amber-400/80 mt-0.5">
                      +{item.points} pts: {item.tip}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
