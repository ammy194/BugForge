import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Avatar } from '../components/ui/avatar';
import { useProject } from '../contexts/ProjectContext';
import { useAuth } from '../contexts/AuthContext';
import { Project, ProjectMember, Component, Version, Milestone, ProjectRole, UserProfile } from '../types';
import { api } from '../lib/api';
import {
  FolderGit2,
  Users,
  Bug,
  CheckCircle,
  Plus,
  Settings,
  Layers,
  GitPullRequest,
  Calendar,
  Shield,
  Trash2,
  Edit2,
  X,
  AlertTriangle,
  Lock,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    projects,
    activeProject,
    selectProject,
    userProjectRole,
    createProject,
    getProjectMembers,
    addProjectMember,
    updateProjectMemberRole,
    removeProjectMember,
    getProjectComponents,
    createProjectComponent,
    getProjectVersions,
    createProjectVersion,
    getProjectMilestones,
    createProjectMilestone,
  } = useProject();

  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'components' | 'releases' | 'milestones' | 'settings'>('overview');
  
  // Data for active project tabs
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // Modals state
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddComponentModal, setShowAddComponentModal] = useState(false);
  const [showAddVersionModal, setShowAddVersionModal] = useState(false);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);

  // Forms state
  const [newProjKey, setNewProjKey] = useState('');
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedMemberRole, setSelectedMemberRole] = useState<ProjectRole>('DEVELOPER');
  const [compName, setCompName] = useState('');
  const [compDesc, setCompDesc] = useState('');
  const [compAssignee, setCompAssignee] = useState('');
  const [verName, setVerName] = useState('');
  const [verDesc, setVerDesc] = useState('');
  const [verDate, setVerDate] = useState('');
  const [msName, setMsName] = useState('');
  const [msDesc, setMsDesc] = useState('');
  const [msDate, setMsDate] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  // Permissions check
  const isManagerOrAdmin = userProjectRole === 'ADMIN' || userProjectRole === 'PROJECT_MANAGER';
  const isAdmin = userProjectRole === 'ADMIN';

  const loadTabData = async () => {
    if (!activeProject) return;
    setLoadingTab(true);
    try {
      const [m, c, v, ms, u] = await Promise.all([
        getProjectMembers(activeProject.id),
        getProjectComponents(activeProject.id),
        getProjectVersions(activeProject.id),
        getProjectMilestones(activeProject.id),
        api.get<UserProfile[]>('/users').catch(() => []),
      ]);
      setMembers(m);
      setComponents(c);
      setVersions(v);
      setMilestones(ms);
      setAllUsers(u);
    } catch {
      // Ignore
    } finally {
      setLoadingTab(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeProject]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      await createProject({ key: newProjKey, name: newProjName, description: newProjDesc });
      setShowNewProjectModal(false);
      setNewProjKey('');
      setNewProjName('');
      setNewProjDesc('');
    } catch (err: any) {
      setActionError(err.message || 'Failed to create project');
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !selectedUserId) return;
    setActionError(null);
    try {
      await addProjectMember(activeProject.id, selectedUserId, selectedMemberRole);
      setShowAddMemberModal(false);
      loadTabData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to add member');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: ProjectRole) => {
    if (!activeProject) return;
    try {
      await updateProjectMemberRole(activeProject.id, userId, newRole);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeProject || !confirm('Remove this user from the project?')) return;
    try {
      await removeProjectMember(activeProject.id, userId);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const handleAddComponent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !compName) return;
    setActionError(null);
    try {
      await createProjectComponent(activeProject.id, {
        name: compName,
        description: compDesc,
        default_assignee_id: compAssignee || null,
      });
      setShowAddComponentModal(false);
      setCompName('');
      setCompDesc('');
      setCompAssignee('');
      loadTabData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create component');
    }
  };

  const handleAddVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !verName) return;
    setActionError(null);
    try {
      await createProjectVersion(activeProject.id, {
        name: verName,
        description: verDesc,
        release_date: verDate || null,
      });
      setShowAddVersionModal(false);
      setVerName('');
      setVerDesc('');
      setVerDate('');
      loadTabData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create release');
    }
  };

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject || !msName) return;
    setActionError(null);
    try {
      await createProjectMilestone(activeProject.id, {
        name: msName,
        description: msDesc,
        due_date: msDate ? new Date(msDate).toISOString() : null,
      });
      setShowAddMilestoneModal(false);
      setMsName('');
      setMsDesc('');
      setMsDate('');
      loadTabData();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create milestone');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <PageHeader
        title="Project Workspaces & RBAC Governance"
        description="Organize issues by project, enforce role-based access, and configure components & releases."
      >
        <Button
          variant="glow"
          size="sm"
          onClick={() => {
            setActionError(null);
            setShowNewProjectModal(true);
          }}
          className="gap-1.5 text-xs font-semibold"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Project</span>
        </Button>
      </PageHeader>

      {/* Projects Grid Selector */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const isSelected = activeProject?.id === p.id;
          return (
            <Card
              key={p.id}
              onClick={() => selectProject(p)}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? 'border-primary ring-1 ring-primary shadow-lg shadow-primary/10 bg-card/90'
                  : 'hover:border-border/80 hover:bg-card/70'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant={isSelected ? 'default' : 'purple'} className="font-mono text-xs">
                    {p.key}
                  </Badge>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>{p.members_count || 1}</span>
                  </div>
                </div>
                <CardTitle className="text-base mt-2 flex items-center justify-between">
                  <span>{p.name}</span>
                  {isSelected && (
                    <span className="text-[10px] uppercase font-mono font-bold text-primary">
                      Active
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-1">
                  {p.description || 'No description provided.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Bug className="h-3.5 w-3.5 text-red-400" />
                    <span><strong>{p.open_issues_count || 0}</strong> Open</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                    <span><strong>{p.resolved_issues_count || 0}</strong> Resolved</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Active Project Management Deep-Dive Workspace */}
      {activeProject && (
        <Card className="border-border/80 bg-card/80">
          {/* Workspace Tabs Header */}
          <div className="flex items-center justify-between border-b border-border/60 px-6 pt-4 overflow-x-auto">
            <div className="flex items-center gap-1 sm:gap-2">
              {[
                { id: 'overview', label: 'Overview', icon: FolderGit2 },
                { id: 'members', label: `Members (${members.length})`, icon: Users },
                { id: 'components', label: `Components (${components.length})`, icon: Layers },
                { id: 'releases', label: `Releases (${versions.length})`, icon: GitPullRequest },
                { id: 'milestones', label: `Milestones (${milestones.length})`, icon: Calendar },
                { id: 'settings', label: 'Settings', icon: Settings },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                      isActive
                        ? 'border-primary text-primary font-semibold'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="hidden sm:flex items-center gap-2 pb-2">
              <span className="text-[11px] text-muted-foreground">Your Role:</span>
              <Badge variant="default" className="text-[10px] font-mono">
                {userProjectRole}
              </Badge>
            </div>
          </div>

          <CardContent className="p-6">
            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                    <span className="text-xs text-muted-foreground">Project Key Prefix</span>
                    <div className="text-2xl font-bold font-mono text-primary mt-1">{activeProject.key}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Issue sequence: {activeProject.key}-101, {activeProject.key}-102...</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                    <span className="text-xs text-muted-foreground">Team Capacity</span>
                    <div className="text-2xl font-bold text-foreground mt-1">{members.length} Engineers</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Across 4 permission tiers</p>
                  </div>
                  <div className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                    <span className="text-xs text-muted-foreground">Architecture Components</span>
                    <div className="text-2xl font-bold text-foreground mt-1">{components.length} Modules</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Checkout, Auth, API, Catalog...</p>
                  </div>
                </div>

                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-semibold text-primary">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>RBAC Matrix Enforcement</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Permissions in BugForge are checked at both the Express business route layer and PostgreSQL Row-Level Security. A user can be a Developer in <strong>{activeProject.name}</strong> while holding a Reporter role in another workspace.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Members & Roles */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Project Members & Access Control</h4>
                    <p className="text-xs text-muted-foreground">Assign roles to control issue triage, verification, and settings permissions.</p>
                  </div>
                  {isManagerOrAdmin && (
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setShowAddMemberModal(true);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Member</span>
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border border-border/60 divide-y divide-border/60 overflow-hidden">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3.5 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar fallback={m.user?.full_name || 'Member'} src={m.user?.avatar_url} size="sm" />
                        <div>
                          <div className="text-xs font-semibold text-foreground">{m.user?.full_name || 'User'}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">{m.user?.email}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isManagerOrAdmin ? (
                          <select
                            value={m.role}
                            onChange={(e) => handleUpdateRole(m.user_id, e.target.value as ProjectRole)}
                            className="h-8 rounded-md border border-input bg-secondary/80 px-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="PROJECT_MANAGER">PROJECT_MANAGER</option>
                            <option value="DEVELOPER">DEVELOPER</option>
                            <option value="REPORTER">REPORTER</option>
                          </select>
                        ) : (
                          <Badge variant="default" className="font-mono text-xs">{m.role}</Badge>
                        )}

                        {isManagerOrAdmin && (
                          <button
                            onClick={() => handleRemoveMember(m.user_id)}
                            title="Remove member"
                            className="p-1 rounded text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Components */}
            {activeTab === 'components' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Subsystems & Components</h4>
                    <p className="text-xs text-muted-foreground">Categorize defects by architectural module with default assignee routing.</p>
                  </div>
                  {isManagerOrAdmin && (
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setShowAddComponentModal(true);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Component</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {components.map((c) => (
                    <div key={c.id} className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-foreground">{c.name}</span>
                        <Layers className="h-4 w-4 text-primary" />
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{c.description || 'No description'}</p>
                      {c.default_assignee && (
                        <div className="pt-2 border-t border-border/40 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                          <span>Default: </span>
                          <strong className="text-foreground">{c.default_assignee.full_name}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Releases */}
            {activeTab === 'releases' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Releases & Version Health</h4>
                    <p className="text-xs text-muted-foreground">Track release stabilization and defect burndown.</p>
                  </div>
                  {isManagerOrAdmin && (
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setShowAddVersionModal(true);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Release</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {versions.map((v) => (
                    <div key={v.id} className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-foreground">{v.name}</span>
                        <Badge variant={v.status === 'RELEASED' ? 'success' : 'info'}>{v.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{v.description || 'No release notes.'}</p>
                      {v.release_date && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Target: {v.release_date}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Milestones */}
            {activeTab === 'milestones' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Sprints & Milestones</h4>
                    <p className="text-xs text-muted-foreground">Time-boxed defect burndowns and launch milestones.</p>
                  </div>
                  {isManagerOrAdmin && (
                    <Button
                      variant="glow"
                      size="sm"
                      onClick={() => {
                        setActionError(null);
                        setShowAddMilestoneModal(true);
                      }}
                      className="gap-1 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>New Milestone</span>
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {milestones.map((ms) => (
                    <div key={ms.id} className="rounded-lg border border-border/60 bg-secondary/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm text-foreground">{ms.name}</span>
                        <Badge variant={ms.status === 'OPEN' ? 'warning' : 'secondary'}>{ms.status}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{ms.description || 'No description.'}</p>
                      {ms.due_date && (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-mono">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Due: {new Date(ms.due_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: Settings */}
            {activeTab === 'settings' && (
              <div className="space-y-6 max-w-2xl">
                {!isAdmin && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 flex items-center gap-2">
                    <Lock className="h-4 w-4 shrink-0" />
                    <span>Project settings modifications require ADMIN role permissions.</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Project Name</label>
                    <Input defaultValue={activeProject.name} disabled={!isAdmin} className="text-xs" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Project Key (Immutable)</label>
                    <Input defaultValue={activeProject.key} disabled className="text-xs font-mono bg-secondary/80" />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground">Description</label>
                    <textarea
                      defaultValue={activeProject.description}
                      disabled={!isAdmin}
                      rows={3}
                      className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                    />
                  </div>

                  {isAdmin && (
                    <div className="pt-4 border-t border-border/60">
                      <Button variant="destructive" size="sm" className="gap-1.5 text-xs">
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Archive Project</span>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* --- Modals --- */}

      {/* 1. New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Create New Project</CardTitle>
                <CardDescription className="text-xs">Initialize a new defect workspace with custom key.</CardDescription>
              </div>
              <button onClick={() => setShowNewProjectModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {actionError && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{actionError}</div>}
              <form onSubmit={handleCreateProject} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Project Key (2-10 uppercase chars)</label>
                  <Input
                    placeholder="e.g. AUTH, BILL, MOBILE"
                    value={newProjKey}
                    onChange={(e) => setNewProjKey(e.target.value.toUpperCase())}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Project Name</label>
                  <Input
                    placeholder="e.g. Cloud Billing Microservice"
                    value={newProjName}
                    onChange={(e) => setNewProjName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                  <textarea
                    placeholder="Describe the repository or product scope..."
                    value={newProjDesc}
                    onChange={(e) => setNewProjDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-input bg-secondary/50 p-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowNewProjectModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Create Workspace</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 2. Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">Add Project Member</CardTitle>
                <CardDescription className="text-xs">Select user and assign their project-level role.</CardDescription>
              </div>
              <button onClick={() => setShowAddMemberModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {actionError && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{actionError}</div>}
              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Select User</label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                  >
                    <option value="">-- Choose User --</option>
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.email})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Project Role</label>
                  <select
                    value={selectedMemberRole}
                    onChange={(e) => setSelectedMemberRole(e.target.value as ProjectRole)}
                    className="w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="DEVELOPER">DEVELOPER (Code, commits, PRs)</option>
                    <option value="PROJECT_MANAGER">PROJECT_MANAGER (Triage, releases, members)</option>
                    <option value="REPORTER">REPORTER (Report bugs, verify QA)</option>
                    <option value="ADMIN">ADMIN (Full Project Control)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMemberModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Add to Project</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. Add Component Modal */}
      {showAddComponentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">New Subsystem Component</CardTitle>
                <CardDescription className="text-xs">Define a project module or architectural service.</CardDescription>
              </div>
              <button onClick={() => setShowAddComponentModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {actionError && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{actionError}</div>}
              <form onSubmit={handleAddComponent} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Component Name</label>
                  <Input
                    placeholder="e.g. Search Indexer, Billing Gateway"
                    value={compName}
                    onChange={(e) => setCompName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Description (Optional)</label>
                  <Input
                    placeholder="e.g. ElasticSearch cluster and query parsing"
                    value={compDesc}
                    onChange={(e) => setCompDesc(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddComponentModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Save Component</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 4. Add Version Modal */}
      {showAddVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">New Release Version</CardTitle>
                <CardDescription className="text-xs">Create a release tag for defect tracking.</CardDescription>
              </div>
              <button onClick={() => setShowAddVersionModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {actionError && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{actionError}</div>}
              <form onSubmit={handleAddVersion} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Version Tag</label>
                  <Input
                    placeholder="e.g. v2.5.0"
                    value={verName}
                    onChange={(e) => setVerName(e.target.value)}
                    className="font-mono text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Target Release Date</label>
                  <Input
                    type="date"
                    value={verDate}
                    onChange={(e) => setVerDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddVersionModal(false)}>Cancel</Button>
                  <Button type="submit" variant="glow" size="sm">Create Release</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 5. Add Milestone Modal */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-md bg-card border-border/80 shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">New Sprint / Milestone</CardTitle>
                <CardDescription className="text-xs">Schedule sprint deadlines and milestones.</CardDescription>
              </div>
              <button onClick={() => setShowAddMilestoneModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </CardHeader>
            <CardContent>
              {actionError && <div className="rounded border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-400 mb-3">{actionError}</div>}
              <form onSubmit={handleAddMilestone} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Milestone Name</label>
                  <Input
                    placeholder="e.g. Sprint 15 - Payment Hardening"
                    value={msName}
                    onChange={(e) => setMsName(e.target.value)}
                    className="text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground">Due Date</label>
                  <Input
                    type="date"
                    value={msDate}
                    onChange={(e) => setMsDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddMilestoneModal(false)}>Cancel</Button>
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
