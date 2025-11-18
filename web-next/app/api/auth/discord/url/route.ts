/**
 * GET /api/auth/discord/url - Get Discord OAuth authorization URL
 */

import { NextRequest } from 'next/server';
import { getAuthorizationUrl } from '@/lib/services/discord';
import { successResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state') || undefined;

  console.log('Discord URL request - state:', state);
  const authUrl = getAuthorizationUrl(state);
  console.log('Generated authUrl:', authUrl);

  return successResponse({ authUrl });
}
