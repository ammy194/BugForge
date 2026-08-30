import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { InvitationController } from '../controllers/invitationController';
import { requireAuth } from '../middleware/authMiddleware';
import { requireProjectRole } from '../middleware/rbacMiddleware';
import { asyncHandler } from '../utils/asyncHandler';

export const projectRoutes = Router();

// All project routes require authentication
projectRoutes.use(requireAuth);

// 1. Projects Core CRUD
projectRoutes.get('/', asyncHandler(ProjectController.listProjects));
projectRoutes.post('/', asyncHandler(ProjectController.createProject));
projectRoutes.get('/:id', requireProjectRole('REPORTER'), asyncHandler(ProjectController.getProject));
projectRoutes.patch('/:id', requireProjectRole('PROJECT_MANAGER'), asyncHandler(ProjectController.updateProject));
projectRoutes.delete('/:id', requireProjectRole('ADMIN'), asyncHandler(ProjectController.archiveProject));

// 2. Members Management
projectRoutes.get('/:id/members', requireProjectRole('REPORTER'), asyncHandler(ProjectController.getMembers));
projectRoutes.post('/:id/members', requireProjectRole('PROJECT_MANAGER'), asyncHandler(ProjectController.addMember));
projectRoutes.patch(
  '/:id/members/:userId',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(ProjectController.updateMemberRole)
);
projectRoutes.delete(
  '/:id/members/:userId',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(ProjectController.removeMember)
);

// 2b. Invitations (Requirement 7/8/9/10/11/12) -- replaces direct member
//     addition as the primary way to bring a new user into a project.
//     Only PROJECT_MANAGER/ADMIN can invite; enforced server-side, not just
//     by hiding the button in the UI.
projectRoutes.post(
  '/:id/invitations',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(InvitationController.createInvitation)
);
projectRoutes.get(
  '/:id/invitations',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(InvitationController.listProjectInvitations)
);

// 3. Components Management
projectRoutes.get('/:id/components', requireProjectRole('REPORTER'), asyncHandler(ProjectController.getComponents));
projectRoutes.post(
  '/:id/components',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(ProjectController.createComponent)
);

// 4. Versions / Releases Management
projectRoutes.get('/:id/versions', requireProjectRole('REPORTER'), asyncHandler(ProjectController.getVersions));
projectRoutes.post(
  '/:id/versions',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(ProjectController.createVersion)
);

// 5. Milestones Management
projectRoutes.get('/:id/milestones', requireProjectRole('REPORTER'), asyncHandler(ProjectController.getMilestones));
projectRoutes.post(
  '/:id/milestones',
  requireProjectRole('PROJECT_MANAGER'),
  asyncHandler(ProjectController.createMilestone)
);
