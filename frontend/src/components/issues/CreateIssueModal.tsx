import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import {
  Issue,
  IssueType,
  IssuePriority,
  IssueSeverity,
  Component,
  Version,
  Milestone,
  ProjectMember,
} from '../../types';
import {
  Bug,
  Sparkles,
  X,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  Calendar,
  Layers,
  User,
  Zap,
  HelpCircle,
  FileText,
  Flame,
  Wand2,
  Copy,
} from 'lucide-react';

interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onIssueCreated?: (issue: Issue) => void;
}

interface DuplicateMatch {
  issue_id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  similarity_score: number;
  reason: string;
}

export const CreateIssueModal: React.FC<CreateIssueModalProps> = ({
  isOpen,
  onClose,
  onIssueCreated,
}) => {
  const { user } = useAuth();
  const {
    projects,
    activeProject,
    getProjectMembers,
    getProjectComponents,
    getProjectVersions,
    getProjectMilestones,
  } = useProject();

  const [projectId, setProjectId] = useState<string>('');
  const [issueType, setIssueType] = useState<IssueType>('BUG');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<IssuePriority>('P2_MEDIUM');
  const [severity, setSeverity] = useState<IssueSeverity>('MAJOR');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [componentId, setComponentId] = useState<string>('');
  const [versionId, setVersionId] = useState<string>('');
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [environment, setEnvironment] = useState('');
  const [reproSteps, setReproSteps] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tagsInput, setTagsInput] = useState('');

  // AI & Duplicate Radar State
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [aiSynthesizing, setAiSynthesizing] = useState(false);
  const [showAiLogModal, setShowAiLogModal] = useState(false);
  const [rawLogText, setRawLogText] = useState('');

  // Dropdown data
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);

  useEffect(() => {
    if (activeProject) {
      setProjectId(activeProject.id);
    }
  }, [activeProject]);

  useEffect(() => {
    if (!projectId) return;
    const loadProjectData = async () => {
      try {
        const [m, c, v, ms] = await Promise.all([
          getProjectMembers(projectId),
          getProjectComponents(projectId),
          getProjectVersions(projectId),
          getProjectMilestones(projectId),
        ]);
        setMembers(m);
        setComponents(c);
        setVersions(v);
        setMilestones(ms);
      } catch {
        //
      }
    };
    loadProjectData();
  }, [projectId]);

  // Debounced Duplicate Detection Radar
  useEffect(() => {
    if (!projectId || title.trim().length < 4) {
      setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ duplicates: DuplicateMatch[]; isDuplicateRisk: boolean }>(
          '/ai/duplicates',
          { project_id: projectId, title, description }
        );
        setDuplicates(res.duplicates);
      } catch {
        //
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, projectId]);

  if (!isOpen) return null;

  const handleAiSynthesizeLog = async () => {
    if (!rawLogText.trim()) return;
    setAiSynthesizing(true);
    try {
      const extracted = await api.post<any>('/ai/extract', { raw_text: rawLogText });
      setTitle(extracted.title || title);
      setDescription(extracted.description || description);
      setReproSteps(extracted.repro_steps || reproSteps);
      setExpectedBehavior(extracted.expected_behavior || expectedBehavior);
      setActualBehavior(extracted.actual_behavior || actualBehavior);
      setEnvironment(extracted.environment || environment);
      if (extracted.suggested_priority) setPriority(extracted.suggested_priority);
      if (extracted.suggested_severity) setSeverity(extracted.suggested_severity);
      setShowAiLogModal(false);
      setRawLogText('');
    } catch {
      //
    } finally {
      setAiSynthesizing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Please provide a title and detailed description for this defect.');
      return;
    }

    setLoading(true);
    setError(null);

    const labels = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      const created = await api.post<Issue>('/issues', {
        project_id: projectId,
        title,
        description,
        issue_type: issueType,
        priority,
        severity,
        assignee_id: assigneeId || null,
        component_id: componentId || null,
        version_id: versionId || null,
        milestone_id: milestoneId || null,
        environment: environment || null,
        repro_steps: reproSteps || null,
        expected_behavior: expectedBehavior || null,
        actual_behavior: actualBehavior || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        labels,
      });

      setCreatedIssue(created);
      if (onIssueCreated) onIssueCreated(created);

      setTimeout(() => {
        handleReset();
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || 'Failed to submit bug report');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTitle('');
    setDescription('');
    setReproSteps('');
    setExpectedBehavior('');
    setActualBehavior('');
    setEnvironment('');
    setTagsInput('');
    setDuplicates([]);
    setCreatedIssue(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col bg-card border-border/80 shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/25 text-white">
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <span>Report Defect / Create Issue</span>
                <Badge variant="purple" className="font-mono text-[10px]">
                  {projects.find((p) => p.id === projectId)?.key || 'ISSUE'}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs">
                Provide structured reproduction steps or use AI Log Synthesizer for automated triage.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiLogModal(!showAiLogModal)}
              className="gap-1 text-xs h-7 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>AI Log Synthesizer</span>
            </Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>

        {/* Modal Body */}
        <CardContent className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* AI Log Synthesizer Expansion Drawer */}
          {showAiLogModal && (
            <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 space-y-3 animate-in slide-in-from-top-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Wand2 className="h-4 w-4" />
                  <span>Paste Raw Stack Trace or Customer Ticket</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Grok AI Triage Parser</span>
              </div>
              <textarea
                placeholder="Paste unformatted stack trace, error logs, or customer ticket text here..."
                value={rawLogText}
                onChange={(e) => setRawLogText(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-purple-500/30 bg-black/40 p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAiLogModal(false)}
                  className="text-xs h-7"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={handleAiSynthesizeLog}
                  disabled={aiSynthesizing || !rawLogText.trim()}
                  className="gap-1.5 text-xs h-7 font-semibold"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>{aiSynthesizing ? 'Synthesizing with Grok AI...' : 'Auto-Fill Fields'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* AI Duplicate Detection Radar Banner */}
          {duplicates.length > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-500/40 bg-amber-500/10 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                  <Flame className="h-4 w-4" />
                  <span>Duplicate Radar Warning ({duplicates[0].similarity_score}% Match)</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">Potential duplicates detected</span>
              </div>
              <div className="space-y-1.5">
                {duplicates.map((d) => (
                  <div
                    key={d.issue_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-amber-500/20 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{d.key}</span>
                      <span className="text-foreground line-clamp-1">{d.title}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {d.similarity_score}% SIMILAR
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {d.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Success Banner */}
          {createdIssue ? (
            <div className="py-12 text-center space-y-4 animate-in zoom-in-95">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-foreground">
                  Issue <span className="text-primary font-mono">{createdIssue.key}</span> Created Successfully!
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  Audit trail recorded, notifications triggered, and ticket routed into sprint triage.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} id="create-issue-form" className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Row 1: Project & Issue Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <span>Target Project</span>
                    <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.key})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-foreground">Issue Type</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['BUG', 'FEATURE', 'TASK', 'IMPROVEMENT'] as IssueType[]).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setIssueType(type)}
                        className={`h-9 rounded-md border text-[11px] font-semibold transition-all flex items-center justify-center ${
                          issueType === type
                            ? 'border-primary bg-primary/15 text-primary shadow-sm'
                            : 'border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary/60'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Summary / Title</span>
                  <span className="text-red-400">*</span>
                </label>
                <Input
                  placeholder="e.g. Checkout crashes when applying expired coupon code"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs font-medium"
                  required
                />
              </div>

              {/* Row 3: Priority, Severity, Component, Assignee */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as IssuePriority)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="P0_CRITICAL">P0 Critical (Urgent)</option>
                    <option value="P1_HIGH">P1 High</option>
                    <option value="P2_MEDIUM">P2 Medium</option>
                    <option value="P3_LOW">P3 Low</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Severity</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as IssueSeverity)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="BLOCKER">Blocker (Outage)</option>
                    <option value="CRITICAL">Critical</option>
                    <option value="MAJOR">Major</option>
                    <option value="MINOR">Minor</option>
                    <option value="TRIVIAL">Trivial</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Component</label>
                  <select
                    value={componentId}
                    onChange={(e) => setComponentId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- No Component --</option>
                    {components.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Unassigned --</option>
                    {members.map((m) => (
                      <option key={m.user_id} value={m.user_id}>
                        {m.user?.full_name || 'Engineer'} ({m.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Reproduction Steps & Detailed Context */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Steps to Reproduce</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Numbered sequence</span>
                </label>
                <textarea
                  placeholder="1. Open product page&#10;2. Add item to cart&#10;3. Apply coupon code SUMMER2025&#10;4. Click Apply"
                  value={reproSteps}
                  onChange={(e) => setReproSteps(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-secondary/50 p-2.5 text-xs text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Row 5: Expected vs Actual Behavior */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Expected Behavior</label>
                  <textarea
                    placeholder="Coupon validation error displayed: 'Coupon expired'."
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Actual Behavior</label>
                  <textarea
                    placeholder="Page crashes with 500 server error and blank cart state."
                    value={actualBehavior}
                    onChange={(e) => setActualBehavior(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              </div>

              {/* Row 6: Description & Stack Trace */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Detailed Description & Diagnostics</span>
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Describe technical context, error logs, or relevant database state..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-secondary/50 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              {/* Row 7: Environment, Release, Milestone, Labels */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Environment</label>
                  <Input
                    placeholder="Chrome 128 / macOS 15.1"
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value)}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Target Release</label>
                  <select
                    value={versionId}
                    onChange={(e) => setVersionId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- None --</option>
                    {versions.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Milestone / Sprint</label>
                  <select
                    value={milestoneId}
                    onChange={(e) => setMilestoneId(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-secondary/50 px-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- None --</option>
                    {milestones.map((ms) => (
                      <option key={ms.id} value={ms.id}>
                        {ms.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 8: Tags / Labels */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Labels (comma-separated)</label>
                <Input
                  placeholder="e.g. checkout, coupon, payment, regression"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="text-xs"
                />
              </div>
            </form>
          )}
        </CardContent>

        {/* Modal Footer */}
        {!createdIssue && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-secondary/20 shrink-0">
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              <span>Grok AI Duplicate Radar Active</span>
            </div>

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                form="create-issue-form"
                variant="glow"
                size="sm"
                className="gap-1.5 font-semibold"
                disabled={loading}
              >
                <Bug className="h-3.5 w-3.5" />
                <span>{loading ? 'Generating Issue Key...' : 'Submit Defect Ticket'}</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
