/**
 * POST /api/auth/refresh - Refresh access token using refresh token from cookies
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { refreshAccessToken } from '@/lib/services/jwt';
import { handleApiError, successResponse, ErrorFactory } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    // Get refresh token from cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      throw ErrorFactory.unauthorized('Refresh token required');
    }

    // Generate new token pair
    const tokens = await refreshAccessToken(refreshToken);

    // Update cookies with new tokens
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return successResponse({ message: 'Tokens refreshed successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
