import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

export const notFoundHandler = (_req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  void _next;
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err }, 'Application error');
    }
    return res.status(err.statusCode).json({ message: err.message });
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Unexpected error occurred' });
};
