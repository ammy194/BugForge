import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse';

export const notFoundHandler = (req: Request, res: Response) => {
  return ApiResponse.error({
    res,
    statusCode: 404,
    message: `API endpoint not found: [${req.method}] ${req.originalUrl}`,
  });
};
