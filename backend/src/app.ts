import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import { apiRouter } from './routes';

export const createApp = () => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Dynamic CORS Configuration
  const allowedOrigins = [
    env.CLIENT_URL,
    env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
  ].filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        // Allow configured origins or any vercel.app preview deployment
        const isAllowed =
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.includes('localhost') ||
          origin.includes('127.0.0.1');

        if (isAllowed) {
          callback(null, true);
        } else {
          callback(null, true); // Permissive fallback with credentials enabled
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    })
  );

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Logging
  if (env.NODE_ENV !== 'test') {
    app.use(requestLogger);
  }

  // Health Endpoint for Render / Load Balancer probes
  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'BugForge REST API',
      timestamp: new Date().toISOString(),
    });
  });

  // Mount API Router
  app.use('/api/v1', apiRouter);

  // Root Welcome Route
  app.get('/', (_req, res) => {
    res.json({
      name: 'BugForge API Server',
      status: 'online',
      version: '1.0.0',
      apiDocs: '/api/v1',
      healthCheck: '/health',
    });
  });

  // 404 Handler
  app.use(notFoundHandler);

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
