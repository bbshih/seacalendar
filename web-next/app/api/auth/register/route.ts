/**
 * POST /api/auth/register - Register with username/password
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { registerUser } from '@/lib/services/localAuth';
import { generateTokens } from '@/lib/services/jwt';
import { successResponse, handleApiError } from '@/lib/errors';
import { z } from 'zod';

const registerSchema = z.object({
  username: z.string().min(3).max(20),
  email: z.string().email().optional(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Register user
    const user = await registerUser(data);

    // Generate JWT tokens
    const tokens = await generateTokens({
      userId: user.id,
      discordId: user.discordId,
      email: user.email || undefined,
    });

    // Set HTTP-only cookies
    const cookieStore = await cookies();
    const isProduction = process.env.NODE_ENV === 'production';

    cookieStore.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return successResponse(
      {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          requireDiscordLink: user.requireDiscordLink,
          discordLinkDeadline: user.discordLinkDeadline,
        },
      },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
