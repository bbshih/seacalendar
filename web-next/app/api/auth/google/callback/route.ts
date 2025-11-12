/**
 * GET /api/auth/google/callback - Google OAuth callback handler
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { exchangeGoogleCode, fetchGoogleUser } from '@/lib/services/google';
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

    // Exchange code for Google access token
    const tokenData = await exchangeGoogleCode(code);

    // Fetch Google user profile
    const googleUser = await fetchGoogleUser(tokenData.access_token);

    // Check if Google account is already linked
    let authProvider = await db.authProvider.findUnique({
      where: {
        provider_providerId: {
          provider: 'GOOGLE',
          providerId: googleUser.id,
        },
      },
      include: {
        user: true,
      },
    });

    let user;

    if (authProvider) {
      // Existing user - update tokens and profile
      user = authProvider.user;

      await db.authProvider.update({
        where: { id: authProvider.id },
        data: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token || authProvider.refreshToken,
          expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
          scope: tokenData.scope,
          providerData: {
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            verified_email: googleUser.verified_email,
          },
        },
      });

      // Update user profile
      await db.user.update({
        where: { id: user.id },
        data: {
          email: googleUser.email || user.email,
          avatar: googleUser.picture || user.avatar,
          displayName: googleUser.name || user.displayName,
        },
      });

      console.log('Google user logged in:', { userId: user.id, googleId: googleUser.id });
    } else {
      // Check if email already exists (potential account linking)
      const existingUser = await db.user.findUnique({
        where: { email: googleUser.email },
      });

      if (existingUser) {
        // Link Google to existing account
        user = existingUser;

        await db.authProvider.create({
          data: {
            userId: user.id,
            provider: 'GOOGLE',
            providerId: googleUser.id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
            scope: tokenData.scope,
            providerData: {
              email: googleUser.email,
              name: googleUser.name,
              picture: googleUser.picture,
              verified_email: googleUser.verified_email,
            },
          },
        });

        console.log('Google account linked:', { userId: user.id, googleId: googleUser.id });
      } else {
        // Create new user
        user = await db.user.create({
          data: {
            username: googleUser.email.split('@')[0] + '_' + Math.random().toString(36).substring(7),
            email: googleUser.email,
            displayName: googleUser.name,
            avatar: googleUser.picture,
            emailVerified: googleUser.verified_email,
            requireDiscordLink: true,
            discordLinkDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            authProviders: {
              create: {
                provider: 'GOOGLE',
                providerId: googleUser.id,
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token,
                expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
                scope: tokenData.scope,
                providerData: {
                  email: googleUser.email,
                  name: googleUser.name,
                  picture: googleUser.picture,
                  verified_email: googleUser.verified_email,
                },
              },
            },
          },
        });

        console.log('New Google user created:', { userId: user.id, googleId: googleUser.id });
      }
    }

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
