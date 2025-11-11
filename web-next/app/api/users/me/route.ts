/**
 * GET /api/users/me - Get current user profile
 * PATCH /api/users/me - Update current user profile
 * DELETE /api/users/me - Delete current user account
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getUser, updateUser, deleteUser } from '@/lib/services/user';
import { requireAuth } from '@/lib/auth';
import { handleApiError, successResponse } from '@/lib/errors';

const updateUserSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const user = await getUser(authUser.id);

    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    const body = await request.json();
    const validatedData = updateUserSchema.parse(body);

    const user = await updateUser(authUser.id, validatedData);

    return successResponse({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authUser = await requireAuth(request);
    await deleteUser(authUser.id);

    return successResponse({ message: 'Account deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
