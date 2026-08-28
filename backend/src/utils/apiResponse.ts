import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message?: string;
  data?: T;
  meta?: Record<string, any>;
}

export class ApiResponse {
  static success<T>({
    res,
    statusCode = 200,
    message = 'Success',
    data,
    meta,
  }: ApiResponseOptions<T>) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    });
  }

  static error({
    res,
    statusCode = 500,
    message = 'An error occurred',
    details,
  }: {
    res: Response;
    statusCode?: number;
    message?: string;
    details?: any;
  }) {
    return res.status(statusCode).json({
      success: false,
      message,
      error: details,
      timestamp: new Date().toISOString(),
    });
  }
}
