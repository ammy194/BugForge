import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';
import { useProject } from '../contexts/ProjectContext';
import { api } from '../lib/api';
import {
  Webhook as WebhookIcon,
  GitBranch,
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Plus,
  Trash2,
  Shield,
  Zap,
  Globe,
  Sparkles,
} from 'lucide-react';

interface Webhook {
  id: string;
  url: string;
  secret?: string;
  events: string[];
  is_active: boolean;
  created_at: string;
}

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { activeProject, isAutoSimulating, setAutoSimulating } = useProject();

  const [activeTab, setActiveTab] = useState<'integrations' | 'webhooks' | 'account'>('integrations');
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loadingWebhooks, setLoadingWebhooks] = useState(false);

  // New Webhook Modal
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['issue.created', 'issue.resolved']);
  const [submittingWebhook, setSubmittingWebhook] = useState(false);

  // CI Simulation State
  const [simulatingCi, setSimulatingCi] = useState(false);
  const [ciResult, setCiResult] = useState<any>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const baseUrl = window.location.origin.replace('5173', '5000');

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true);
    try {
      const list = await api.get<Webhook[]>('/webhooks');
      setWebhooks(list);
    } catch {
      //
    } finally {
      setLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const handleSimulateCiFailure = async () => {
    setSimulatingCi(true);
    setCiResult(null);
    try {
      const created = await api.post<any>('/ci/webhook', {
        project_key: activeProject?.key || 'ECOM',
        test_name: 'testStripeRecurringBillingRetryFailure',
        build_id: `run-${Math.floor(10000 + Math.random() * 90000)}`,
        build_url: 'https://github.com/ammy194/BugForge/actions',
        branch: 'main',
        commit_sha: 'a8f9c0e2b4d61829374619283746192837461928',
        commit_author: 'github-actions[bot]',
        error_message: 'AssertionError: Expected webhook HMAC signature verification 200 OK but received 401 Unauthorized SignatureMismatch',
        stack_trace: 'at StripeWebhookValidator.spec.ts:104:18',
      });
      setCiResult(created);
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulatingCi(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrl.trim() || !activeProject) return;
    setSubmittingWebhook(true);

    try {
      await api.post('/webhooks', {
        project_id: activeProject.id,
        url: webhookUrl,
        secret: webhookSecret || undefined,
        events: selectedEvents,
      });

      setShowAddWebhook(false);
      setWebhookUrl('');
      setWebhookSecret('');
      fetchWebhooks();
    } catch (err: any) {
      alert(`Failed to create webhook: ${err.message}`);
    } finally {
      setSubmittingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    try {
      await api.delete(`/webhooks/${id}`);
      fetchWebhooks();
    } catch {
      //
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        title="Settings & Integrations"
        description="Configure GitHub bidirectional webhooks, CI/CD automated defect ingestion, and outbound event dispatches."
        badge={<Badge variant="default">DEVELOPER SUITE</Badge>}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border/60 pb-3">
        <button
          onClick={() => setActiveTab('integrations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'integrations'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary/50'
          }`}
        >
          <Zap className="h-4 w-4" />
          <span>CI/CD & GitHub Integrations</span>
        </button>

        <button
          onClick={() => setActiveTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'webhooks'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary/50'
          }`}
        >
          <Globe className="h-4 w-4" />
          <span>Outbound Webhooks ({webhooks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'account'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-secondary/50'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Account & Security</span>
        </button>
      </div>

      {/* Tab 1: CI/CD & GitHub Integrations */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Live Demo Mode Auto-Simulate */}
          <Card className="border-border/80 bg-card/80 border-primary/40 shadow-[0_0_15px_rgba(56,189,248,0.1)] md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>Live Demo Mode (Auto-Simulate Bugs)</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Automatically generate random realistic bugs every 30 seconds to simulate a live, active engineering environment during presentations.
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`text-xs font-semibold ${isAutoSimulating ? 'text-primary' : 'text-muted-foreground'}`}>
                  {isAutoSimulating ? 'ACTIVE' : 'INACTIVE'}
                </span>
                <button
                  onClick={() => setAutoSimulating(!isAutoSimulating)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
                    isAutoSimulating ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span className="sr-only">Toggle Live Demo Mode</span>
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      isAutoSimulating ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </CardHeader>
          </Card>

          {/* GitHub Integration Card */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                <span>GitHub Bidirectional Integration</span>
              </CardTitle>
              <CardDescription className="text-xs">
                Auto-link commits and close issues when referencing syntax like <strong className="text-foreground">Fixes ECOM-1042</strong> or <strong className="text-foreground">Refs ECOM-1042</strong>.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Inbound GitHub Webhook Payload URL:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${baseUrl}/api/v1/github/webhook`}
                    className="font-mono text-xs bg-secondary/50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${baseUrl}/api/v1/github/webhook`, 'gh')}
                    className="gap-1.5 shrink-0"
                  >
                    {copiedUrl === 'gh' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrl === 'gh' ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/30 border border-border/40 space-y-1 text-muted-foreground">
                <span className="font-semibold text-foreground block">Supported Commit Syntax:</span>
                <p>• <code className="text-primary font-mono">git commit -m "fix(checkout): coupon calculation (Fixes ECOM-1042)"</code> → Auto-resolves ticket to RESOLVED (FIXED)</p>
                <p>• <code className="text-primary font-mono">git commit -m "refactor: pricing aggregator (Refs ECOM-1042)"</code> → Links commit without changing status</p>
              </div>
            </CardContent>
          </Card>

          {/* CI/CD Automated Ingestion Card */}
          <Card className="border-border/80 bg-card/80">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-emerald-400" />
                  <span>CI/CD Automated Test Failure Ingestion</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Automatically file structured defect tickets when automated test suites or builds fail.
                </CardDescription>
              </div>

              <Button
                variant="glow"
                size="sm"
                onClick={handleSimulateCiFailure}
                disabled={simulatingCi}
                className="gap-1.5 text-xs font-semibold"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{simulatingCi ? 'Simulating Pipeline...' : 'Simulate CI Test Failure'}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-muted-foreground">
                  Inbound CI Failure Webhook Endpoint:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={`${baseUrl}/api/v1/ci/webhook`}
                    className="font-mono text-xs bg-secondary/50"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(`${baseUrl}/api/v1/ci/webhook`, 'ci')}
                    className="gap-1.5 shrink-0"
                  >
                    {copiedUrl === 'ci' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUrl === 'ci' ? 'Copied' : 'Copy'}</span>
                  </Button>
                </div>
              </div>

              {/* CI Simulation Result Banner */}
              {ciResult && (
                <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 font-bold text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Automated Defect Ticket Filed Successfully!</span>
                  </div>
                  <p className="text-xs text-foreground">
                    Created ticket <strong className="text-primary font-mono">{ciResult.key}</strong>: "{ciResult.title}" with priority {ciResult.priority} and attached test failure stack traces.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Outbound Webhooks */}
      {activeTab === 'webhooks' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground">Configured Outbound Webhooks</h3>
              <p className="text-xs text-muted-foreground">Deliver real-time payloads on issue creation, status transitions, and CI alerts.</p>
            </div>
            <Button
              size="sm"
              variant="glow"
              onClick={() => setShowAddWebhook(true)}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Webhook</span>
            </Button>
          </div>

          <Card className="border-border/80 bg-card/80">
            <CardContent className="p-0">
              {loadingWebhooks ? (
                <div className="py-12 text-center text-xs text-muted-foreground animate-pulse">Loading webhooks...</div>
              ) : webhooks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <WebhookIcon className="h-8 w-8 text-muted-foreground mx-auto" />
                  <p className="text-xs text-muted-foreground">No outbound webhooks configured yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/60">
                  {webhooks.map((wh) => (
                    <div key={wh.id} className="p-4 flex items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">{wh.url}</span>
                          <Badge variant="success" className="text-[10px]">ACTIVE</Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>Events:</span>
                          {wh.events.map((e) => (
                            <Badge key={e} variant="outline" className="text-[9px] font-mono px-1 py-0">{e}</Badge>
                          ))}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteWebhook(wh.id)}
                        className="h-7 w-7 p-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Webhook Modal */}
          {showAddWebhook && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold">Add Outbound Webhook</CardTitle>
                  <CardDescription className="text-xs">Provide endpoint URL and subscribe to project defect events.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateWebhook} className="space-y-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">Endpoint Payload URL</label>
                      <Input
                        placeholder="https://your-api.com/webhooks/bugforge"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        required
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-semibold text-foreground">HMAC Secret Key (Optional)</label>
                      <Input
                        placeholder="sec_custom_secret_key"
                        value={webhookSecret}
                        onChange={(e) => setWebhookSecret(e.target.value)}
                        className="text-xs"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-border/60">
                      <Button type="button" variant="outline" size="sm" onClick={() => setShowAddWebhook(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" variant="glow" size="sm" disabled={submittingWebhook}>
                        {submittingWebhook ? 'Saving...' : 'Create Webhook'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Account & Security */}
      {activeTab === 'account' && (
        <Card className="border-border/80 bg-card/80 animate-in fade-in">
          <CardHeader>
            <CardTitle className="text-sm font-bold">Current Persona & Permissions</CardTitle>
            <CardDescription className="text-xs">Active authentication credentials and workspace RBAC profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-muted-foreground block mb-1 font-semibold">User Email:</span>
                <span className="font-mono text-foreground font-bold">{user?.email}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1 font-semibold">Global Role:</span>
                <Badge variant="default" className="font-mono">{user?.global_role}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
