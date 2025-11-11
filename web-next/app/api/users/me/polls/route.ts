/**
 * GET /api/users/me/polls - Get current user's polls
 */

import { NextRequest } from 'next/server';
import { getUserPolls } from '@/lib/services/user';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const polls = await getUserPolls(authUser.id);

    return successResponse({ polls });
  } catch (error) {
    return handleApiError(error);
  }
}
