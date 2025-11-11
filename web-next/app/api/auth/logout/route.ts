/**
 * POST /api/auth/logout - Logout user and revoke refresh token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { revokeRefreshToken } from '@/lib/services/jwt';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request);
    const body = await request.json();
    const { refreshToken } = logoutSchema.parse(body);

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    return successResponse({ message: 'Logged out successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
