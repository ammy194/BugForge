import React, { useEffect, useState } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { api } from '../lib/api';
import { SystemHealthData } from '../types';
import {
  Bug,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  Server,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getHealth();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch backend health status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const stats = [
    {
      title: 'Active Defects',
      value: '24',
      change: '-4 from last sprint',
      icon: Bug,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
    {
      title: 'In Triage / Review',
      value: '8',
      change: '3 need QA verification',
      icon: Clock,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      title: 'Resolved This Week',
      value: '19',
      change: '+28% resolution velocity',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      title: 'AI Intake Accuracy',
      value: '94.2%',
      change: 'Grok auto-tagging active',
      icon: Sparkles,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10 border-purple-500/20',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Project Overview & Triage Radar"
        description="Real-time defect tracking, automated triage velocity, and release health analytics."
        badge={
          <Badge variant="info" className="font-mono text-[11px]">
            ECOM-Sprint-14
          </Badge>
        }
      >
        <Button variant="outline" size="sm" onClick={fetchHealth} className="gap-1.5 text-xs">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Telemetry</span>
        </Button>
        <Button variant="glow" size="sm" className="gap-1.5 text-xs">
          <Bug className="h-3.5 w-3.5" />
          <span>New Issue</span>
        </Button>
      </PageHeader>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="relative overflow-hidden group hover:border-primary/50 transition-all">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                  <div className={`rounded-lg p-2 border ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold tracking-tight text-foreground">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400 inline" />
                    <span>{stat.change}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Grid: Telemetry & Quick Action */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Backend & Integration Telemetry */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-400" />
                <CardTitle>System & Services Health Status</CardTitle>
              </div>
              <Badge variant={health?.status === 'healthy' ? 'success' : 'warning'}>
                {health?.status ? health.status.toUpperCase() : 'CHECKING'}
              </Badge>
            </div>
            <CardDescription>
              Live diagnostics across Express REST API, PostgreSQL Supabase layer, and Grok AI provider.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse text-sm">
                Connecting to BugForge API and querying microservices...
              </div>
            ) : error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-400">
                <p className="font-semibold">Backend Connection Issue</p>
                <p className="mt-1">{error}</p>
              </div>
            ) : health ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>REST API Server</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">{health.service}</div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    Uptime: {health.uptime.formatted}
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Supabase DB</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        health.integrations.supabase.connected ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">PostgreSQL Storage</div>
                  <div className="text-[11px] font-mono text-muted-foreground truncate" title={health.integrations.supabase.message}>
                    {health.integrations.supabase.connected ? 'Connected' : 'Dev Mode Active'}
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-secondary/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Grok AI Engine</span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        health.integrations.grokAI.configured ? 'bg-purple-500' : 'bg-blue-400'
                      }`}
                    ></span>
                  </div>
                  <div className="text-sm font-semibold text-foreground">xAI Provider</div>
                  <div className="text-[11px] font-mono text-muted-foreground">
                    {health.integrations.grokAI.configured ? 'Active' : 'Heuristic Fallback'}
                  </div>
                </div>
              </div>
            ) : null}

            {/* Architecture Highlights */}
            <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-indigo-300">
                <Cpu className="h-4 w-4 text-indigo-400" />
                <span>Architecture Guarantee</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                BugForge enforces all state machine rules, permission checks, duplicate detection scoring, and audit trail records through the authoritative Express API layer. Supabase acts as secure database & authentication infrastructure.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Triage Radar */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <CardTitle>Priority Radar</CardTitle>
            </div>
            <CardDescription>Defects requiring immediate engineering attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              {
                key: 'ECOM-1042',
                title: 'Checkout crashes with expired coupon',
                priority: 'P0_CRITICAL',
                severity: 'BLOCKER',
                status: 'OPEN',
              },
              {
                key: 'ECOM-1043',
                title: 'Cart total incorrect after quantity remove',
                priority: 'P1_HIGH',
                severity: 'CRITICAL',
                status: 'TRIAGED',
              },
              {
                key: 'MOB-208',
                title: 'Push notifications fail after logout',
                priority: 'P1_HIGH',
                severity: 'MAJOR',
                status: 'IN_PROGRESS',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="group flex flex-col gap-1.5 rounded-lg border border-border/60 bg-secondary/30 p-3 hover:border-primary/40 hover:bg-secondary/60 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary">{item.key}</span>
                  <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                    {item.priority.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                  <span>{item.severity}</span>
                  <span className="text-sky-400">{item.status}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
