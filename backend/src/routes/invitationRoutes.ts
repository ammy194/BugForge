import { Router } from 'express';
import { InvitationController } from '../controllers/invitationController';
import { requireAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const invitationRoutes = Router();

invitationRoutes.use(requireAuth);

invitationRoutes.get('/mine', asyncHandler(InvitationController.listMyInvitations));
invitationRoutes.post('/:id/respond', asyncHandler(InvitationController.respond));
