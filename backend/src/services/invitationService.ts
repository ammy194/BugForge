import { getSupabaseAdminClient } from './supabase';
import { ProjectInvitation, ProjectRole } from '../types/project';
import { UserService } from './userService';
import { ProjectService, isDemoProjectId } from './projectService';
import { AppError } from '../utils/appError';
import { logger } from '../utils/logger';
import { env } from '../config/env';

const isSupabasePlaceholder = () =>
  !env.SUPABASE_URL ||
  env.SUPABASE_URL.includes('placeholder') ||
  !env.SUPABASE_SERVICE_ROLE_KEY ||
  env.SUPABASE_SERVICE_ROLE_KEY.includes('placeholder');

// Offline/local-dev fallback store, mirroring the pattern used by
// UserService/ProjectService. When Supabase is configured, `project_invitations`
// (see migration 20260830000001) is always the source of truth.
const offlineInvitations = new Map<string, ProjectInvitation>();

const rowToInvitation = (row: any): ProjectInvitation => ({
  id: row.id,
  project_id: row.project_id,
  inviter_id: row.inviter_id,
  invitee_id: row.invitee_id,
  invitee_email: row.invitee_email,
  role: row.role,
  status: row.status,
  created_at: row.created_at,
  updated_at: row.updated_at,
  responded_at: row.responded_at,
  expires_at: row.expires_at,
});

export class InvitationService {
  /**
   * Create an invitation. The caller must already be authorized to invite
   * (enforced by requireProjectRole in the route) -- this service layer
   * additionally re-derives everything it needs from trusted state rather
   * than the client (Requirement 11): the inviter is always the
   * authenticated user, and the target project/user are resolved
   * server-side.
   */
  static async createInvitation(params: {
    projectId: string;
    inviterId: string;
    email: string;
    role: ProjectRole;
  }): Promise<ProjectInvitation> {
    if (isDemoProjectId(params.projectId)) {
      // Demo projects have a fixed, curated membership and are not part of
      // the invitation flow.
      throw AppError.badRequest('Demo projects do not support invitations.');
    }

    const project = await ProjectService.getProject(params.projectId);
    if (!project) throw AppError.notFound('Project not found');

    // Requirement 9: only invite an email that maps to an existing BugForge
    // account. We deliberately give a clear, actionable message here (the
    // caller must already be an authorized project member to reach this
    // endpoint, which bounds the blast radius of this account-existence
    // check -- see final report for the account-enumeration trade-off).
    const invitee = await UserService.getProfileByEmail(params.email);
    if (!invitee) {
      throw AppError.notFound('No BugForge account exists for this email. Ask them to create an account first.');
    }

    if (invitee.is_demo) {
      throw AppError.badRequest('Demo accounts cannot be invited to custom projects.');
    }

    const existingMember = await ProjectService.getMember(params.projectId, invitee.id);
    if (existingMember) {
      throw AppError.conflict('This user is already a member of the project.');
    }

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    if (isSupabasePlaceholder()) {
      const existingPending = Array.from(offlineInvitations.values()).find(
        (i) => i.project_id === params.projectId && i.invitee_id === invitee.id && i.status === 'PENDING'
      );
      if (existingPending) throw AppError.conflict('An invitation is already pending for this user.');

      const invitation: ProjectInvitation = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        project_id: params.projectId,
        inviter_id: params.inviterId,
        invitee_id: invitee.id,
        invitee_email: invitee.email,
        role: params.role,
        status: 'PENDING',
        created_at: now,
        updated_at: now,
        responded_at: null,
        expires_at: expiresAt,
      };
      offlineInvitations.set(invitation.id, invitation);
      return this.hydrate(invitation);
    }

    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('project_invitations')
        .insert({
          project_id: params.projectId,
          inviter_id: params.inviterId,
          invitee_id: invitee.id,
          invitee_email: invitee.email,
          role: params.role,
          status: 'PENDING',
          expires_at: expiresAt,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw AppError.conflict('An invitation is already pending for this user.');
        }
        throw AppError.internal(`Failed to create invitation: ${error.message}`);
      }

      return this.hydrate(rowToInvitation(data));
    } catch (err: any) {
      if (err instanceof AppError) throw err;
      throw AppError.internal(`Failed to create invitation: ${err?.message || 'unknown error'}`);
    }
  }

  /**
   * List invitations addressed to a specific user (their "Invitations" tab).
   */
  static async listForInvitee(userId: string, status?: string): Promise<ProjectInvitation[]> {
    let invitations: ProjectInvitation[];

    if (isSupabasePlaceholder()) {
      invitations = Array.from(offlineInvitations.values()).filter((i) => i.invitee_id === userId);
    } else {
      try {
        const client = getSupabaseAdminClient();
        let query = client.from('project_invitations').select('*').eq('invitee_id', userId);
        if (status) query = query.eq('status', status);
        const { data, error } = await query.order('created_at', { ascending: false });
        if (error) throw error;
        invitations = (data || []).map(rowToInvitation);
      } catch (err: any) {
        logger.warn('Error listing invitations from Supabase:', err?.message);
        invitations = [];
      }
    }

    if (status) invitations = invitations.filter((i) => i.status === status);
    return Promise.all(invitations.map((i) => this.hydrate(i)));
  }

  static async listForProject(projectId: string): Promise<ProjectInvitation[]> {
    let invitations: ProjectInvitation[];

    if (isSupabasePlaceholder()) {
      invitations = Array.from(offlineInvitations.values()).filter((i) => i.project_id === projectId);
    } else {
      try {
        const client = getSupabaseAdminClient();
        const { data, error } = await client
          .from('project_invitations')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        invitations = (data || []).map(rowToInvitation);
      } catch (err: any) {
        logger.warn('Error listing project invitations from Supabase:', err?.message);
        invitations = [];
      }
    }

    return Promise.all(invitations.map((i) => this.hydrate(i)));
  }

  private static async getById(invitationId: string): Promise<ProjectInvitation | null> {
    if (isSupabasePlaceholder()) {
      return offlineInvitations.get(invitationId) || null;
    }
    try {
      const client = getSupabaseAdminClient();
      const { data, error } = await client
        .from('project_invitations')
        .select('*')
        .eq('id', invitationId)
        .maybeSingle();
      if (error || !data) return null;
      return rowToInvitation(data);
    } catch (err: any) {
      logger.warn('Error fetching invitation from Supabase:', err?.message);
      return null;
    }
  }

  /**
   * Respond to an invitation. SECURITY (Requirement 11/12): only the
   * authenticated invitee may accept/decline their own invitation -- the
   * caller's identity is compared against invitation.invitee_id server-side,
   * never trusted from the request body. Accepting creates project
   * membership ONLY for the authenticated recipient, and never overwrites
   * their global/primary role.
   */
  static async respond(
    invitationId: string,
    userId: string,
    action: 'ACCEPT' | 'DECLINE'
  ): Promise<ProjectInvitation> {
    const invitation = await this.getById(invitationId);
    if (!invitation) throw AppError.notFound('Invitation not found');

    if (invitation.invitee_id !== userId) {
      throw AppError.forbidden('This invitation is not addressed to your account.');
    }

    if (invitation.status !== 'PENDING') {
      throw AppError.conflict(`Invitation has already been ${invitation.status.toLowerCase()}.`);
    }

    if (new Date(invitation.expires_at).getTime() < Date.now()) {
      await this.updateStatus(invitation.id, 'EXPIRED');
      throw AppError.conflict('This invitation has expired.');
    }

    const newStatus = action === 'ACCEPT' ? 'ACCEPTED' : 'DECLINED';
    const updated = await this.updateStatus(invitation.id, newStatus);

    if (action === 'ACCEPT') {
      const existingMember = await ProjectService.getMember(invitation.project_id, userId);
      if (!existingMember) {
        await ProjectService.addMember(invitation.project_id, userId, invitation.role);
      }
    }

    return this.hydrate(updated);
  }

  private static async updateStatus(
    invitationId: string,
    status: 'ACCEPTED' | 'DECLINED' | 'EXPIRED'
  ): Promise<ProjectInvitation> {
    const now = new Date().toISOString();

    if (isSupabasePlaceholder()) {
      const invitation = offlineInvitations.get(invitationId);
      if (!invitation) throw AppError.notFound('Invitation not found');
      invitation.status = status;
      invitation.updated_at = now;
      invitation.responded_at = now;
      offlineInvitations.set(invitationId, invitation);
      return invitation;
    }

    const client = getSupabaseAdminClient();
    const { data, error } = await client
      .from('project_invitations')
      .update({ status, updated_at: now, responded_at: now })
      .eq('id', invitationId)
      .select('*')
      .single();
    if (error || !data) throw AppError.internal(`Failed to update invitation: ${error?.message}`);
    return rowToInvitation(data);
  }

  private static async hydrate(invitation: ProjectInvitation): Promise<ProjectInvitation> {
    const [project, inviter] = await Promise.all([
      ProjectService.getProject(invitation.project_id),
      UserService.getProfileById(invitation.inviter_id),
    ]);
    return {
      ...invitation,
      project: project ? { id: project.id, key: project.key, name: project.name } : undefined,
      inviter: inviter ? { id: inviter.id, full_name: inviter.full_name, email: inviter.email } : undefined,
    };
  }
}
