import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useProject } from '../contexts/ProjectContext';
import { Version, Milestone } from '../types';
import { api } from '../lib/api';
import {
  Rocket,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  FileText,
  Copy,
  Download,
  Flame,
  Zap,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  Plus,
  Clock,
  X,
  RefreshCw,
} from 'lucide-react';

interface FormulaDeduction {
  factor: string;
  count: number;
  deduction_per_unit: number;
  total_deduction: number;
  explanation: string;
}

interface ReleaseHealthData {
  version_id: string;
  version_name: string;
  version_status: string;
  release_date?: string;
  readiness_score: number;
  status: 'RELEASE_READY' | 'PROCEED_WITH_CAUTION' | 'BLOCKED';
  total_issues: number;
  resolved_issues: number;
  completion_rate: number;
  open_blockers: number;
  open_critical: number;
  regressions_count: number;
  unverified_fixes: number;
  ci_pass_rate: number;
  formula_breakdown: {
    base_score: number;
    deductions: FormulaDeduction[];
    final_score: number;
  };
  blocker_issues: any[];
  release_notes_markdown: string;
}

export const ReleasesPage: React.FC = () => {
  const {
    activeProject,
    getProjectVersions,
    createProjectVersion,
    getProjectMilestones,
    createProjectMilestone,
    userProjectRole,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'HEALTH' | 'RELEASES'>('HEALTH');
  const [versions, setVersions] = useState<Version[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [healthData, setHealthData] = useState<ReleaseHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showFormula, setShowFormula] = useState(false);

  // Modal States
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [verDate, setVerDate] = useState('');
  const [msName, setMsName] = useState('');
  const [msDate, setMsDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isManagerOrAdmin = userProjectRole === 'ADMIN' || userProjectRole === 'PROJECT_MANAGER';

  const loadData = async () => {
    if (!activeProject) return;
    setLoading(true);
    try {
      const [v, ms] = await Promise.all([
        getProjectVersions(activeProject.id),
        getProjectMilestones(activeProject.id),
      ]);
      setVersions(v);
      setMilestones(ms);
      if (v.length > 0 && !selectedVersionId) {
        setSelectedVersionId(v[0].id);
      }
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  useEffect(() => {
    if (!activeProject) return;
    const fetchHealth = async () => {
      try {
        const url = selectedVersionId
          ? `/releases/health?project_id=${activeProject.id}&version_id=${selectedVersionId}`
          : `/releases/health?project_id=${activeProject.id}`;
        const res = await api.get<ReleaseHealthData>(url);
        setHealthData(res);
      } catch {
        //
      }
    };
    fetchHealth();
  }, [activeProject, selectedVersionId]);

  const handleCopyNotes = () => {
    if (!healthData) return;
    navigator.clipboard.writeText(healthData.release_notes_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadNotes = () => {
    if (!healthData) return;
    const element = document.createElement('a');
    const file = new Blob([healthData.release_notes_markdown], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Release-Notes-${healthData.version_name.replace(/\s+/g, '-')}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !verName) return;
    try {
      await createProjectVersion(activeProject.id, {
        name: verName,
        description: verDesc,
        release_date: verDate ? new Date(verDate).toISOString() : undefined,
      });
      setShowVersionModal(false);
      setVerName('');
      setVerDesc('');
      setVerDate('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create release');
    }
  };

  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !msName) return;
    try {
      await createProjectMilestone(activeProject.id, {
        name: msName,
        due_date: msDate ? new Date(msDate).toISOString() : undefined,
      });
      setShowMilestoneModal(false);
      setMsName('');
      setMsDate('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create milestone');
    }
  };

  const getStatusBadge = (status: ReleaseHealthData['status']) => {
    switch (status) {
      case 'RELEASE_READY':
        return (
          <Badge variant="success" className="font-mono text-xs px-3 py-1 font-bold gap-1.5 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>RELEASE READY (GO)</span>
          </Badge>
        );
      case 'PROCEED_WITH_CAUTION':
        return (
          <Badge variant="warning" className="font-mono text-xs px-3 py-1 font-bold gap-1.5 shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>PROCEED WITH CAUTION</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" className="font-mono text-xs px-3 py-1 font-bold gap-1.5 shadow-sm">
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>RELEASE BLOCKED (NO-GO)</span>
          </Badge>
        );
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-red-400 border-red-500/40 bg-red-500/10';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <Rocket className="h-4 w-4" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Release Health & Readiness</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Mathematical release readiness scoring, blocker radar, and automated release notes generation.
          </p>
        </div>

        {/* View switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg border border-border/60 bg-secondary/30 p-1">
            <button
              onClick={() => setActiveTab('HEALTH')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'HEALTH'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Health Radar
            </button>
            <button
              onClick={() => setActiveTab('RELEASES')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'RELEASES'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Versions & Sprints
            </button>
          </div>

          {isManagerOrAdmin && (
            <Button
              variant="glow"
              size="sm"
              onClick={() => setShowVersionModal(true)}
              className="gap-1 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Release</span>
            </Button>
          )}
        </div>
      </div>

      {activeTab === 'HEALTH' ? (
        /* RELEASE HEALTH RADAR VIEW */
        <div className="space-y-6">
          {/* Target Version Selector Filter */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-card/60">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-muted-foreground shrink-0">Release Target:</label>
              <select
                value={selectedVersionId}
                onChange={(e) => setSelectedVersionId(e.target.value)}
                className="h-8 rounded-lg border border-input bg-secondary/50 px-3 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {versions.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.status})
                  </option>
                ))}
                {versions.length === 0 && <option value="">v2.4.0-RC1 (Default Production Candidate)</option>}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-[10px] text-muted-foreground">
                TELEMETRY ACTIVE
              </Badge>
            </div>
          </div>

          {loading || !healthData ? (
            <div className="p-12 text-center text-xs text-muted-foreground animate-pulse font-mono">
              Aggregating release health metrics and blocker telemetry...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Gauge & 4 Metrics Tiles */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Score Gauge Card */}
                <Card className="lg:col-span-1 flex flex-col justify-between p-6 bg-gradient-to-br from-secondary/30 via-card to-card border-border/80 shadow-lg">
                  <div className="space-y-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Release Readiness Score
                      </span>
                    </div>

                    <div className="py-2">
                      <div
                        className={`inline-flex h-32 w-32 items-center justify-center rounded-full border-4 ${getScoreColor(
                          healthData.readiness_score
                        )} shadow-xl`}
                      >
                        <div className="text-center">
                          <span className="font-mono text-4xl font-extrabold tracking-tight">
                            {healthData.readiness_score}
                          </span>
                          <span className="text-xs text-muted-foreground block font-mono">/ 100</span>
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(healthData.status)}</div>
                  </div>

                  <div className="pt-4 border-t border-border/60 text-center">
                    <button
                      onClick={() => setShowFormula(!showFormula)}
                      className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
                    >
                      <Info className="h-3.5 w-3.5" />
                      <span>{showFormula ? 'Hide Formula Breakdown' : 'View Formula Breakdown'}</span>
                    </button>
                  </div>
                </Card>

                {/* 4 Health Tiles */}
                <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4">
                  {/* Tile 1: Blockers */}
                  <Card className="p-4 border-border/70 bg-card/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Open Blockers</span>
                      <div
                        className={`p-1.5 rounded-lg ${
                          healthData.open_blockers > 0
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        <AlertOctagon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {healthData.open_blockers}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {healthData.open_blockers === 0 ? 'Zero release-blocking issues' : 'Immediate fix required'}
                      </span>
                    </div>
                  </Card>

                  {/* Tile 2: Regressions */}
                  <Card className="p-4 border-border/70 bg-card/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Regressions</span>
                      <div
                        className={`p-1.5 rounded-lg ${
                          healthData.regressions_count > 0
                            ? 'bg-amber-500/20 text-amber-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        <Flame className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {healthData.regressions_count}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {healthData.regressions_count === 0 ? 'No active regressions' : 'Degraded feature risk'}
                      </span>
                    </div>
                  </Card>

                  {/* Tile 3: Unverified Fixes */}
                  <Card className="p-4 border-border/70 bg-card/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Unverified Fixes</span>
                      <div
                        className={`p-1.5 rounded-lg ${
                          healthData.unverified_fixes > 0
                            ? 'bg-primary/20 text-primary'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {healthData.unverified_fixes}
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {healthData.unverified_fixes === 0 ? 'All fixes verified by QA' : 'Pending QA sign-off'}
                      </span>
                    </div>
                  </Card>

                  {/* Tile 4: Completion Rate */}
                  <Card className="p-4 border-border/70 bg-card/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Release Completion</span>
                      <div className="p-1.5 rounded-lg bg-teal-500/20 text-teal-400">
                        <Rocket className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="font-mono text-2xl font-bold text-foreground">
                        {healthData.completion_rate}%
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        {healthData.resolved_issues} / {healthData.total_issues} defects resolved
                      </span>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Formula Transparency Drawer */}
              {showFormula && (
                <Card className="p-5 border-border/80 bg-secondary/15 space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      <span className="text-xs font-bold text-foreground uppercase tracking-wider font-mono">
                        Transparent Readiness Formula
                      </span>
                    </div>
                    <span className="text-[11px] text-muted-foreground font-mono">
                      Base 100 pts − Deductions = {healthData.readiness_score} pts
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-border/60 text-muted-foreground">
                          <th className="pb-2 font-semibold">Factor</th>
                          <th className="pb-2 font-semibold text-center">Defect Count</th>
                          <th className="pb-2 font-semibold text-center">Deduction / Unit</th>
                          <th className="pb-2 font-semibold text-right">Total Penalty</th>
                          <th className="pb-2 font-semibold pl-4">Rule Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40">
                        {healthData.formula_breakdown.deductions.map((d, i) => (
                          <tr key={i} className="hover:bg-secondary/30">
                            <td className="py-2.5 font-medium text-foreground">{d.factor}</td>
                            <td className="py-2.5 text-center font-mono text-foreground font-bold">{d.count}</td>
                            <td className="py-2.5 text-center font-mono text-muted-foreground">-{d.deduction_per_unit} pts</td>
                            <td className="py-2.5 text-right font-mono font-bold text-red-400">-{d.total_deduction} pts</td>
                            <td className="py-2.5 pl-4 text-muted-foreground text-[11px]">{d.explanation}</td>
                          </tr>
                        ))}
                        {healthData.formula_breakdown.deductions.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-3 text-center text-emerald-400 font-semibold">
                              ✓ Perfect Release Safety! No penalty deductions applied.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}

              {/* Automated Release Notes Generator Card */}
              <Card className="p-6 border-border/80 bg-card space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/20 text-primary">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold">Automated Release Notes</CardTitle>
                      <CardDescription className="text-xs">
                        Compiled directly from resolved features, fixes, and PR commit logs.
                      </CardDescription>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyNotes}
                      className="gap-1.5 text-xs h-8 border-border/70 hover:text-primary"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      <span>{copied ? 'Copied to Clipboard!' : 'Copy Markdown'}</span>
                    </Button>
                    <Button
                      type="button"
                      variant="glow"
                      size="sm"
                      onClick={handleDownloadNotes}
                      className="gap-1.5 text-xs h-8 font-semibold"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download .md</span>
                    </Button>
                  </div>
                </div>

                {/* Markdown Preview Area */}
                <div className="p-4 rounded-xl border border-border/60 bg-black/50 font-mono text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {healthData.release_notes_markdown}
                </div>
              </Card>
            </div>
          )}
        </div>
      ) : (
        /* VERSIONS & SPRINTS MANAGEMENT VIEW */
        <div className="space-y-8">
          {/* Versions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Project Release Versions</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {versions.length === 0 ? (
                <div className="col-span-3 rounded-lg border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground">
                  No release versions defined yet.
                </div>
              ) : (
                versions.map((rel) => (
                  <Card key={rel.id} className="border-border/80 bg-card/80">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-mono text-lg text-foreground">{rel.name}</CardTitle>
                        <Badge variant={rel.status === 'RELEASED' ? 'success' : 'info'}>
                          {rel.status}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{rel.release_date ? `Target: ${rel.release_date}` : 'No target date'}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground">{rel.description || 'No release notes.'}</p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Milestones List */}
          <div className="space-y-4 pt-4 border-t border-border/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-foreground">Sprints & Quality Milestones</h2>
              </div>
              {isManagerOrAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMilestoneModal(true)}
                  className="gap-1 text-xs"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Milestone</span>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {milestones.length === 0 ? (
                <div className="col-span-2 rounded-lg border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground">
                  No milestones active for this project yet.
                </div>
              ) : (
                milestones.map((ms) => (
                  <Card key={ms.id} className="border-border/80 bg-card/80">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base text-foreground">{ms.name}</CardTitle>
                        <Badge variant={ms.status === 'OPEN' ? 'warning' : 'secondary'}>{ms.status}</Badge>
                      </div>
                      <CardDescription className="text-xs">{ms.description || 'No sprint description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ms.due_date && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Clock className="h-3.5 w-3.5 text-amber-400" />
                          <span>Sprint Deadline: {new Date(ms.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">New Release</CardTitle>
                <CardDescription className="text-xs">Schedule a release tag for {activeProject?.name}.</CardDescription>
              </div>
              <button onClick={() => setShowVersionModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{error}</div>}
              <form onSubmit={handleCreateVersion} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Version Tag</label>
                  <Input placeholder="e.g. v2.5.0" value={verName} onChange={(e) => setVerName(e.target.value)} className="font-mono text-xs" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Target Date</label>
                  <Input type="date" value={verDate} onChange={(e) => setVerDate(e.target.value)} className="text-xs" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowVersionModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Create Release</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">New Milestone</CardTitle>
                <CardDescription className="text-xs">Create milestone sprint for {activeProject?.name}.</CardDescription>
              </div>
              <button onClick={() => setShowMilestoneModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {error && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{error}</div>}
              <form onSubmit={handleCreateMilestone} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Milestone Name</label>
                  <Input placeholder="e.g. Sprint 15" value={msName} onChange={(e) => setMsName(e.target.value)} className="text-xs" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Due Date</label>
                  <Input type="date" value={msDate} onChange={(e) => setMsDate(e.target.value)} className="text-xs" />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowMilestoneModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Create Milestone</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
