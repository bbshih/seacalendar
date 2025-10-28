/**
 * Discord OAuth Service
 * Handles Discord OAuth2 flow and user data fetching
 */

import { Config } from '../config';
import { ErrorFactory } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

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

    const data: DiscordTokenResponse = await response.json();
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

    const user: DiscordUser = await response.json();
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

    const data: DiscordTokenResponse = await response.json();
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
