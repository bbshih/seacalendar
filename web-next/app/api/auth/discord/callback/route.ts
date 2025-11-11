/**
 * GET /api/auth/discord/callback - Discord OAuth callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
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

    // Redirect to web app with tokens
    const redirectUrl = new URL('/auth/callback', config.appUrl);
    redirectUrl.searchParams.set('token', tokens.accessToken);
    redirectUrl.searchParams.set('refreshToken', tokens.refreshToken);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (error) {
    return handleApiError(error);
  }
}
