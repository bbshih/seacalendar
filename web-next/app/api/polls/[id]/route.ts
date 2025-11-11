/**
 * GET /api/polls/[id] - Get poll details
 * PATCH /api/polls/[id] - Update poll
 * DELETE /api/polls/[id] - Cancel poll
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getPoll, updatePoll, cancelPoll } from '@/lib/services/poll';
import { requireAuth, optionalAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';
import { PollStatus } from '@prisma/client';

const updatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  votingDeadline: z.string().datetime().optional(),
  status: z.nativeEnum(PollStatus).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Optional auth - allow viewing public polls
    const user = await optionalAuth(request);
    const poll = await getPoll(params.id, user?.id);

    return successResponse({ poll });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updatePollSchema.parse(body);

    // Convert string dates to Date objects
    const updateData = {
      ...validatedData,
      votingDeadline: validatedData.votingDeadline
        ? new Date(validatedData.votingDeadline)
        : undefined,
    };

    const poll = await updatePoll(params.id, user.id, updateData);

    return successResponse({ poll });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    const poll = await cancelPoll(params.id, user.id);

    return successResponse({ poll }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
