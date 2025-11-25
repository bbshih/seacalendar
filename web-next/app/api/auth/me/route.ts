/**
 * GET /api/auth/me - Get current user info (requires authentication)
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
