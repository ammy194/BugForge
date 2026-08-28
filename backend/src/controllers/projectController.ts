import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { AppError } from '../utils/appError';
import { ProjectService } from '../services/projectService';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  createComponentSchema,
  createVersionSchema,
  createMilestoneSchema,
} from '../validators/projectValidators';

export class ProjectController {
  static async listProjects(req: Request, res: Response) {
    const isGlobalAdmin = req.user?.global_role === 'ADMIN';
    const projects = await ProjectService.listProjects(req.user!.id, isGlobalAdmin);

    return ApiResponse.success({
      res,
      data: projects,
      meta: { count: projects.length },
      message: 'Projects retrieved',
    });
  }

  static async getProject(req: Request, res: Response) {
    const project = await ProjectService.getProject(req.params.id);
    if (!project) throw AppError.notFound(`Project '${req.params.id}' not found`);

    return ApiResponse.success({
      res,
      data: project,
      message: 'Project retrieved',
    });
  }

  static async createProject(req: Request, res: Response) {
    const validated = createProjectSchema.parse(req.body);
    const newProject = await ProjectService.createProject(validated, req.user!.id);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: newProject,
      message: 'Project created successfully',
    });
  }

  static async updateProject(req: Request, res: Response) {
    const validated = updateProjectSchema.parse(req.body);
    const updated = await ProjectService.updateProject(req.params.id, validated);

    return ApiResponse.success({
      res,
      data: updated,
      message: 'Project updated successfully',
    });
  }

  static async archiveProject(req: Request, res: Response) {
    const archived = await ProjectService.archiveProject(req.params.id);

    return ApiResponse.success({
      res,
      data: archived,
      message: 'Project archived successfully',
    });
  }

  // --- Members ---

  static async getMembers(req: Request, res: Response) {
    const members = await ProjectService.getMembers(req.params.id);
    return ApiResponse.success({
      res,
      data: members,
      message: 'Project members retrieved',
    });
  }

  static async addMember(req: Request, res: Response) {
    const validated = addMemberSchema.parse(req.body);
    const member = await ProjectService.addMember(req.params.id, validated.user_id, validated.role);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: member,
      message: 'Member added to project',
    });
  }

  static async updateMemberRole(req: Request, res: Response) {
    const validated = updateMemberRoleSchema.parse(req.body);
    const member = await ProjectService.updateMemberRole(
      req.params.id,
      req.params.userId,
      validated.role
    );

    return ApiResponse.success({
      res,
      data: member,
      message: 'Member role updated',
    });
  }

  static async removeMember(req: Request, res: Response) {
    await ProjectService.removeMember(req.params.id, req.params.userId);
    return ApiResponse.success({
      res,
      message: 'Member removed from project',
    });
  }

  // --- Components ---

  static async getComponents(req: Request, res: Response) {
    const components = await ProjectService.getComponents(req.params.id);
    return ApiResponse.success({
      res,
      data: components,
      message: 'Project components retrieved',
    });
  }

  static async createComponent(req: Request, res: Response) {
    const validated = createComponentSchema.parse(req.body);
    const component = await ProjectService.createComponent(req.params.id, validated);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: component,
      message: 'Component created successfully',
    });
  }

  // --- Versions ---

  static async getVersions(req: Request, res: Response) {
    const versions = await ProjectService.getVersions(req.params.id);
    return ApiResponse.success({
      res,
      data: versions,
      message: 'Project releases retrieved',
    });
  }

  static async createVersion(req: Request, res: Response) {
    const validated = createVersionSchema.parse(req.body);
    const version = await ProjectService.createVersion(req.params.id, validated);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: version,
      message: 'Release version created successfully',
    });
  }

  // --- Milestones ---

  static async getMilestones(req: Request, res: Response) {
    const milestones = await ProjectService.getMilestones(req.params.id);
    return ApiResponse.success({
      res,
      data: milestones,
      message: 'Project milestones retrieved',
    });
  }

  static async createMilestone(req: Request, res: Response) {
    const validated = createMilestoneSchema.parse(req.body);
    const milestone = await ProjectService.createMilestone(req.params.id, validated);

    return ApiResponse.success({
      res,
      statusCode: 201,
      data: milestone,
      message: 'Milestone created successfully',
    });
  }
}
