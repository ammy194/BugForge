import { AppError } from './appError';
import { AuthenticatedUser } from '../types/auth';
import { ProjectService } from '../services/projectService';

/**
 * Requirement 4: "issues belonging to projects they cannot access" must
 * never be returned. Issue routes don't go through requireProjectRole
 * (issues are looked up by their own id/key, not a project id in the URL),
 * so this helper re-derives project membership the same way rbacMiddleware
 * does and is called explicitly from IssueController before returning any
 * issue data.
 */
export async function assertProjectAccess(user: AuthenticatedUser | undefined, projectId: string) {
  if (!user) throw AppError.unauthorized('Authentication required');
  if (user.global_role === 'ADMIN') return; // preserves existing global-admin bypass

  const member = await ProjectService.getMember(projectId, user.id);
  if (!member) {
    throw AppError.forbidden('Access denied: you are not a member of this project');
  }
}

export async function accessibleProjectIds(user: AuthenticatedUser): Promise<Set<string> | null> {
  if (user.global_role === 'ADMIN') return null; // null == unrestricted
  const projects = await ProjectService.listProjects(user.id, false, !!user.is_demo);
  return new Set(projects.map((p) => p.id));
}
