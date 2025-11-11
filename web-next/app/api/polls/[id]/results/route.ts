/**
 * GET /api/polls/[id]/results - Get vote results
 */

import { NextRequest } from 'next/server';
import { getVoteResults } from '@/lib/services/vote';
import { optionalAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth - allow viewing public poll results
    await optionalAuth(request);
    const results = await getVoteResults(params.id);

    return successResponse({ results });
  } catch (error) {
    return handleApiError(error);
  }
}
