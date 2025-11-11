/**
 * GET /api/users/me/preferences - Get current user preferences
 * PATCH /api/users/me/preferences - Update current user preferences
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUser, updateUserPreferences } from '@/lib/services/user';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const updatePreferencesSchema = z.object({
  notifyViaDiscordDM: z.boolean().optional(),
  notifyViaEmail: z.boolean().optional(),
  notifyViaSMS: z.boolean().optional(),
  wantVoteReminders: z.boolean().optional(),
  wantEventReminders: z.boolean().optional(),
  showInStats: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const user = await getUser(authUser.id);

    return successResponse({ preferences: user.preferences });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validatedData = updatePreferencesSchema.parse(body);

    const preferences = await updateUserPreferences(authUser.id, validatedData);

    return successResponse({ preferences });
  } catch (error) {
    return handleApiError(error);
  }
}
