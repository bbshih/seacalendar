/**
 * POST /api/polls/[id]/reopen - Reopen a closed poll
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { reopenPoll } from '@/lib/services/poll';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const reopenPollSchema = z.object({
  days: z.number().int().min(1).max(60).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = reopenPollSchema.parse(body);
    const extensionDays = validatedData.days || 7;

    const poll = await reopenPoll(params.id, user.id, extensionDays);

    return successResponse({ poll }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
