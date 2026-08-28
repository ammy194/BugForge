import React from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Settings, Key, Shield, Bell, Github, Sparkles } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings & Integrations"
        description="Configure project preferences, role permissions, Grok AI keys, and GitHub webhooks."
      />

      <div className="space-y-6">
        {/* Grok AI Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <CardTitle>xAI Grok Intelligence</CardTitle>
              </div>
              <Badge variant="purple">Backend Proxy</Badge>
            </div>
            <CardDescription>
              Powers duplicate detection radar, automatic classification, and thread summarization. Key is securely stored on backend server only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-xs text-muted-foreground bg-secondary/40 p-3 rounded-lg border border-border/60">
              <strong className="text-foreground">Security Guarantee:</strong> The client never accesses <code>GROK_API_KEY</code> directly. All AI analysis passes through authenticated Express routes with rate-limiting and heuristic fallback.
            </div>
          </CardContent>
        </Card>

        {/* GitHub Integration Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Github className="h-5 w-5 text-foreground" />
                <CardTitle>GitHub & CI Webhooks</CardTitle>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <CardDescription>
              Link commits, pull requests, and automated test failure webhooks to issues.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>Webhook URL endpoint: <code className="text-primary font-mono">/api/v1/ci/webhook</code></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
