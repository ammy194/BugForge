import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';
import { checkSupabaseConnection } from '../services/supabase';
import { env } from '../config/env';

export const getHealth = async (_req: Request, res: Response) => {
  const uptimeSeconds = process.uptime();
  const memoryUsage = process.memoryUsage();
  const supabaseHealth = await checkSupabaseConnection();

  const healthData = {
    status: 'healthy',
    service: 'BugForge API Server',
    version: '1.0.0',
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      formatted: `${Math.floor(uptimeSeconds / 60)}m ${Math.floor(uptimeSeconds % 60)}s`,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
    },
    integrations: {
      supabase: supabaseHealth,
      grokAI: {
        configured: Boolean(env.GROK_API_KEY && env.GROK_API_KEY.length > 0),
        endpoint: env.GROK_API_URL,
      },
      github: {
        configured: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
      },
    },
  };

  return ApiResponse.success({
    res,
    statusCode: 200,
    message: 'BugForge API is operational',
    data: healthData,
  });
};
