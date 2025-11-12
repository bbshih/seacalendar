/**
 * Authentication utilities for Next.js API routes
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from './services/jwt';
import { ErrorFactory } from './errors';
import { UserContext } from './types';
import { db } from './db';

/**
 * Extract and verify JWT from request cookies
 * Returns user context or null if not authenticated
 */
export async function getAuthUser(request: NextRequest): Promise<UserContext | null> {
  try {
    // Get token from HTTP-only cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);

    // Fetch full user details
    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        username: true,
        discordId: true,
        email: true,
      },
    });

    if (!user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Require authentication - throws error if not authenticated
 * Use in API routes that require auth
 */
export async function requireAuth(request: NextRequest): Promise<UserContext> {
  const user = await getAuthUser(request);

  if (!user) {
    throw ErrorFactory.unauthorized('Authentication required');
  }

  return user;
}

/**
 * Optional authentication - returns user or null
 * Use in API routes where auth is optional
 */
export async function optionalAuth(request: NextRequest): Promise<UserContext | null> {
  return await getAuthUser(request);
}
