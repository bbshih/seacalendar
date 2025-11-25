/**
 * GET /api/users/me/stats - Get current user's statistics
 */

import { NextRequest } from 'next/server';
import { getUserStats } from '@/lib/services/user';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const stats = await getUserStats(authUser.id);

    return successResponse({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
