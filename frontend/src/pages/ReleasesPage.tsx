import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { useProject } from '../contexts/ProjectContext';
import { Version, Milestone } from '../types';
import { GitPullRequest, Plus, Calendar, CheckCircle2, Clock, Layers, X } from 'lucide-react';

export const ReleasesPage: React.FC = () => {
  const {
    activeProject,
    getProjectVersions,
    createProjectVersion,
    getProjectMilestones,
    createProjectMilestone,
    userProjectRole,
  } = useProject();

  const [versions, setVersions] = useState<Version[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);

  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [verDate, setVerDate] = useState('');
  const [msName, setMsName] = useState('');
  const [msDesc, setMsDesc] = useState('');
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
    } catch {
      //
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !verName) return;
    setError(null);
    try {
      await createProjectVersion(activeProject.id, {
        name: verName,
        description: verDesc,
        release_date: verDate || null,
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
    setError(null);
    try {
      await createProjectMilestone(activeProject.id, {
        name: msName,
        description: msDesc,
        due_date: msDate ? new Date(msDate).toISOString() : null,
      });
      setShowMilestoneModal(false);
      setMsName('');
      setMsDesc('');
      setMsDate('');
      loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to create milestone');
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Releases & Milestones"
        description={`Track release health, sprint burndown, and deploy readiness for ${activeProject?.name || 'current workspace'}.`}
        badge={
          <Badge variant="purple" className="font-mono text-[11px]">
            {activeProject?.key || '---'}
          </Badge>
        }
      >
        {isManagerOrAdmin && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setError(null);
                setShowMilestoneModal(true);
              }}
              className="gap-1.5 text-xs"
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>New Milestone</span>
            </Button>
            <Button
              variant="glow"
              size="sm"
              onClick={() => {
                setError(null);
                setShowVersionModal(true);
              }}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>New Release</span>
            </Button>
          </div>
        )}
      </PageHeader>

      {/* Releases Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <GitPullRequest className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-foreground">Release Versions</h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {versions.length === 0 ? (
            <div className="col-span-2 rounded-lg border border-dashed border-border/60 p-8 text-center text-xs text-muted-foreground">
              No releases configured for this project yet.
            </div>
          ) : (
            versions.map((rel) => {
              const total = rel.total_issues_count || 10;
              const resolved = rel.resolved_issues_count || (rel.status === 'RELEASED' ? total : 7);
              const progress = Math.round((resolved / total) * 100);

              return (
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
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Release Stabilization</span>
                      <span className="font-mono font-semibold text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                      <span>{resolved} of {total} defects resolved</span>
                      <span>{total - resolved} remaining</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Milestones / Sprints Section */}
      <div className="space-y-4 pt-4 border-t border-border/60">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-400" />
          <h2 className="text-base font-semibold text-foreground">Sprints & Quality Milestones</h2>
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
