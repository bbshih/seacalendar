/**
 * POST /api/auth/refresh - Refresh access token using refresh token
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { refreshAccessToken } from '@/lib/services/jwt';
import { handleApiError, successResponse } from '@/lib/errors';

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { refreshToken } = refreshSchema.parse(body);

    // Generate new token pair
    const tokens = await refreshAccessToken(refreshToken);

    return successResponse({ data: tokens });
  } catch (error) {
    return handleApiError(error);
  }
}
