import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Bug, Search, Filter, Plus, ArrowUpDown, MessageSquare, Paperclip, GitPullRequest } from 'lucide-react';

export const IssuesPage: React.FC = () => {
  const issues = [
    {
      key: 'ECOM-1042',
      title: 'Checkout crashes when applying expired coupon code',
      type: 'BUG',
      status: 'OPEN',
      priority: 'P0_CRITICAL',
      severity: 'BLOCKER',
      assignee: 'Bob Chen',
      comments: 6,
      attachments: 2,
      pr: '#382',
      updated: '10m ago',
    },
    {
      key: 'ECOM-1043',
      title: 'Cart item total displays floating point calculation discrepancy ($19.9999)',
      type: 'BUG',
      status: 'TRIAGED',
      priority: 'P1_HIGH',
      severity: 'CRITICAL',
      assignee: 'Alice Walker',
      comments: 3,
      attachments: 1,
      updated: '1h ago',
    },
    {
      key: 'ECOM-1044',
      title: 'Stripe webhook signature verification failure on recurring payment retry',
      type: 'BUG',
      status: 'IN_PROGRESS',
      priority: 'P1_HIGH',
      severity: 'MAJOR',
      assignee: 'David Smith',
      comments: 8,
      attachments: 4,
      pr: '#389',
      updated: '3h ago',
    },
    {
      key: 'ECOM-1045',
      title: 'Missing accessibility aria-labels on product image gallery carousel',
      type: 'IMPROVEMENT',
      status: 'IN_REVIEW',
      priority: 'P2_MEDIUM',
      severity: 'MINOR',
      assignee: 'Elena Rostova',
      comments: 2,
      attachments: 0,
      pr: '#394',
      updated: '5h ago',
    },
    {
      key: 'ECOM-1040',
      title: 'OAuth login token refresh race condition on concurrent tab focus',
      type: 'BUG',
      status: 'RESOLVED',
      priority: 'P0_CRITICAL',
      severity: 'BLOCKER',
      assignee: 'Bob Chen',
      comments: 14,
      attachments: 3,
      pr: '#376',
      updated: '1d ago',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issues & Defects"
        description="Comprehensive issue lifecycle tracking with AI-assisted triage and Git correlation."
      >
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters (0)</span>
        </Button>
        <Button variant="glow" size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>Report Bug</span>
        </Button>
      </PageHeader>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Filter by title, description, key, assignee, component..."
            icon={<Search className="h-4 w-4" />}
            className="text-xs h-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option>All Statuses</option>
            <option>Open & Triaged</option>
            <option>In Progress</option>
            <option>In Review</option>
            <option>Resolved</option>
            <option>Closed</option>
          </select>
          <select className="h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
            <option>All Priorities</option>
            <option>P0 Critical</option>
            <option>P1 High</option>
            <option>P2 Medium</option>
            <option>P3 Low</option>
          </select>
        </div>
      </div>

      {/* Issues Table List */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-border/60">
            {issues.map((issue) => (
              <div
                key={issue.key}
                className="group flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-secondary/30 transition-all cursor-pointer gap-3"
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    <Bug className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-primary hover:underline">
                        {issue.key}
                      </span>
                      <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {issue.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                      <span>Assignee: <strong className="text-foreground">{issue.assignee}</strong></span>
                      <span>•</span>
                      <span>Updated {issue.updated}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {issue.pr && (
                    <Badge variant="purple" className="gap-1 text-[10px] font-mono">
                      <GitPullRequest className="h-3 w-3" />
                      <span>{issue.pr}</span>
                    </Badge>
                  )}
                  {issue.attachments > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <Paperclip className="h-3 w-3" />
                      <span>{issue.attachments}</span>
                    </span>
                  )}
                  {issue.comments > 0 && (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                      <MessageSquare className="h-3 w-3" />
                      <span>{issue.comments}</span>
                    </span>
                  )}
                  <Badge
                    variant={
                      issue.priority === 'P0_CRITICAL'
                        ? 'destructive'
                        : issue.priority === 'P1_HIGH'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {issue.priority.replace('_', ' ')}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {issue.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
