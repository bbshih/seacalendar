/**
 * POST /api/auth/logout - Logout user and revoke refresh token
 */

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { revokeRefreshToken } from '@/lib/services/jwt';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);

    // Get refresh token from cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Clear auth cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
