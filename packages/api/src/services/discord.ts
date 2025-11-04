/**
 * Discord OAuth Service
 * Handles Discord OAuth2 flow and user data fetching
 */

import { Config } from '../config';
import { ErrorFactory } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';
import { prisma } from '@seacalendar/database';
import { ApiError } from '../utils/errors';

export interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  verified?: boolean;
}

/**
 * Exchange OAuth code for access token
 */
export const exchangeCodeForToken = async (code: string): Promise<DiscordTokenResponse> => {
  try {
    const params = new URLSearchParams({
      client_id: Config.discord.clientId,
      client_secret: Config.discord.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: Config.discord.redirectUri,
    });

    const response = await fetch(Config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Discord token exchange failed', { error });
      throw ErrorFactory.unauthorized('Failed to exchange Discord code for token');
    }

    const data = await response.json() as DiscordTokenResponse;
    return data;
  } catch (error) {
    logger.error('Discord OAuth error', { error });
    throw ErrorFactory.internal('Discord OAuth failed');
  }
};

/**
 * Fetch Discord user profile using access token
 */
export const fetchDiscordUser = async (accessToken: string): Promise<DiscordUser> => {
  try {
    const response = await fetch(Config.discord.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Discord user fetch failed', { error });
      throw ErrorFactory.unauthorized('Failed to fetch Discord user');
    }

    const user = await response.json() as DiscordUser;
    return user;
  } catch (error) {
    logger.error('Discord user fetch error', { error });
    throw ErrorFactory.internal('Failed to fetch Discord user');
  }
};

/**
 * Refresh Discord access token
 */
export const refreshDiscordToken = async (refreshToken: string): Promise<DiscordTokenResponse> => {
  try {
    const params = new URLSearchParams({
      client_id: Config.discord.clientId,
      client_secret: Config.discord.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(Config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      logger.error('Discord token refresh failed', { error });
      throw ErrorFactory.unauthorized('Failed to refresh Discord token');
    }

    const data = await response.json() as DiscordTokenResponse;
    return data;
  } catch (error) {
    logger.error('Discord token refresh error', { error });
    throw ErrorFactory.internal('Discord token refresh failed');
  }
};

/**
 * Build Discord OAuth authorization URL
 */
export const getAuthorizationUrl = (state?: string): string => {
  const params = new URLSearchParams({
    client_id: Config.discord.clientId,
    redirect_uri: Config.discord.redirectUri,
    response_type: 'code',
    scope: Config.discord.scopes.join(' '),
  });

  if (state) {
    params.append('state', state);
  }

  return `${Config.discord.authUrl}?${params.toString()}`;
};

/**
 * Create or link Discord account
 * Similar to Google OAuth but for Discord
 */
export const createOrLinkAccount = async (
  code: string,
  existingUserId?: string
): Promise<{ user: any; isNewUser: boolean }> => {
  // Exchange code for tokens
  const tokens = await exchangeCodeForToken(code);

  // Get Discord user info
  const discordUser = await fetchDiscordUser(tokens.access_token);

  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  // If linking to existing account
  if (existingUserId) {
    // Check if Discord account already linked to another user
    const existingProvider = await prisma.authProvider.findUnique({
      where: {
        provider_providerId: {
          provider: 'DISCORD',
          providerId: discordUser.id,
        },
      },
    });

    if (existingProvider && existingProvider.userId !== existingUserId) {
      throw new ApiError(
        'This Discord account is already linked to another user',
        400,
        'DISCORD_ALREADY_LINKED'
      );
    }

    // Create or update Discord auth provider
    await prisma.authProvider.upsert({
      where: {
        userId_provider: {
          userId: existingUserId,
          provider: 'DISCORD',
        },
      },
      create: {
        userId: existingUserId,
        provider: 'DISCORD',
        providerId: discordUser.id,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        providerData: discordUser,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
        providerData: discordUser,
      },
    });

    // Update user with Discord info
    const user = await prisma.user.update({
      where: { id: existingUserId },
      data: {
        discordId: discordUser.id,
        avatar: discordUser.avatar || undefined,
        requireDiscordLink: false, // No longer need to link
        discordLinkDeadline: null,
      },
      include: {
        preferences: true,
        authProviders: true,
      },
    });

    // Also store in legacy DiscordToken table for backward compatibility
    await prisma.discordToken.upsert({
      where: { userId: existingUserId },
      create: {
        userId: existingUserId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });

    return { user, isNewUser: false };
  }

  // Check if Discord account already exists
  const existingProvider = await prisma.authProvider.findUnique({
    where: {
      provider_providerId: {
        provider: 'DISCORD',
        providerId: discordUser.id,
      },
    },
    include: {
      user: {
        include: {
          preferences: true,
          authProviders: true,
        },
      },
    },
  });

  if (existingProvider) {
    // Update tokens
    await prisma.authProvider.update({
      where: { id: existingProvider.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
        scope: tokens.scope,
      },
    });

    // Update legacy DiscordToken table
    await prisma.discordToken.upsert({
      where: { userId: existingProvider.userId },
      create: {
        userId: existingProvider.userId,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt,
      },
    });

    return { user: existingProvider.user, isNewUser: false };
  }

  // Create new user
  const username = discordUser.username.replace(/[^a-zA-Z0-9_-]/g, '_');

  // Ensure unique username
  let finalUsername = username;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username: finalUsername } })) {
    finalUsername = `${username}${counter}`;
    counter++;
  }

  const user = await prisma.user.create({
    data: {
      username: finalUsername,
      discordId: discordUser.id,
      displayName: discordUser.username,
      email: discordUser.email,
      emailVerified: discordUser.verified || false,
      avatar: discordUser.avatar,
      discriminator: discordUser.discriminator,
      requireDiscordLink: false, // Already has Discord
      preferences: {
        create: {},
      },
      authProviders: {
        create: {
          provider: 'DISCORD',
          providerId: discordUser.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt,
          scope: tokens.scope,
          providerData: discordUser,
        },
      },
    },
    include: {
      preferences: true,
      authProviders: true,
    },
  });

  // Also store in legacy DiscordToken table for backward compatibility
  await prisma.discordToken.create({
    data: {
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    },
  });

  return { user, isNewUser: true };
};
