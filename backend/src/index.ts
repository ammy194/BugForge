import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 BugForge REST API Server listening on port ${env.PORT}`);
  logger.info(`🌐 Environment: ${env.NODE_ENV}`);
  logger.info(`📡 API Base URL: http://localhost:${env.PORT}/api/v1`);
  logger.info(`🩺 Health Check: http://localhost:${env.PORT}/api/v1/health`);
});

// Graceful shutdown handling
const shutdown = (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down BugForge API Server...`);
  server.close(() => {
    logger.info('BugForge API Server closed cleanly.');
    process.exit(0);
  });

  // Force close if graceful shutdown stalls
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
