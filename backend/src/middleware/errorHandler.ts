import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { ApiResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ZodError } from 'zod';

export const errorHandler = (
  err: Error | AppError | ZodError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error processing [${req.method}] ${req.originalUrl}:`, {
    name: err.name,
    message: err.message,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return ApiResponse.error({
      res,
      statusCode: 400,
      message: 'Validation failed',
      details: formattedErrors,
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return ApiResponse.error({
      res,
      statusCode: err.statusCode,
      message: err.message,
      details: err.details,
    });
  }

  // Handle SyntaxError (e.g. malformed JSON body)
  if (err instanceof SyntaxError && 'body' in err) {
    return ApiResponse.error({
      res,
      statusCode: 400,
      message: 'Invalid JSON payload received',
    });
  }

  // Generic 500 Internal Server Error (hide internal details in production)
  const isDev = env.NODE_ENV === 'development';
  return ApiResponse.error({
    res,
    statusCode: 500,
    message: isDev ? err.message : 'Internal server error',
    details: isDev ? err.stack : undefined,
  });
};
