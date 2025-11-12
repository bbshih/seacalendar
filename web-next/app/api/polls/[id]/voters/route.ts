/**
 * GET /api/polls/[id]/voters - Get detailed voter information
 */

import { NextRequest } from 'next/server';
import { getVoterDetails } from '@/lib/services/vote';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request);
    const { id } = await params;
    const voters = await getVoterDetails(id, user.id);

    return successResponse({ voters });
  } catch (error) {
    return handleApiError(error);
  }
}
