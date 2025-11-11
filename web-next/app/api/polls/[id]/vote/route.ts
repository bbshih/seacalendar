/**
 * POST /api/polls/[id]/vote - Submit or update vote
 * GET /api/polls/[id]/vote - Get current user's vote
 * DELETE /api/polls/[id]/vote - Delete current user's vote
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { submitVote, getUserVote, deleteVote } from '@/lib/services/vote';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const submitVoteSchema = z.object({
  availableOptionIds: z.array(z.string().uuid()).min(0),
  maybeOptionIds: z.array(z.string().uuid()).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const validatedData = submitVoteSchema.parse(body);

    const vote = await submitVote(params.id, user.id, validatedData);

    return successResponse({ vote }, 200);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    const vote = await getUserVote(params.id, user.id);

    return successResponse({ vote });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request);
    await deleteVote(params.id, user.id);

    return successResponse({ message: 'Vote deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
