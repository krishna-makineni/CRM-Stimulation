import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function auth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token === 'mock-jwt-token') {
      (req as any).user = { id: 'mock-user-id', role: 'admin' };
      logger.info('User authenticated successfully');
      return next();
    }
  }

  // Pass through with a default mock user so we don't break existing client calls that don't have authorization header.
  (req as any).user = { id: 'mock-user-id', role: 'admin' };
  next();
}
