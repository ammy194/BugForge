import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { useProject } from '../contexts/ProjectContext';
import { api } from '../lib/api';
import {
  Terminal,
  Play,
  Bug,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GitBranch,
  GitCommit,
  Clock,
  Sparkles,
  Server,
  ArrowRight,
  Plus,
} from 'lucide-react';

interface CIFailure {
  id: string;
  project_id: string;
  provider: string;
  test_suite: string;
  test_name: string;
  error_message: string;
  stack_trace?: string;
  expected_result?: string;
  actual_result?: string;
  build_id: string;
  build_url: string;
  branch: string;
  commit_sha: string;
  commit_author?: string;
  environment?: string;
  status: 'UNRESOLVED' | 'CONVERTED_TO_ISSUE' | 'IGNORED';
  converted_issue_id?: string;
  converted_issue_key?: string;
  created_at: string;
}

export const CIFailuresPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeProject } = useProject();

  const [failures, setFailures] = useState<CIFailure[]>([]);
  const [loading, setLoading] = useState(true);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const list = await api.get<CIFailure[]>(
        `/ci/failures${activeProject ? `?project_id=${activeProject.id}` : ''}`
      );
      setFailures(Array.isArray(list) ? list : []);
    } catch {
      setFailures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, [activeProject]);

  const safeFailures = Array.isArray(failures) ? failures : [];

  const handleCreateIssueFromFailure = async (failureId: string) => {
    setConvertingId(failureId);
    try {
      const res = await api.post<{ issue: any; failure: CIFailure; alreadyCreated: boolean }>(
        `/ci/failures/${failureId}/create-issue`,
        {}
      );

      // Update local status
      setFailures((prev) =>
        (Array.isArray(prev) ? prev : []).map((f) => (f.id === failureId ? res.failure : f))
      );

      // Route to issue detail
      navigate(`/issues/${res.issue.key}`);
    } catch (err: any) {
      alert(`Failed to create issue from CI failure: ${err.message}`);
    } finally {
      setConvertingId(null);
    }
  };

  const handleSimulateNewFailure = async () => {
    setSimulating(true);
    try {
      const randomTestNum = Math.floor(100 + Math.random() * 900);
      await api.post('/ci/failures', {
        provider: 'github_actions',
        project_key: activeProject?.key || 'ECOM',
        test_suite: 'CheckoutTest',
        test_name: `CheckoutTest.testExpiredCouponValidation_${randomTestNum}()`,
        error_message: 'AssertionError: Expected HTTP 400 Bad Request but received HTTP 500 Internal Server Error',
        expected_result: 'HTTP 400 Bad Request (Coupon code has expired)',
        actual_result: 'HTTP 500 Internal Server Error (NullPointerException at CouponService:84)',
        stack_trace: 'at CouponService.validate (src/services/couponService.ts:84:14)\nat CheckoutController.applyCoupon (src/controllers/checkoutController.ts:52:9)',
        build_id: `gha-run-${Date.now().toString().slice(-5)}`,
        build_url: 'https://github.com/ammy194/BugForge/actions',
        branch: 'fix/coupon-validation',
        commit_sha: 'a82f91c0e3b5d719283746192837461928374619',
        commit_author: 'Bob Chen',
        environment: 'Node 22 / Ubuntu 24.04 runner',
      });

      await fetchFailures();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="CI/CD Automated Test Failures"
        description="Ingest continuous integration test failures and convert them into structured defect tickets in 1 click."
        badge={
          <Badge variant="default" className="font-mono text-[11px]">
            {activeProject?.key || 'PROJECT'} • CI SUITE
          </Badge>
        }
      >
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="glow"
            onClick={handleSimulateNewFailure}
            disabled={simulating}
            className="gap-1.5 text-xs h-8 font-semibold"
          >
            <Play className="h-3.5 w-3.5" />
            <span>{simulating ? 'Ingesting from CI Pipeline...' : 'Simulate CI Test Failure'}</span>
          </Button>
        </div>
      </PageHeader>

      {/* CI Ingestion Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Unresolved Failures</span>
            <div className="text-2xl font-bold font-mono text-red-400">
              {safeFailures.filter((f) => f.status === 'UNRESOLVED').length}
            </div>
            <p className="text-[11px] text-muted-foreground">Awaiting 1-click issue conversion</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Converted to Issues</span>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              {safeFailures.filter((f) => f.status === 'CONVERTED_TO_ISSUE').length}
            </div>
            <p className="text-[11px] text-muted-foreground">In active developer triage / fix workflow</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 bg-card/80">
          <CardContent className="p-4 space-y-1">
            <span className="text-xs font-semibold text-muted-foreground">Active CI Provider</span>
            <div className="text-sm font-bold font-mono text-foreground mt-1 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-primary" />
              <span>GitHub Actions CI</span>
            </div>
            <p className="text-[11px] text-emerald-400">Provider Abstraction Active</p>
          </CardContent>
        </Card>
      </div>

      {/* CI Failures List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span>Pipeline Test Failure Ingestion Feed</span>
        </h2>

        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground animate-pulse">
            Loading continuous integration test failures...
          </div>
        ) : failures.length === 0 ? (
          <Card className="border-border/80 bg-card/80 py-12 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-foreground">All CI Pipelines Passing Cleanly</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No unresolved automated test failures detected in {activeProject?.name || 'this project'}.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {failures.map((f) => (
              <Card
                key={f.id}
                className={`border transition-all ${
                  f.status === 'UNRESOLVED'
                    ? 'border-red-500/40 bg-red-950/10'
                    : 'border-border/80 bg-card/80'
                }`}
              >
                <CardHeader className="pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant={f.status === 'UNRESOLVED' ? 'destructive' : 'success'}
                        className="font-mono text-[10px]"
                      >
                        {f.status === 'UNRESOLVED' ? 'FAILED TEST' : 'CONVERTED'}
                      </Badge>
                      <span className="font-mono text-xs font-bold text-foreground">{f.test_name}</span>
                      <span className="text-[11px] text-muted-foreground font-mono">({f.test_suite})</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                      <span className="flex items-center gap-1">
                        <GitBranch className="h-3 w-3 text-cyan-400" />
                        <span>{f.branch}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <GitCommit className="h-3 w-3 text-primary" />
                        <span>{f.commit_sha.substring(0, 7)}</span>
                      </span>
                      <span>by {f.commit_author || 'CI Bot'}</span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="shrink-0 flex items-center gap-2">
                    {f.status === 'CONVERTED_TO_ISSUE' && f.converted_issue_key ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/issues/${f.converted_issue_key}`)}
                        className="gap-1.5 text-xs h-8 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        <Bug className="h-3.5 w-3.5" />
                        <span>View Issue {f.converted_issue_key}</span>
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="glow"
                        onClick={() => handleCreateIssueFromFailure(f.id)}
                        disabled={convertingId === f.id}
                        className="gap-1.5 text-xs h-8 font-semibold shadow-md shadow-primary/20"
                      >
                        <Bug className="h-3.5 w-3.5" />
                        <span>{convertingId === f.id ? 'Creating Issue...' : 'Create Issue from Failure'}</span>
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  {/* Expected vs Actual */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
                      <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">
                        Expected Result:
                      </span>
                      <span className="font-mono text-muted-foreground">{f.expected_result}</span>
                    </div>

                    <div className="p-2.5 rounded-lg border border-red-500/30 bg-red-500/5">
                      <span className="text-[10px] font-bold uppercase text-red-400 block mb-1">
                        Actual / Received Error:
                      </span>
                      <span className="font-mono text-red-300 font-semibold">{f.actual_result}</span>
                    </div>
                  </div>

                  {/* Stack Trace */}
                  {f.stack_trace && (
                    <div className="p-2.5 rounded-lg bg-black/40 border border-border/50 space-y-1">
                      <span className="text-[10px] font-semibold text-muted-foreground block font-mono">
                        Failure Stack Trace:
                      </span>
                      <pre className="font-mono text-[11px] text-muted-foreground overflow-x-auto whitespace-pre">
                        {f.stack_trace}
                      </pre>
                    </div>
                  )}

                  {/* Footer Environment info */}
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono pt-1">
                    <span>Runner: {f.environment || 'Node 22 / Ubuntu 24.04 runner'}</span>
                    <a
                      href={f.build_url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary flex items-center gap-1"
                    >
                      <span>Build ID: {f.build_id}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
