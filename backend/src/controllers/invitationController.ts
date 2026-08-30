import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { InvitationService } from '../services/invitationService';
import { NotificationService } from '../services/notificationService';
import { createInvitationSchema, respondInvitationSchema } from '../validators/projectValidators';

export class InvitationController {
  /**
   * POST /api/v1/projects/:id/invitations
   * Requires PROJECT_MANAGER/ADMIN project role (enforced by
   * requireProjectRole on the route) -- a plain Reporter/Developer cannot
   * reach this handler at all (Requirement 11).
   */
  static async createInvitation(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();

    const validated = createInvitationSchema.parse(req.body);
    const invitation = await InvitationService.createInvitation({
      projectId: req.params.id,
      inviterId: req.user.id, // always the authenticated caller
      email: validated.email,
      role: validated.role,
    });

    await NotificationService.createNotification({
      user_id: invitation.invitee_id,
      actor_id: req.user.id,
      type: 'PROJECT_INVITE',
      title: 'New project invitation',
      message: `${req.user.full_name} invited you to join ${invitation.project?.name || 'a project'} as ${invitation.role}`,
    });

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: invitation,
      message: 'Invitation sent',
    });
  }

  /**
   * GET /api/v1/projects/:id/invitations
   * PM/ADMIN of the project can see who they've invited.
   */
  static async listProjectInvitations(req: Request, res: Response) {
    const invitations = await InvitationService.listForProject(req.params.id);
    return ApiResponse.success({
      res,
      data: invitations,
      message: 'Project invitations retrieved',
    });
  }

  /**
   * GET /api/v1/invitations/mine
   * The current user's own pending (or all, with ?status=) invitations.
   */
  static async listMyInvitations(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const invitations = await InvitationService.listForInvitee(req.user.id, status);
    return ApiResponse.success({
      res,
      data: invitations,
      message: 'Invitations retrieved',
    });
  }

  /**
   * POST /api/v1/invitations/:id/respond
   * SECURITY: the invitee is always req.user.id -- InvitationService.respond
   * rejects any attempt to respond to an invitation addressed to someone
   * else, regardless of what the caller passes in the URL.
   */
  static async respond(req: Request, res: Response) {
    if (!req.user) throw AppError.unauthorized();
    const validated = respondInvitationSchema.parse(req.body);
    const updated = await InvitationService.respond(req.params.id, req.user.id, validated.action);

    return ApiResponse.success({
      res,
      data: updated,
      message: validated.action === 'ACCEPT' ? 'Invitation accepted' : 'Invitation declined',
    });
  }
}
