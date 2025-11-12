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

const updatePollSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  votingDeadline: z.string().datetime().optional(),
  status: z.enum(['DRAFT', 'VOTING', 'FINALIZED', 'CANCELLED', 'EXPIRED']).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Optional auth - allow viewing public polls
    const user = await optionalAuth(request);
    const { id } = await params;
    const poll = await getPoll(id, user?.id);

    return successResponse({ poll });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
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
    const validatedData = updatePollSchema.parse(body);

    // Convert string dates to Date objects
    const updateData = {
      ...validatedData,
      votingDeadline: validatedData.votingDeadline
        ? new Date(validatedData.votingDeadline)
        : undefined,
    };

    const poll = await updatePoll(id, user.id, updateData);

    return successResponse({ poll });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await requireAuth(request);
    const { id } = await params;
    const poll = await cancelPoll(id, user.id);

    return successResponse({ poll }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}
