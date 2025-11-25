/**
 * POST /api/polls - Create new poll
 * GET /api/polls/user/created - Get user's created polls (moved to separate route)
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createPoll } from '@/lib/services/poll';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

// Validation schema
const createPollSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  type: z.enum(['EVENT', 'GENERIC', 'QOTW']).optional(),
  votingDeadline: z.string().datetime().optional(),
  guildId: z.string().optional(),
  channelId: z.string().optional(),
  options: z
    .array(
      z.object({
        optionType: z.enum(['DATE', 'TEXT']).optional(),
        label: z.string().min(1).max(200),
        description: z.string().max(500).optional(),
        date: z.string().datetime().optional(),
        timeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        timeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      })
    )
    .min(1)
    .max(30),
  invitedUserIds: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request);

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createPollSchema.parse(body);

    // Convert string dates to Date objects
    const pollData = {
      ...validatedData,
      votingDeadline: validatedData.votingDeadline
        ? new Date(validatedData.votingDeadline)
        : undefined,
      options: validatedData.options.map((opt) => ({
        ...opt,
        date: opt.date ? new Date(opt.date) : undefined,
      })),
    };

    const poll = await createPoll(user.id, pollData);

    return successResponse({ poll }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
