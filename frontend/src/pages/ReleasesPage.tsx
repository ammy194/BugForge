import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { GitPullRequest, Plus, Calendar, CheckCircle2, Clock } from 'lucide-react';

export const ReleasesPage: React.FC = () => {
  const releases = [
    {
      name: 'v2.4.0',
      status: 'IN_PROGRESS',
      progress: 68,
      date: 'Target: Oct 15, 2026',
      totalIssues: 28,
      resolvedIssues: 19,
    },
    {
      name: 'v2.3.2',
      status: 'RELEASED',
      progress: 100,
      date: 'Shipped: Sep 28, 2026',
      totalIssues: 14,
      resolvedIssues: 14,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Releases & Milestones"
        description="Track release health, sprint burndown, and deploy readiness across versions."
      >
        <Button variant="glow" size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>New Release</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {releases.map((rel) => (
          <Card key={rel.name}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-lg">{rel.name}</CardTitle>
                <Badge variant={rel.status === 'RELEASED' ? 'success' : 'info'}>
                  {rel.status}
                </Badge>
              </div>
              <CardDescription className="flex items-center gap-1.5 text-xs">
                <Calendar className="h-3.5 w-3.5" />
                <span>{rel.date}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Release Progress</span>
                <span className="font-mono font-semibold text-foreground">{rel.progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                  style={{ width: `${rel.progress}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{rel.resolvedIssues} of {rel.totalIssues} issues resolved</span>
                <span>{rel.totalIssues - rel.resolvedIssues} remaining</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
