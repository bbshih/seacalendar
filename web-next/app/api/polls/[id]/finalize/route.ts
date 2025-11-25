/**
 * POST /api/polls/[id]/finalize - Finalize poll with winning option
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { finalizePoll } from '@/lib/services/poll';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const finalizePollSchema = z.object({
  optionId: z.string().uuid(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Await params in Next.js 15
    const { id } = await params;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = finalizePollSchema.parse(body);

    const poll = await finalizePoll(id, user.id, validatedData.optionId);

    return successResponse({ poll }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
