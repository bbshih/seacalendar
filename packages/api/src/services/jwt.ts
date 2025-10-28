/**
 * JWT Token Service
 * Handles JWT generation, verification, and refresh tokens
 */

import jwt from 'jsonwebtoken';
import { Config } from '../config';
import { prisma } from '@seacalendar/database';
import { ErrorFactory } from '../middleware/errorHandler';

export interface JwtPayload {
  userId: string;
  discordId: string;
  email?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate JWT access token and refresh token
 */
export const generateTokens = async (payload: JwtPayload): Promise<TokenPair> => {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(payload, Config.jwtSecret, {
    expiresIn: Config.jwtExpiresIn,
  });

  // Generate refresh token (long-lived, stored in database)
  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    Config.jwtSecret,
    { expiresIn: Config.refreshTokenExpiresIn }
  );

  // Calculate expiration date
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  // Store refresh token in database
  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.userId,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: Config.jwtExpiresIn,
  };
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, Config.jwtSecret) as JwtPayload;
    return decoded;
  } catch (error) {
    throw ErrorFactory.unauthorized('Invalid or expired token');
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<TokenPair> => {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, Config.jwtSecret) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw ErrorFactory.unauthorized('Invalid token type');
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken) {
      throw ErrorFactory.unauthorized('Invalid or expired refresh token');
    }

    // Generate new token pair
    const newTokens = await generateTokens({
      userId: storedToken.user.id,
      discordId: storedToken.user.discordId,
      email: storedToken.user.email || undefined,
    });

    // Revoke old refresh token
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    return newTokens;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw ErrorFactory.unauthorized('Invalid refresh token');
    }
    throw error;
  }
};

/**
 * Revoke refresh token (logout)
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};
