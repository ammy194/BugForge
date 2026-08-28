import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { AITriageInspector, AITriageData } from './AITriageInspector';
import { BugQualityMeter, BugQualityScoreData } from './BugQualityMeter';
import { DuplicateResolutionCard, DuplicateCandidate } from './DuplicateResolutionCard';
import { SmartAssignmentCard, SmartAssignmentData } from './SmartAssignmentCard';
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
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [ignoredDuplicates, setIgnoredDuplicates] = useState(false);
  const [aiSynthesizing, setAiSynthesizing] = useState(false);
  const [showAiLogModal, setShowAiLogModal] = useState(false);
  const [rawLogText, setRawLogText] = useState('');

  // AI Triage Inspector State
  const [triageData, setTriageData] = useState<AITriageData | null>(null);
  const [analyzingTriage, setAnalyzingTriage] = useState(false);

  // Smart Assignment State
  const [assignmentData, setAssignmentData] = useState<SmartAssignmentData | null>(null);

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

  // Compute live Bug Quality Score locally
  const qualityScoreData: BugQualityScoreData = useMemo(() => {
    const checklist = [
      {
        id: 'title',
        label: 'Clear & Actionable Title',
        passed: title.trim().length >= 10 && !/^(bug|error|broken|fix|issue)$/i.test(title.trim()),
        points: 15,
        tip: 'Provide a specific summary (e.g. "Checkout crashes on expired coupon")',
      },
      {
        id: 'description',
        label: 'Detailed Description',
        passed: description.trim().length >= 25,
        points: 15,
        tip: 'Include detailed background and stack trace',
      },
      {
        id: 'repro_steps',
        label: 'Numbered Reproduction Steps',
        passed: /\b(1\.|2\.|step)/i.test(reproSteps) || reproSteps.trim().length >= 25,
        points: 20,
        tip: 'Add step-by-step sequence (1. Open cart, 2. Apply code)',
      },
      {
        id: 'expected_behavior',
        label: 'Expected Behavior',
        passed: expectedBehavior.trim().length >= 10,
        points: 10,
        tip: 'State expected outcome under normal operation',
      },
      {
        id: 'actual_behavior',
        label: 'Actual Observed Failure',
        passed: actualBehavior.trim().length >= 10,
        points: 10,
        tip: 'State observed error code or visual symptom',
      },
      {
        id: 'environment',
        label: 'Environment (Browser / OS / Node)',
        passed: environment.trim().length >= 4,
        points: 10,
        tip: 'Specify Chrome/Firefox, macOS/Windows or Node 22',
      },
      {
        id: 'component',
        label: 'Subsystem Component Selected',
        passed: Boolean(componentId && componentId.length > 0),
        points: 10,
        tip: 'Route this ticket to a component (e.g. Checkout & Cart)',
      },
      {
        id: 'version',
        label: 'Target Release Version Tagged',
        passed: Boolean(versionId && versionId.length > 0),
        points: 10,
        tip: 'Tag target release (e.g. v2.4.0)',
      },
    ];

    const score = checklist.filter((c) => c.passed).reduce((sum, c) => sum + c.points, 0);
    let rating: BugQualityScoreData['rating'] = 'POOR';
    if (score >= 85) rating = 'EXCELLENT';
    else if (score >= 70) rating = 'GOOD';
    else if (score >= 50) rating = 'FAIR';

    return {
      score,
      rating,
      checklist,
      recommendations: checklist.filter((c) => !c.passed).map((c) => c.tip || c.label),
    };
  }, [title, description, reproSteps, expectedBehavior, actualBehavior, environment, componentId, versionId]);

  // Debounced Duplicate Detection Radar
  useEffect(() => {
    if (!projectId || title.trim().length < 4 || ignoredDuplicates) {
      if (!ignoredDuplicates) setDuplicates([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.post<{ duplicates: DuplicateCandidate[]; isDuplicateRisk: boolean }>(
          '/ai/duplicates',
          { project_id: projectId, title, description }
        );
        setDuplicates(res.duplicates);
      } catch {
        //
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [title, description, projectId, ignoredDuplicates]);

  // Debounced Smart Assignment Recommendation
  useEffect(() => {
    if (!projectId || title.trim().length < 4) {
      setAssignmentData(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await api.post<SmartAssignmentData>('/issues/suggest-assignee', {
          project_id: projectId,
          component_id: componentId || undefined,
          title,
          description,
          priority,
        });
        setAssignmentData(res);
      } catch {
        //
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [title, description, componentId, priority, projectId]);

  if (!isOpen) return null;

  const handleAnalyzeWithAI = async () => {
    if (!title.trim()) {
      setError('Please provide at least a bug summary/title to analyze.');
      return;
    }

    setAnalyzingTriage(true);
    setError(null);
    try {
      const res = await api.post<AITriageData>('/ai/triage', {
        title,
        description,
        project_id: projectId,
      });
      setTriageData(res);
    } catch (err: any) {
      setError(err.message || 'AI Triage analysis failed');
    } finally {
      setAnalyzingTriage(false);
    }
  };

  const handleAcceptAllTriage = () => {
    if (!triageData) return;
    setPriority(triageData.suggested_priority);
    setSeverity(triageData.suggested_severity);
    if (triageData.suggested_component_id) {
      setComponentId(triageData.suggested_component_id);
    }
    if (triageData.suggested_labels.length > 0) {
      const existing = tagsInput ? tagsInput.split(',').map((t) => t.trim()) : [];
      const combined = Array.from(new Set([...existing, ...triageData.suggested_labels])).join(', ');
      setTagsInput(combined);
    }
    setTriageData(null);
  };

  const handleAcceptPrioritySeverity = (p: IssuePriority, s: IssueSeverity) => {
    setPriority(p);
    setSeverity(s);
  };

  const handleAcceptComponent = (cId?: string) => {
    if (cId) setComponentId(cId);
  };

  const handleAcceptLabels = (labels: string[]) => {
    const existing = tagsInput ? tagsInput.split(',').map((t) => t.trim()) : [];
    const combined = Array.from(new Set([...existing, ...labels])).join(', ');
    setTagsInput(combined);
  };

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

  const handleOpenExistingDuplicate = (key: string) => {
    window.open(`/issues/${key}`, '_blank');
  };

  const handleMarkAsDuplicateAndClose = (key: string) => {
    alert(`Marked current draft as duplicate of existing issue ${key}. Form dismissed.`);
    handleReset();
    onClose();
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
    setIgnoredDuplicates(false);
    setTriageData(null);
    setAssignmentData(null);
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
                Structured reproduction workflow with live Quality Score & Smart Assignee recommendations.
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAnalyzeWithAI}
              disabled={analyzingTriage || !title.trim()}
              className="gap-1 text-xs h-7 border-purple-500/40 text-purple-300 hover:bg-purple-500/10"
            >
              <Sparkles className="h-3 w-3 text-purple-400" />
              <span>{analyzingTriage ? 'Triaging...' : 'Analyze with AI'}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowAiLogModal(!showAiLogModal)}
              className="gap-1 text-xs h-7 border-border/60 text-muted-foreground hover:text-foreground"
            >
              <Wand2 className="h-3 w-3" />
              <span>Paste Log</span>
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
          {/* Live Bug Quality Score Meter */}
          <BugQualityMeter scoreData={qualityScoreData} />

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

          {/* AI Triage Inspector Component */}
          <AITriageInspector
            triageData={triageData}
            loading={analyzingTriage}
            onAcceptAll={handleAcceptAllTriage}
            onAcceptPrioritySeverity={handleAcceptPrioritySeverity}
            onAcceptComponent={handleAcceptComponent}
            onAcceptLabels={handleAcceptLabels}
            onDismiss={() => setTriageData(null)}
          />

          {/* 2-Tier Duplicate Radar Resolution Card */}
          {duplicates.length > 0 && !ignoredDuplicates && (
            <DuplicateResolutionCard
              duplicates={duplicates}
              onOpenExisting={handleOpenExistingDuplicate}
              onMarkAsDuplicate={handleMarkAsDuplicateAndClose}
              onContinueCreating={() => setIgnoredDuplicates(true)}
              onCancel={() => {
                handleReset();
                onClose();
              }}
            />
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
                  placeholder="e.g. App crashes when uploading large profile image"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-xs font-medium"
                  required
                />
              </div>

              {/* Smart Assignee Recommendation Card */}
              {assignmentData && (
                <SmartAssignmentCard
                  assignmentData={assignmentData}
                  currentAssigneeId={assigneeId}
                  onConfirmAssignee={(uid) => setAssigneeId(uid)}
                />
              )}

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
                  placeholder="1. Open profile settings page&#10;2. Click upload avatar&#10;3. Select 25MB JPEG image&#10;4. Click Save"
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
                    placeholder="Image is resized and cropped to profile dimensions."
                    value={expectedBehavior}
                    onChange={(e) => setExpectedBehavior(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Actual Behavior</label>
                  <textarea
                    placeholder="Page crashes with 500 server error and out of memory dump."
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
                  <span>Detailed Description & Technical Logs</span>
                  <span className="text-red-400">*</span>
                </label>
                <textarea
                  placeholder="Uploading an image above 20MB crashes the profile page."
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
                  placeholder="e.g. upload, crash, performance, profile"
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
              <span>Smart Routing & AI Radar Active</span>
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
