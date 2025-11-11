/**
 * GET /api/votes/stats - Get current user's voting statistics
 */

import { NextRequest } from 'next/server';
import { getUserVoteStats } from '@/lib/services/vote';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const stats = await getUserVoteStats(user.id);

    return successResponse({ stats });
  } catch (error) {
    return handleApiError(error);
  }
}
