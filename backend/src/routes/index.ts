import { Router } from 'express';
import { healthRoutes } from './healthRoutes';
import { authRoutes } from './authRoutes';
import { userRoutes } from './userRoutes';
import { projectRoutes } from './projectRoutes';

export const apiRouter = Router();

// Mount sub-routes under /api/v1
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/projects', projectRoutes);

// Root API v1 welcome info
apiRouter.get('/', (_req, res) => {
  res.json({
    name: 'BugForge REST API',
    version: 'v1',
    description: 'Modern Developer Bug & Issue Tracking Platform API',
    documentation: '/api/v1/docs',
    endpoints: {
      health: '/api/v1/health',
      auth: '/api/v1/auth',
      users: '/api/v1/users',
      projects: '/api/v1/projects',
      issues: '/api/v1/issues',
      ai: '/api/v1/ai',
      github: '/api/v1/github',
      ci: '/api/v1/ci',
      notifications: '/api/v1/notifications',
    },
  });
});
