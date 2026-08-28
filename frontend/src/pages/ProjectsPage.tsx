import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Plus, FolderGit2, Users, Bug, CheckCircle } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const projects = [
    {
      key: 'ECOM',
      name: 'E-Commerce Platform',
      description: 'Core storefront, payment gateways, checkout flows, and user inventory systems.',
      members: 8,
      openIssues: 18,
      resolvedIssues: 142,
    },
    {
      key: 'MOB',
      name: 'Mobile Banking App',
      description: 'iOS & Android native client applications with biometric authentication.',
      members: 5,
      openIssues: 7,
      resolvedIssues: 89,
    },
    {
      key: 'API',
      name: 'Developer Public API',
      description: 'High-throughput GraphQL & REST gateway with rate limiting and OAuth2.',
      members: 4,
      openIssues: 3,
      resolvedIssues: 64,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Project Workspaces"
        description="Manage projects, components, versions, milestones, and member permissions."
      >
        <Button variant="glow" size="sm" className="gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {projects.map((p) => (
          <Card key={p.key} className="hover:border-primary/50 transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center justify-between">
                <Badge variant="purple" className="font-mono text-xs">
                  {p.key}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span>{p.members}</span>
                </div>
              </div>
              <CardTitle className="mt-2 text-base group-hover:text-primary transition-colors">
                {p.name}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-2">
                {p.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Bug className="h-3.5 w-3.5 text-red-400" />
                  <span><strong>{p.openIssues}</strong> Open</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                  <span><strong>{p.resolvedIssues}</strong> Resolved</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
