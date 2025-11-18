/**
 * JWT Token Service
 * Handles JWT generation, verification, and refresh tokens
 */

import jwt from 'jsonwebtoken';
import { config } from '../config';
import { db } from '../db';
import { ErrorFactory } from '../errors';
import { JWTPayload } from '../types';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

/**
 * Generate JWT access token and refresh token
 */
export async function generateTokens(payload: JWTPayload): Promise<TokenPair> {
  // Generate access token (short-lived)
  const accessToken = jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });

  // Generate refresh token (long-lived, stored in database)
  const refreshToken = jwt.sign(
    { userId: payload.userId, type: 'refresh' },
    config.jwtSecret,
    { expiresIn: config.refreshTokenExpiresIn as jwt.SignOptions['expiresIn'] }
  );

  // Calculate expiration date (7 days to match refresh token)
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  // Store refresh token in database
  await db.refreshToken.create({
    data: {
      token: refreshToken,
      userId: payload.userId,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    expiresIn: config.jwtExpiresIn,
  };
}

/**
 * Verify JWT access token
 */
export function verifyAccessToken(token: string): JWTPayload {
  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JWTPayload;
    return decoded;
  } catch (error) {
    throw ErrorFactory.unauthorized('Invalid or expired token');
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<TokenPair> {
  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.jwtSecret) as { userId: string; type: string };

    if (decoded.type !== 'refresh') {
      throw ErrorFactory.unauthorized('Invalid token type');
    }

    // Check if refresh token exists and is not revoked
    const storedToken = await db.refreshToken.findFirst({
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
    await db.refreshToken.update({
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
}

/**
 * Revoke refresh token (logout)
 */
export async function revokeRefreshToken(token: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
}

/**
 * Revoke all refresh tokens for a user (logout all devices)
 */
export async function revokeAllUserTokens(userId: string): Promise<void> {
  await db.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
}
