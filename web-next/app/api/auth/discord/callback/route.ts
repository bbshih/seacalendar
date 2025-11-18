/**
 * GET /api/auth/discord/callback - Discord OAuth callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeCodeForToken, fetchDiscordUser } from '@/lib/services/discord';
import { generateTokens } from '@/lib/services/jwt';
import { db } from '@/lib/db';
import { config } from '@/lib/config';
import { ErrorFactory, handleApiError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
      throw ErrorFactory.badRequest('Authorization code required');
    }

    // Exchange code for Discord access token
    const tokenData = await exchangeCodeForToken(code);

    // Fetch Discord user profile
    const discordUser = await fetchDiscordUser(tokenData.access_token);

    // Find or create user in database
    let user = await db.user.findUnique({
      where: { discordId: discordUser.id },
    });

    if (!user) {
      // Create new user
      user = await db.user.create({
        data: {
          discordId: discordUser.id,
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          email: discordUser.email,
        },
      });
      console.log('New user created:', { userId: user.id, discordId: user.discordId });
    } else {
      // Update existing user info
      user = await db.user.update({
        where: { id: user.id },
        data: {
          username: discordUser.username,
          discriminator: discordUser.discriminator,
          avatar: discordUser.avatar,
          email: discordUser.email || user.email,
        },
      });
      console.log('User updated:', { userId: user.id });
    }

    // Store Discord refresh token (encrypted in production)
    await db.discordToken.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
      },
    });

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

    // Redirect to web app (state contains return URL)
    const redirectUrl = state || '/';
    return NextResponse.redirect(new URL(redirectUrl, config.appUrl).toString());
  } catch (error) {
    return handleApiError(error);
  }
}
