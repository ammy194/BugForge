import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, ProjectMember, Component, Version, Milestone, ProjectRole } from '../types';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

interface ProjectContextType {
  projects: Project[];
  activeProject: Project | null;
  userProjectRole: ProjectRole | 'ADMIN';
  loading: boolean;
  selectProject: (projectOrKey: string | Project) => void;
  refreshProjects: () => Promise<void>;
  createProject: (data: { key: string; name: string; description?: string }) => Promise<Project>;
  getProjectMembers: (projectId?: string) => Promise<ProjectMember[]>;
  addProjectMember: (projectId: string, userId: string, role: ProjectRole) => Promise<ProjectMember>;
  updateProjectMemberRole: (projectId: string, userId: string, role: ProjectRole) => Promise<ProjectMember>;
  removeProjectMember: (projectId: string, userId: string) => Promise<void>;
  getProjectComponents: (projectId?: string) => Promise<Component[]>;
  createProjectComponent: (projectId: string, data: { name: string; description?: string; default_assignee_id?: string | null }) => Promise<Component>;
  getProjectVersions: (projectId?: string) => Promise<Version[]>;
  createProjectVersion: (projectId: string, data: { name: string; description?: string; status?: any; release_date?: string | null }) => Promise<Version>;
  getProjectMilestones: (projectId?: string) => Promise<Milestone[]>;
  createProjectMilestone: (projectId: string, data: { name: string; description?: string; status?: any; due_date?: string | null }) => Promise<Milestone>;
  isAutoSimulating: boolean;
  setAutoSimulating: (value: boolean) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [userProjectRole, setUserProjectRole] = useState<ProjectRole | 'ADMIN'>('DEVELOPER');
  const [loading, setLoading] = useState<boolean>(true);

  const refreshProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await api.get<Project[]>('/projects');
      const projectsList = Array.isArray(list) ? list : [];
      setProjects(projectsList);

      // Restore active project or default to first project
      const savedKey = localStorage.getItem('bugforge_active_project_key');
      const found = projectsList.find((p) => p.key === savedKey) || projectsList[0] || null;
      setActiveProject(found);
      if (found) {
        localStorage.setItem('bugforge_active_project_key', found.key);
      }
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const [isAutoSimulating, setAutoSimulating] = useState(() => {
    const saved = localStorage.getItem('bugforge_auto_simulate');
    return saved !== null ? saved === 'true' : true; // Default to TRUE
  });

  useEffect(() => {
    localStorage.setItem('bugforge_auto_simulate', String(isAutoSimulating));
    let interval: number | undefined;

    if (isAutoSimulating && user) {
      interval = window.setInterval(async () => {
        try {
          await api.post('/issues/simulate-random');
          // Force UI refresh (notifications will be fetched by Navbar polling or we could trigger a global event)
          // Actually, Navbar fetches on click, but for a true live feel, let's just let the endpoint create the issue.
          // The issue list will refresh when they navigate to it.
        } catch (e) {
          console.error('Auto-simulate failed', e);
        }
      }, 30000); // Every 30 seconds
    }

    return () => clearInterval(interval);
  }, [isAutoSimulating, user]);

  useEffect(() => {
    refreshProjects();
  }, [user]);
  // Update effective role when active project or user changes
  useEffect(() => {
    const resolveRole = async () => {
      if (!user || !activeProject) return;
      if (user.global_role === 'ADMIN') {
        setUserProjectRole('ADMIN');
        return;
      }
      try {
        const members = await api.get<ProjectMember[]>(`/projects/${activeProject.id}/members`);
        const me = members.find((m) => m.user_id === user.id);
        setUserProjectRole(me ? me.role : (user.global_role as any));
      } catch {
        setUserProjectRole(user.global_role as any);
      }
    };
    resolveRole();
  }, [activeProject, user]);

  const selectProject = (projectOrKey: string | Project) => {
    if (typeof projectOrKey === 'string') {
      const found = projects.find((p) => p.key === projectOrKey || p.id === projectOrKey);
      if (found) {
        setActiveProject(found);
        localStorage.setItem('bugforge_active_project_key', found.key);
      }
    } else {
      setActiveProject(projectOrKey);
      localStorage.setItem('bugforge_active_project_key', projectOrKey.key);
    }
  };

  const createProject = async (data: { key: string; name: string; description?: string }) => {
    const created = await api.post<Project>('/projects', data);
    await refreshProjects();
    selectProject(created);
    return created;
  };

  const getProjectMembers = async (projectId?: string) => {
    const id = projectId || activeProject?.id;
    if (!id) return [];
    return api.get<ProjectMember[]>(`/projects/${id}/members`);
  };

  const addProjectMember = async (projectId: string, userId: string, role: ProjectRole) => {
    return api.post<ProjectMember>(`/projects/${projectId}/members`, { user_id: userId, role });
  };

  const updateProjectMemberRole = async (projectId: string, userId: string, role: ProjectRole) => {
    return api.patch<ProjectMember>(`/projects/${projectId}/members/${userId}`, { role });
  };

  const removeProjectMember = async (projectId: string, userId: string): Promise<void> => {
    await api.delete(`/projects/${projectId}/members/${userId}`);
  };

  const getProjectComponents = async (projectId?: string) => {
    const id = projectId || activeProject?.id;
    if (!id) return [];
    return api.get<Component[]>(`/projects/${id}/components`);
  };

  const createProjectComponent = async (
    projectId: string,
    data: { name: string; description?: string; default_assignee_id?: string | null }
  ) => {
    return api.post<Component>(`/projects/${projectId}/components`, data);
  };

  const getProjectVersions = async (projectId?: string) => {
    const id = projectId || activeProject?.id;
    if (!id) return [];
    return api.get<Version[]>(`/projects/${id}/versions`);
  };

  const createProjectVersion = async (
    projectId: string,
    data: { name: string; description?: string; status?: any; release_date?: string | null }
  ) => {
    return api.post<Version>(`/projects/${projectId}/versions`, data);
  };

  const getProjectMilestones = async (projectId?: string) => {
    const id = projectId || activeProject?.id;
    if (!id) return [];
    return api.get<Milestone[]>(`/projects/${id}/milestones`);
  };

  const createProjectMilestone = async (
    projectId: string,
    data: { name: string; description?: string; status?: any; due_date?: string | null }
  ) => {
    return api.post<Milestone>(`/projects/${projectId}/milestones`, data);
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        activeProject,
        userProjectRole,
        loading,
        selectProject,
        refreshProjects,
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
        isAutoSimulating,
        setAutoSimulating,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};
