import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { BarChart3, TrendingUp, CheckCircle, Clock, Zap } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Engineering Quality & Defect Analytics"
        description="Actionable telemetry on defect arrival rates, MTTR (Mean Time to Resolution), and component stability."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Mean Time to Resolution (MTTR)</CardTitle>
            <div className="text-3xl font-bold text-foreground">1.4 <span className="text-base font-normal text-muted-foreground">days</span></div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>18% faster than previous cycle</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Defect Escape Rate</CardTitle>
            <div className="text-3xl font-bold text-foreground">2.1%</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Well within SLA target (&lt;5%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">AI Auto-Triage Velocity</CardTitle>
            <div className="text-3xl font-bold text-foreground">840ms</div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1.5 text-xs text-purple-400">
              <Zap className="h-3.5 w-3.5" />
              <span>Instant duplicate & tag suggestions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Telemetry & Charts Foundation</CardTitle>
          <CardDescription>
            Deep analytics powered by Recharts will be populated with full dataset in Phase 8.
          </CardDescription>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center border border-dashed border-border/60 rounded-lg text-sm text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary/60" />
            <span>Interactive charts ready for Phase 8 integration</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
