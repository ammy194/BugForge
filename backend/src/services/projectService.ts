import { getSupabaseAdminClient } from './supabase';
import {
  Project,
  ProjectMember,
  Component,
  Version,
  Milestone,
  ProjectRole,
} from '../types/project';
import { UserService, DEMO_PERSONAS } from './userService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

// In-Memory Data Stores for Development/Testing Resilience
const projectsStore = new Map<string, Project>();
const projectMembersStore = new Map<string, ProjectMember[]>();
const componentsStore = new Map<string, Component[]>();
const versionsStore = new Map<string, Version[]>();
const milestonesStore = new Map<string, Milestone[]>();

// Initialize Seed Data
function initSeedData() {
  if (projectsStore.size > 0) return;

  const p1: Project = {
    id: 'ecom-proj-00000000-0000-0000-000000000001',
    key: 'ECOM',
    name: 'E-Commerce Platform',
    description: 'Core storefront, payment gateways, checkout flows, and user inventory systems.',
    owner_id: DEMO_PERSONAS.admin.id,
    issue_counter: 1045,
    archived: false,
    created_at: new Date('2026-01-10').toISOString(),
    updated_at: new Date('2026-01-10').toISOString(),
    members_count: 4,
    open_issues_count: 4,
    resolved_issues_count: 2,
  };

  const p2: Project = {
    id: 'mob-proj-00000000-0000-0000-000000000002',
    key: 'MOB',
    name: 'Mobile Banking App',
    description: 'iOS & Android native client applications with biometric authentication.',
    owner_id: DEMO_PERSONAS.pm.id,
    issue_counter: 0,
    archived: false,
    created_at: new Date('2026-02-01').toISOString(),
    updated_at: new Date('2026-02-01').toISOString(),
    members_count: 3,
    open_issues_count: 0,
    resolved_issues_count: 0,
  };

  const p3: Project = {
    id: 'api-proj-00000000-0000-0000-000000000003',
    key: 'API',
    name: 'Developer Public API',
    description: 'High-throughput GraphQL & REST gateway with rate limiting and OAuth2.',
    owner_id: DEMO_PERSONAS.admin.id,
    issue_counter: 0,
    archived: false,
    created_at: new Date('2026-02-15').toISOString(),
    updated_at: new Date('2026-02-15').toISOString(),
    members_count: 3,
    open_issues_count: 0,
    resolved_issues_count: 0,
  };

  [p1, p2, p3].forEach((p) => projectsStore.set(p.id, p));

  // Seed Members with Multi-Project Role Differentiation
  projectMembersStore.set(p1.id, [
    { id: 'm1', project_id: p1.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p1.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm2', project_id: p1.id, user_id: DEMO_PERSONAS.pm.id, role: 'PROJECT_MANAGER', created_at: p1.created_at, user: DEMO_PERSONAS.pm },
    { id: 'm3', project_id: p1.id, user_id: DEMO_PERSONAS.dev.id, role: 'DEVELOPER', created_at: p1.created_at, user: DEMO_PERSONAS.dev },
    { id: 'm4', project_id: p1.id, user_id: DEMO_PERSONAS.reporter.id, role: 'REPORTER', created_at: p1.created_at, user: DEMO_PERSONAS.reporter },
  ]);

  projectMembersStore.set(p2.id, [
    { id: 'm5', project_id: p2.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p2.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm6', project_id: p2.id, user_id: DEMO_PERSONAS.pm.id, role: 'ADMIN', created_at: p2.created_at, user: DEMO_PERSONAS.pm },
    { id: 'm7', project_id: p2.id, user_id: DEMO_PERSONAS.reporter.id, role: 'REPORTER', created_at: p2.created_at, user: DEMO_PERSONAS.reporter },
  ]);

  projectMembersStore.set(p3.id, [
    { id: 'm8', project_id: p3.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p3.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm9', project_id: p3.id, user_id: DEMO_PERSONAS.dev.id, role: 'DEVELOPER', created_at: p3.created_at, user: DEMO_PERSONAS.dev },
    { id: 'm10', project_id: p3.id, user_id: DEMO_PERSONAS.pm.id, role: 'PROJECT_MANAGER', created_at: p3.created_at, user: DEMO_PERSONAS.pm },
  ]);

  // Seed Components for ECOM
  componentsStore.set(p1.id, [
    { id: 'c1', project_id: p1.id, name: 'Checkout & Payments', description: 'Stripe integration, cart discount calculation, apple pay', default_assignee_id: DEMO_PERSONAS.dev.id, created_at: p1.created_at, default_assignee: DEMO_PERSONAS.dev },
    { id: 'c2', project_id: p1.id, name: 'User Authentication', description: 'OAuth2, JWT tokens, session lifecycle', default_assignee_id: DEMO_PERSONAS.dev.id, created_at: p1.created_at, default_assignee: DEMO_PERSONAS.dev },
    { id: 'c3', project_id: p1.id, name: 'Product Catalog', description: 'Search indexing, product variations, inventory stock', created_at: p1.created_at },
  ]);

  // Seed Versions for ECOM
  versionsStore.set(p1.id, [
    { id: 'v1', project_id: p1.id, name: 'v2.4.0', description: 'Q3 Major Release with coupon engine rewrite', status: 'UNRELEASED', release_date: '2026-10-15', created_at: p1.created_at, total_issues_count: 28, resolved_issues_count: 19 },
    { id: 'v2', project_id: p1.id, name: 'v2.3.2', description: 'Patch release for auth cookie security', status: 'RELEASED', release_date: '2026-09-28', created_at: p1.created_at, total_issues_count: 14, resolved_issues_count: 14 },
  ]);

  // Seed Milestones for ECOM
  milestonesStore.set(p1.id, [
    { id: 'ms1', project_id: p1.id, name: 'Sprint 14', description: 'Bi-weekly sprint focusing on high-priority defect triage', status: 'OPEN', due_date: '2026-09-15T23:59:59Z', created_at: p1.created_at, total_issues_count: 12, resolved_issues_count: 9 },
    { id: 'ms2', project_id: p1.id, name: 'Q3 Security Audit', description: 'OWASP top 10 compliance and rate limiting fixes', status: 'OPEN', due_date: '2026-10-01T23:59:59Z', created_at: p1.created_at, total_issues_count: 8, resolved_issues_count: 5 },
  ]);
}

initSeedData();

export class ProjectService {
  /**
   * List projects accessible to user (or all if global admin)
   */
  static async listProjects(userId?: string, isGlobalAdmin: boolean = false): Promise<Project[]> {
    const allProjects = Array.from(projectsStore.values()).filter((p) => !p.archived);

    if (!userId || isGlobalAdmin) {
      return allProjects;
    }

    return allProjects.filter((p) => {
      const members = projectMembersStore.get(p.id) || [];
      return members.some((m) => m.user_id === userId);
    });
  }

  /**
   * Get project detail by ID or Key
   */
  static async getProject(identifier: string): Promise<Project | null> {
    // Lookup by ID
    if (projectsStore.has(identifier)) {
      return projectsStore.get(identifier)!;
    }

    // Lookup by Key
    const byKey = Array.from(projectsStore.values()).find(
      (p) => p.key.toUpperCase() === identifier.toUpperCase()
    );
    return byKey || null;
  }

  /**
   * Create a new project with owner as ADMIN
   */
  static async createProject(
    data: { key: string; name: string; description?: string },
    ownerId: string
  ): Promise<Project> {
    const keyUpper = data.key.toUpperCase();
    const existing = Array.from(projectsStore.values()).find((p) => p.key === keyUpper);
    if (existing) {
      throw AppError.conflict(`Project with key '${keyUpper}' already exists.`);
    }

    const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newProject: Project = {
      id: projectId,
      key: keyUpper,
      name: data.name,
      description: data.description || '',
      owner_id: ownerId,
      issue_counter: 0,
      archived: false,
      created_at: now,
      updated_at: now,
      members_count: 1,
      open_issues_count: 0,
      resolved_issues_count: 0,
    };

    projectsStore.set(projectId, newProject);

    // Add owner as ADMIN member
    const ownerProfile = await UserService.getProfileById(ownerId);
    const ownerMember: ProjectMember = {
      id: `pm-${Date.now()}`,
      project_id: projectId,
      user_id: ownerId,
      role: 'ADMIN',
      created_at: now,
      user: ownerProfile || undefined,
    };
    projectMembersStore.set(projectId, [ownerMember]);

    // Create default starter components
    componentsStore.set(projectId, [
      { id: `c-${Date.now()}-1`, project_id: projectId, name: 'General', description: 'General issues and tasks', created_at: now },
      { id: `c-${Date.now()}-2`, project_id: projectId, name: 'Backend API', description: 'Server and database logic', created_at: now },
      { id: `c-${Date.now()}-3`, project_id: projectId, name: 'Frontend UI', description: 'Web client user interface', created_at: now },
    ]);

    versionsStore.set(projectId, []);
    milestonesStore.set(projectId, []);

    return newProject;
  }

  /**
   * Update project settings
   */
  static async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; archived?: boolean }
  ): Promise<Project> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound(`Project ${projectId} not found`);

    const updated: Project = {
      ...project,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    projectsStore.set(project.id, updated);
    return updated;
  }

  /**
   * Archive project
   */
  static async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { archived: true });
  }

  // --- Project Members ---

  static async getMembers(projectId: string): Promise<ProjectMember[]> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');
    return projectMembersStore.get(project.id) || [];
  }

  static async getMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    const project = await this.getProject(projectId);
    if (!project) return null;
    const members = projectMembersStore.get(project.id) || [];
    return members.find((m) => m.user_id === userId) || null;
  }

  static async addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    const members = projectMembersStore.get(project.id) || [];
    if (members.some((m) => m.user_id === userId)) {
      throw AppError.conflict('User is already a member of this project');
    }

    const userProfile = await UserService.getProfileById(userId);
    const newMember: ProjectMember = {
      id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: project.id,
      user_id: userId,
      role,
      created_at: new Date().toISOString(),
      user: userProfile || undefined,
    };

    members.push(newMember);
    projectMembersStore.set(project.id, members);
    project.members_count = members.length;

    return newMember;
  }

  static async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    const members = projectMembersStore.get(project.id) || [];
    const member = members.find((m) => m.user_id === userId);
    if (!member) throw AppError.notFound('User is not a member of this project');

    member.role = role;
    return member;
  }

  static async removeMember(projectId: string, userId: string): Promise<void> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    let members = projectMembersStore.get(project.id) || [];
    members = members.filter((m) => m.user_id !== userId);
    projectMembersStore.set(project.id, members);
    project.members_count = members.length;
  }

  // --- Components ---

  static async getComponents(projectId: string): Promise<Component[]> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');
    return componentsStore.get(project.id) || [];
  }

  static async createComponent(
    projectId: string,
    data: { name: string; description?: string; default_assignee_id?: string | null }
  ): Promise<Component> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    const comps = componentsStore.get(project.id) || [];
    if (comps.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Component '${data.name}' already exists in this project`);
    }

    const defaultAssignee = data.default_assignee_id
      ? await UserService.getProfileById(data.default_assignee_id)
      : null;

    const newComp: Component = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: project.id,
      name: data.name,
      description: data.description || '',
      default_assignee_id: data.default_assignee_id || undefined,
      created_at: new Date().toISOString(),
      default_assignee: defaultAssignee || undefined,
    };

    comps.push(newComp);
    componentsStore.set(project.id, comps);
    return newComp;
  }

  // --- Versions / Releases ---

  static async getVersions(projectId: string): Promise<Version[]> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');
    return versionsStore.get(project.id) || [];
  }

  static async createVersion(
    projectId: string,
    data: { name: string; description?: string; status?: any; release_date?: string | null }
  ): Promise<Version> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    const versions = versionsStore.get(project.id) || [];
    if (versions.some((v) => v.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Version '${data.name}' already exists in this project`);
    }

    const newVersion: Version = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: project.id,
      name: data.name,
      description: data.description || '',
      status: data.status || 'UNRELEASED',
      release_date: data.release_date || undefined,
      created_at: new Date().toISOString(),
      total_issues_count: 0,
      resolved_issues_count: 0,
    };

    versions.push(newVersion);
    versionsStore.set(project.id, versions);
    return newVersion;
  }

  // --- Milestones ---

  static async getMilestones(projectId: string): Promise<Milestone[]> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');
    return milestonesStore.get(project.id) || [];
  }

  static async createMilestone(
    projectId: string,
    data: { name: string; description?: string; status?: any; due_date?: string | null }
  ): Promise<Milestone> {
    const project = await this.getProject(projectId);
    if (!project) throw AppError.notFound('Project not found');

    const milestones = milestonesStore.get(project.id) || [];
    if (milestones.some((m) => m.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Milestone '${data.name}' already exists in this project`);
    }

    const newMs: Milestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: project.id,
      name: data.name,
      description: data.description || '',
      status: data.status || 'OPEN',
      due_date: data.due_date || undefined,
      created_at: new Date().toISOString(),
      total_issues_count: 0,
      resolved_issues_count: 0,
    };

    milestones.push(newMs);
    milestonesStore.set(project.id, milestones);
    return newMs;
  }
}
