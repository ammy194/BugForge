import { Router } from 'express';
import { healthRoutes } from './healthRoutes';
import { authRoutes } from './authRoutes';
import { userRoutes } from './userRoutes';
import { projectRoutes } from './projectRoutes';
import { issueRoutes } from './issueRoutes';
import { notificationRoutes } from './notificationRoutes';
import { viewRoutes } from './viewRoutes';

export const apiRouter = Router();

// Mount sub-routes under /api/v1
apiRouter.use('/health', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/issues', issueRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/views', viewRoutes);

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
      notifications: '/api/v1/notifications',
      views: '/api/v1/views',
      ai: '/api/v1/ai',
      github: '/api/v1/github',
      ci: '/api/v1/ci',
    },
  });
});
