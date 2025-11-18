/**
 * GET /api/auth/google/url - Get Google OAuth URL
 */

import { NextRequest } from 'next/server';
import { getGoogleAuthUrl } from '@/lib/services/google';
import { successResponse, handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const state = searchParams.get('state') || '/';
    const calendar = searchParams.get('calendar') === 'true';

    const authUrl = getGoogleAuthUrl(state, calendar);

    return successResponse({ authUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
