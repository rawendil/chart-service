import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';

const logger = new Logger();

// Simple bearer token authentication middleware
export const authenticateBearerToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Bearer token required'
      });
      return;
    }

    // Check if token matches the expected bearer token from environment
    const expectedToken = process.env.BEARER_TOKEN;

    if (!expectedToken) {
      logger.error('BEARER_TOKEN not configured in environment');
      res.status(500).json({
        success: false,
        error: 'Server configuration error'
      });
      return;
    }

    if (token !== expectedToken) {
      res.status(401).json({
        success: false,
        error: 'Invalid bearer token'
      });
      return;
    }

    logger.debug('Bearer token authentication successful');
    next();
  } catch (error) {
    logger.error('Bearer token authentication error', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};