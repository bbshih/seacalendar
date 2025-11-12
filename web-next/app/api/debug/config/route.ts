/**
 * GET /api/debug/config - Check environment variables (dev only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  return NextResponse.json({
    discord: {
      clientId: config.discord.clientId?.substring(0, 10) + '...',
      redirectUri: config.discord.redirectUri,
      hasSecret: !!config.discord.clientSecret,
    },
    app: {
      url: config.appUrl,
    },
    env: process.env.NODE_ENV,
  });
}
