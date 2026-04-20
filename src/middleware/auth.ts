import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { env } from '../config/env';

const logger = new Logger();

// API Key authentication middleware
export const authenticateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.header('x-api-key');

    if (!apiKey || apiKey !== env.API_KEY) {
      res.status(401).json({
        success: false,
        error: 'Invalid or missing API key'
      });
      return;
    }

    logger.debug('API key authentication successful');
    next();
  } catch (error) {
    logger.error('API key authentication error', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};