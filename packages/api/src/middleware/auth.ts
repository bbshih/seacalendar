/**
 * Authentication Middleware
 * Verifies JWT tokens and attaches user to request
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../services/jwt';
import { ErrorFactory } from './errorHandler';
import { prisma } from '@seacalendar/database';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        discordId: string;
        email?: string;
        username: string;
        discriminator: string;
        avatar?: string | null;
      };
    }
  }
}

/**
 * Extract token from Authorization header
 */
const extractToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Format: "Bearer <token>"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Require authentication - user must be logged in
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token
    const token = extractToken(req);
    if (!token) {
      throw ErrorFactory.unauthorized('No token provided');
    }

    // Verify token
    const payload: JwtPayload = verifyAccessToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw ErrorFactory.unauthorized('User not found');
    }

    // Attach user to request
    req.user = {
      id: user.id,
      discordId: user.discordId,
      email: user.email || undefined,
      username: user.username,
      discriminator: user.discriminator,
      avatar: user.avatar,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - don't fail if token is missing/invalid
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Extract token
    const token = extractToken(req);
    if (!token) {
      return next(); // No token, continue without user
    }

    // Verify token
    try {
      const payload: JwtPayload = verifyAccessToken(token);

      // Fetch user from database
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (user) {
        // Attach user to request
        req.user = {
          id: user.id,
          discordId: user.discordId,
          email: user.email || undefined,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
        };
      }
    } catch (error) {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if authenticated user is the poll creator
 */
export const requirePollOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw ErrorFactory.unauthorized('Authentication required');
    }

    const pollId = req.params.id || req.params.pollId;
    if (!pollId) {
      throw ErrorFactory.badRequest('Poll ID required');
    }

    // Fetch poll and check creator
    const poll = await prisma.poll.findUnique({
      where: { id: pollId },
      select: { creatorId: true },
    });

    if (!poll) {
      throw ErrorFactory.notFound('Poll not found');
    }

    if (poll.creatorId !== req.user.id) {
      throw ErrorFactory.forbidden('You do not have permission to modify this poll');
    }

    next();
  } catch (error) {
    next(error);
  }
};
