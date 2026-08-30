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

// ==============================================================================
// Demo workspace (in-memory, read mostly-static)
// ------------------------------------------------------------------------------
// The 4 built-in demo personas and their 3 showcase projects are NOT real
// Supabase Auth users, so they can never be written into `public.projects`
// (owner_id has a FK to public.profiles(id) -> auth.users(id)). They remain a
// hardcoded, in-memory-only workspace, exactly as before. The important fix
// here is that this workspace is now *only* ever reachable by demo personas
// (Requirement 5) -- custom/self-registered accounts are routed exclusively
// to the Supabase-backed "custom workspace" below and can never see or touch
// demo projects, even via a direct API call with a guessed ID.
// ==============================================================================

const demoProjectsStore = new Map<string, Project>();
const demoMembersStore = new Map<string, ProjectMember[]>();
const demoComponentsStore = new Map<string, Component[]>();
const demoVersionsStore = new Map<string, Version[]>();
const demoMilestonesStore = new Map<string, Milestone[]>();

export const DEMO_PROJECT_IDS = [
  'ecom-proj-00000000-0000-0000-000000000001',
  'mob-proj-00000000-0000-0000-000000000002',
  'api-proj-00000000-0000-0000-000000000003',
];

function initDemoSeedData() {
  if (demoProjectsStore.size > 0) return;

  const p1: Project = {
    id: DEMO_PROJECT_IDS[0],
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
    is_demo: true,
  };

  const p2: Project = {
    id: DEMO_PROJECT_IDS[1],
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
    is_demo: true,
  };

  const p3: Project = {
    id: DEMO_PROJECT_IDS[2],
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
    is_demo: true,
  };

  [p1, p2, p3].forEach((p) => demoProjectsStore.set(p.id, p));

  demoMembersStore.set(p1.id, [
    { id: 'm1', project_id: p1.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p1.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm2', project_id: p1.id, user_id: DEMO_PERSONAS.pm.id, role: 'PROJECT_MANAGER', created_at: p1.created_at, user: DEMO_PERSONAS.pm },
    { id: 'm3', project_id: p1.id, user_id: DEMO_PERSONAS.dev.id, role: 'DEVELOPER', created_at: p1.created_at, user: DEMO_PERSONAS.dev },
    { id: 'm4', project_id: p1.id, user_id: DEMO_PERSONAS.reporter.id, role: 'REPORTER', created_at: p1.created_at, user: DEMO_PERSONAS.reporter },
  ]);

  demoMembersStore.set(p2.id, [
    { id: 'm5', project_id: p2.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p2.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm6', project_id: p2.id, user_id: DEMO_PERSONAS.pm.id, role: 'ADMIN', created_at: p2.created_at, user: DEMO_PERSONAS.pm },
    { id: 'm7', project_id: p2.id, user_id: DEMO_PERSONAS.reporter.id, role: 'REPORTER', created_at: p2.created_at, user: DEMO_PERSONAS.reporter },
  ]);

  demoMembersStore.set(p3.id, [
    { id: 'm8', project_id: p3.id, user_id: DEMO_PERSONAS.admin.id, role: 'ADMIN', created_at: p3.created_at, user: DEMO_PERSONAS.admin },
    { id: 'm9', project_id: p3.id, user_id: DEMO_PERSONAS.dev.id, role: 'DEVELOPER', created_at: p3.created_at, user: DEMO_PERSONAS.dev },
    { id: 'm10', project_id: p3.id, user_id: DEMO_PERSONAS.pm.id, role: 'PROJECT_MANAGER', created_at: p3.created_at, user: DEMO_PERSONAS.pm },
  ]);

  demoComponentsStore.set(p1.id, [
    { id: 'c1', project_id: p1.id, name: 'Checkout & Payments', description: 'Stripe integration, cart discount calculation, apple pay', default_assignee_id: DEMO_PERSONAS.dev.id, created_at: p1.created_at, default_assignee: DEMO_PERSONAS.dev },
    { id: 'c2', project_id: p1.id, name: 'User Authentication', description: 'OAuth2, JWT tokens, session lifecycle', default_assignee_id: DEMO_PERSONAS.dev.id, created_at: p1.created_at, default_assignee: DEMO_PERSONAS.dev },
    { id: 'c3', project_id: p1.id, name: 'Product Catalog', description: 'Search indexing, product variations, inventory stock', created_at: p1.created_at },
  ]);

  demoVersionsStore.set(p1.id, [
    { id: 'v1', project_id: p1.id, name: 'v2.4.0', description: 'Q3 Major Release with coupon engine rewrite', status: 'UNRELEASED', release_date: '2026-10-15', created_at: p1.created_at, total_issues_count: 28, resolved_issues_count: 19 },
    { id: 'v2', project_id: p1.id, name: 'v2.3.2', description: 'Patch release for auth cookie security', status: 'RELEASED', release_date: '2026-09-28', created_at: p1.created_at, total_issues_count: 14, resolved_issues_count: 14 },
  ]);

  demoMilestonesStore.set(p1.id, [
    { id: 'ms1', project_id: p1.id, name: 'Sprint 14', description: 'Bi-weekly sprint focusing on high-priority defect triage', status: 'OPEN', due_date: '2026-09-15T23:59:59Z', created_at: p1.created_at, total_issues_count: 12, resolved_issues_count: 9 },
    { id: 'ms2', project_id: p1.id, name: 'Q3 Security Audit', description: 'OWASP top 10 compliance and rate limiting fixes', status: 'OPEN', due_date: '2026-10-01T23:59:59Z', created_at: p1.created_at, total_issues_count: 8, resolved_issues_count: 5 },
  ]);
}

initDemoSeedData();

const isDemoProjectId = (id: string) => demoProjectsStore.has(id);
const findDemoProjectByKey = (key: string) =>
  Array.from(demoProjectsStore.values()).find((p) => p.key.toUpperCase() === key.toUpperCase());

// ==============================================================================
// Custom (real) workspace -- Supabase-backed
// ------------------------------------------------------------------------------
// Every project a real/custom account creates is persisted in the actual
// Postgres `projects` / `project_members` tables via the service-role client,
// so it survives refresh, logout/login, and server restarts (Requirement 1,
// 6, 18). When Supabase credentials are not configured at all (pure local
// dev preview), an in-memory fallback is used so the app still runs -- this
// mirrors the same fallback pattern used in UserService.
// ==============================================================================

const isSupabasePlaceholder = () =>
  !env.SUPABASE_URL ||
  env.SUPABASE_URL.includes('placeholder') ||
  !env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

const offlineProjects = new Map<string, Project>();
const offlineMembers = new Map<string, ProjectMember[]>();
// Components/versions/milestones are secondary metadata; kept in a single
// shared in-memory store for both offline and Supabase-configured modes to
// keep this change targeted (see final report "remaining issues"). They are
// still fully isolated per-project and never touch the demo workspace.
const customComponentsStore = new Map<string, Component[]>();
const customVersionsStore = new Map<string, Version[]>();
const customMilestonesStore = new Map<string, Milestone[]>();

const rowToProject = (row: any): Project => ({
  id: row.id,
  key: row.key,
  name: row.name,
  description: row.description || undefined,
  owner_id: row.owner_id,
  issue_counter: row.issue_counter,
  archived: row.archived,
  created_at: row.created_at,
  updated_at: row.updated_at,
  is_demo: false,
});

const rowToMember = (row: any, user?: any): ProjectMember => ({
  id: row.id,
  project_id: row.project_id,
  user_id: row.user_id,
  role: row.role,
  created_at: row.created_at,
  user,
});

export class ProjectService {
  /**
   * List projects visible to the requesting user.
   *
   * - Global platform admins (the demo admin persona, or a manually
   *   promoted DB account) see everything, matching the app's existing
   *   RBAC model.
   * - Demo personas see the demo workspace plus any custom projects they
   *   happen to belong to.
   * - Custom accounts see ONLY custom projects they are members of. Demo
   *   projects are never included (Requirement 5).
   */
  static async listProjects(
    userId: string,
    isGlobalAdmin: boolean,
    isDemoUser: boolean
  ): Promise<Project[]> {
    const customProjects = await this.listCustomProjects(userId, isGlobalAdmin);

    if (isGlobalAdmin) {
      const allDemo = Array.from(demoProjectsStore.values()).filter((p) => !p.archived);
      return [...allDemo, ...customProjects];
    }

    if (isDemoUser) {
      const demoOwned = Array.from(demoProjectsStore.values()).filter((p) => {
        if (p.archived) return false;
        const members = demoMembersStore.get(p.id) || [];
        return members.some((m) => m.user_id === userId);
      });
      return [...demoOwned, ...customProjects];
    }

    // Custom account: demo workspace is never visible, even implicitly.
    return customProjects;
  }

  private static async listCustomProjects(userId: string, isGlobalAdmin: boolean): Promise<Project[]> {
    if (isSupabasePlaceholder()) {
      const all = Array.from(offlineProjects.values()).filter((p) => !p.archived);
      if (isGlobalAdmin) return all;
      return all.filter((p) => (offlineMembers.get(p.id) || []).some((m) => m.user_id === userId));
    }

    try {
      const client = getSupabaseAdminClient();
      if (isGlobalAdmin) {
        const { data, error } = await client.from('projects').select('*').eq('archived', false);
        if (error) throw error;
        return (data || []).map(rowToProject);
      }

      // Only projects the user is an explicit member of -- this is the
      // core backend enforcement for Requirement 4 (project isolation).
      const { data: memberRows, error: memberErr } = await client
        .from('project_members')
        .select('project_id')
        .eq('user_id', userId);
      if (memberErr) throw memberErr;

      const projectIds = (memberRows || []).map((r: any) => r.project_id);
      if (projectIds.length === 0) return [];

      const { data, error } = await client
        .from('projects')
        .select('*')
        .in('id', projectIds)
        .eq('archived', false);
      if (error) throw error;
      return (data || []).map(rowToProject);
    } catch (err: any) {
      logger.warn('Error listing custom projects from Supabase:', err?.message);
      return [];
    }
  }

  /**
   * Get project detail by ID or Key. Demo projects are ONLY resolvable for
   * demo users -- a custom account requesting a demo project id/key (even by
   * guessing) gets `null`, which the controller/middleware turn into a 404.
   */
  static async getProject(identifier: string, requestingUser?: { is_demo: boolean }): Promise<Project | null> {
    const demoMatch = demoProjectsStore.get(identifier) || findDemoProjectByKey(identifier);
    if (demoMatch) {
      if (requestingUser && !requestingUser.is_demo) return null;
      return demoMatch;
    }

    return this.getCustomProject(identifier);
  }

  private static async getCustomProject(identifier: string): Promise<Project | null> {
    if (isSupabasePlaceholder()) {
      if (offlineProjects.has(identifier)) return offlineProjects.get(identifier)!;
      return (
        Array.from(offlineProjects.values()).find((p) => p.key.toUpperCase() === identifier.toUpperCase()) ||
        null
      );
    }

    try {
      const client = getSupabaseAdminClient();
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const { data, error } = await client
        .from('projects')
        .select('*')
        .or(isUuid ? `id.eq.${identifier}` : `key.eq.${identifier.toUpperCase()}`)
        .maybeSingle();
      if (error || !data) return null;
      return rowToProject(data);
    } catch (err: any) {
      logger.warn('Error fetching custom project from Supabase:', err?.message);
      return null;
    }
  }

  /**
   * Create a new project owned by a custom user. Always lands in the
   * Supabase-backed custom workspace -- a custom user can never create (or
   * be auto-added to) a demo project.
   */
  static async createProject(
    data: { key: string; name: string; description?: string },
    ownerId: string
  ): Promise<Project> {
    const keyUpper = data.key.toUpperCase();

    if (demoProjectsStore.has(keyUpper) || findDemoProjectByKey(keyUpper)) {
      throw AppError.conflict(`Project key '${keyUpper}' is reserved.`);
    }

    const now = new Date().toISOString();

    if (isSupabasePlaceholder()) {
      const existing = Array.from(offlineProjects.values()).find((p) => p.key === keyUpper);
      if (existing) throw AppError.conflict(`Project with key '${keyUpper}' already exists.`);

      const projectId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
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
        is_demo: false,
      };
      offlineProjects.set(projectId, newProject);

      const ownerProfile = await UserService.getProfileById(ownerId);
      offlineMembers.set(projectId, [
        {
          id: `pm-${Date.now()}`,
          project_id: projectId,
          user_id: ownerId,
          role: 'ADMIN',
          created_at: now,
          user: ownerProfile || undefined,
        },
      ]);
      this.seedStarterMetadata(projectId, now);
      return newProject;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data: existing } = await client.from('projects').select('id').eq('key', keyUpper).maybeSingle();
      if (existing) throw AppError.conflict(`Project with key '${keyUpper}' already exists.`);

      const { data: row, error } = await client
        .from('projects')
        .insert({
          key: keyUpper,
          name: data.name,
          description: data.description || '',
          owner_id: ownerId,
          issue_counter: 0,
          archived: false,
        })
        .select('*')
        .single();

      if (error || !row) {
        throw AppError.internal(`Failed to create project: ${error?.message || 'unknown error'}`);
      }

      const project = rowToProject(row);

      const { error: memberErr } = await client.from('project_members').insert({
        project_id: project.id,
        user_id: ownerId,
        role: 'ADMIN',
      });
      if (memberErr) {
        logger.warn('Failed to add project owner as member:', memberErr.message);
      }

      this.seedStarterMetadata(project.id, now);
      return { ...project, members_count: 1 };
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.internal(`Failed to create project: ${err?.message || 'unknown error'}`);
    }
  }

  private static seedStarterMetadata(projectId: string, now: string) {
    customComponentsStore.set(projectId, [
      { id: `c-${Date.now()}-1`, project_id: projectId, name: 'General', description: 'General issues and tasks', created_at: now },
      { id: `c-${Date.now()}-2`, project_id: projectId, name: 'Backend API', description: 'Server and database logic', created_at: now },
      { id: `c-${Date.now()}-3`, project_id: projectId, name: 'Frontend UI', description: 'Web client user interface', created_at: now },
    ]);
    customVersionsStore.set(projectId, []);
    customMilestonesStore.set(projectId, []);
  }

  static async updateProject(
    projectId: string,
    updates: { name?: string; description?: string; archived?: boolean }
  ): Promise<Project> {
    if (isDemoProjectId(projectId)) {
      const project = demoProjectsStore.get(projectId);
      if (!project) throw AppError.notFound(`Project ${projectId} not found`);
      const updated = { ...project, ...updates, updated_at: new Date().toISOString() };
      demoProjectsStore.set(projectId, updated);
      return updated;
    }

    if (isSupabasePlaceholder()) {
      const project = offlineProjects.get(projectId);
      if (!project) throw AppError.notFound(`Project ${projectId} not found`);
      const updated = { ...project, ...updates, updated_at: new Date().toISOString() };
      offlineProjects.set(projectId, updated);
      return updated;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', projectId)
        .select('*')
        .single();
      if (error || !data) throw AppError.notFound(`Project ${projectId} not found`);
      return rowToProject(data);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.internal(`Failed to update project: ${err?.message || 'unknown error'}`);
    }
  }

  static async archiveProject(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { archived: true });
  }

  // --- Project Members ---

  static async getMembers(projectId: string): Promise<ProjectMember[]> {
    if (isDemoProjectId(projectId)) {
      return demoMembersStore.get(projectId) || [];
    }

    if (isSupabasePlaceholder()) {
      return offlineMembers.get(projectId) || [];
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client.from('project_members').select('*').eq('project_id', projectId);
      if (error || !data) return [];

      const members = await Promise.all(
        data.map(async (row: any) => {
          const user = await UserService.getProfileById(row.user_id);
          return rowToMember(row, user || undefined);
        })
      );
      return members;
    } catch (err: any) {
      logger.warn('Error fetching project members from Supabase:', err?.message);
      return [];
    }
  }

  static async getMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    if (isDemoProjectId(projectId)) {
      const members = demoMembersStore.get(projectId) || [];
      return members.find((m) => m.user_id === userId) || null;
    }

    if (isSupabasePlaceholder()) {
      const members = offlineMembers.get(projectId) || [];
      return members.find((m) => m.user_id === userId) || null;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('project_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error || !data) return null;
      return rowToMember(data);
    } catch (err: any) {
      logger.warn('Error fetching project member from Supabase:', err?.message);
      return null;
    }
  }

  static async addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    if (isDemoProjectId(projectId)) {
      const members = demoMembersStore.get(projectId) || [];
      if (members.some((m) => m.user_id === userId)) {
        throw AppError.conflict('User is already a member of this project');
      }
      const userProfile = await UserService.getProfileById(userId);
      const newMember: ProjectMember = {
        id: `pm-${Date.now()}`,
        project_id: projectId,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
        user: userProfile || undefined,
      };
      members.push(newMember);
      demoMembersStore.set(projectId, members);
      return newMember;
    }

    const existing = await this.getMember(projectId, userId);
    if (existing) throw AppError.conflict('User is already a member of this project');

    const userProfile = await UserService.getProfileById(userId);

    if (isSupabasePlaceholder()) {
      const members = offlineMembers.get(projectId) || [];
      const newMember: ProjectMember = {
        id: `pm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: projectId,
        user_id: userId,
        role,
        created_at: new Date().toISOString(),
        user: userProfile || undefined,
      };
      members.push(newMember);
      offlineMembers.set(projectId, members);
      return newMember;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('project_members')
        .insert({ project_id: projectId, user_id: userId, role })
        .select('*')
        .single();
      if (error || !data) throw AppError.internal(`Failed to add member: ${error?.message}`);
      return rowToMember(data, userProfile || undefined);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.internal(`Failed to add member: ${err?.message || 'unknown error'}`);
    }
  }

  static async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    if (isDemoProjectId(projectId)) {
      const members = demoMembersStore.get(projectId) || [];
      const member = members.find((m) => m.user_id === userId);
      if (!member) throw AppError.notFound('User is not a member of this project');
      member.role = role;
      return member;
    }

    if (isSupabasePlaceholder()) {
      const members = offlineMembers.get(projectId) || [];
      const member = members.find((m) => m.user_id === userId);
      if (!member) throw AppError.notFound('User is not a member of this project');
      member.role = role;
      return member;
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('project_members')
        .update({ role })
        .eq('project_id', projectId)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error || !data) throw AppError.notFound('User is not a member of this project');
      const userProfile = await UserService.getProfileById(userId);
      return rowToMember(data, userProfile || undefined);
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.internal(`Failed to update member role: ${err?.message || 'unknown error'}`);
    }
  }

  static async removeMember(projectId: string, userId: string): Promise<void> {
    if (isDemoProjectId(projectId)) {
      let members = demoMembersStore.get(projectId) || [];
      members = members.filter((m) => m.user_id !== userId);
      demoMembersStore.set(projectId, members);
      return;
    }

    if (isSupabasePlaceholder()) {
      let members = offlineMembers.get(projectId) || [];
      members = members.filter((m) => m.user_id !== userId);
      offlineMembers.set(projectId, members);
      return;
    }

    try {
      const client = getSupabaseAdminClient();
      await client.from('project_members').delete().eq('project_id', projectId).eq('user_id', userId);
    } catch (err: any) {
      logger.warn('Error removing project member from Supabase:', err?.message);
    }
  }

  // --- Components ---

  static async getComponents(projectId: string): Promise<Component[]> {
    if (isDemoProjectId(projectId)) return demoComponentsStore.get(projectId) || [];
    return customComponentsStore.get(projectId) || [];
  }

  static async createComponent(
    projectId: string,
    data: { name: string; description?: string; default_assignee_id?: string | null }
  ): Promise<Component> {
    const store = isDemoProjectId(projectId) ? demoComponentsStore : customComponentsStore;
    const comps = store.get(projectId) || [];
    if (comps.some((c) => c.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Component '${data.name}' already exists in this project`);
    }

    const defaultAssignee = data.default_assignee_id
      ? await UserService.getProfileById(data.default_assignee_id)
      : null;

    const newComp: Component = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      name: data.name,
      description: data.description || '',
      default_assignee_id: data.default_assignee_id || undefined,
      created_at: new Date().toISOString(),
      default_assignee: defaultAssignee || undefined,
    };

    comps.push(newComp);
    store.set(projectId, comps);
    return newComp;
  }

  // --- Versions / Releases ---

  static async getVersions(projectId: string): Promise<Version[]> {
    if (isDemoProjectId(projectId)) return demoVersionsStore.get(projectId) || [];
    return customVersionsStore.get(projectId) || [];
  }

  static async createVersion(
    projectId: string,
    data: { name: string; description?: string; status?: any; release_date?: string | null }
  ): Promise<Version> {
    const store = isDemoProjectId(projectId) ? demoVersionsStore : customVersionsStore;
    const versions = store.get(projectId) || [];
    if (versions.some((v) => v.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Version '${data.name}' already exists in this project`);
    }

    const newVersion: Version = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      name: data.name,
      description: data.description || '',
      status: data.status || 'UNRELEASED',
      release_date: data.release_date || undefined,
      created_at: new Date().toISOString(),
      total_issues_count: 0,
      resolved_issues_count: 0,
    };

    versions.push(newVersion);
    store.set(projectId, versions);
    return newVersion;
  }

  // --- Milestones ---

  static async getMilestones(projectId: string): Promise<Milestone[]> {
    if (isDemoProjectId(projectId)) return demoMilestonesStore.get(projectId) || [];
    return customMilestonesStore.get(projectId) || [];
  }

  static async createMilestone(
    projectId: string,
    data: { name: string; description?: string; status?: any; due_date?: string | null }
  ): Promise<Milestone> {
    const store = isDemoProjectId(projectId) ? demoMilestonesStore : customMilestonesStore;
    const milestones = store.get(projectId) || [];
    if (milestones.some((m) => m.name.toLowerCase() === data.name.toLowerCase())) {
      throw AppError.conflict(`Milestone '${data.name}' already exists in this project`);
    }

    const newMs: Milestone = {
      id: `ms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      project_id: projectId,
      name: data.name,
      description: data.description || '',
      status: data.status || 'OPEN',
      due_date: data.due_date || undefined,
      created_at: new Date().toISOString(),
      total_issues_count: 0,
      resolved_issues_count: 0,
    };

    milestones.push(newMs);
    store.set(projectId, milestones);
    return newMs;
  }
}

export { isDemoProjectId };
