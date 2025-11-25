/**
 * Discord OAuth Service
 * Handles Discord OAuth2 flow and user data fetching
 */

import { config } from '../config';
import { ErrorFactory } from '../errors';

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
export async function exchangeCodeForToken(code: string): Promise<DiscordTokenResponse> {
  try {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.discord.redirectUri,
    });

    const response = await fetch(config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Discord token exchange failed:', error);
      throw ErrorFactory.unauthorized('Failed to exchange Discord code for token');
    }

    const data = (await response.json()) as DiscordTokenResponse;
    return data;
  } catch (error) {
    console.error('Discord OAuth error:', error);
    throw ErrorFactory.internal('Discord OAuth failed');
  }
}

/**
 * Fetch Discord user profile using access token
 */
export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  try {
    const response = await fetch(config.discord.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Discord user fetch failed:', error);
      throw ErrorFactory.unauthorized('Failed to fetch Discord user');
    }

    const user = (await response.json()) as DiscordUser;
    return user;
  } catch (error) {
    console.error('Discord user fetch error:', error);
    throw ErrorFactory.internal('Failed to fetch Discord user');
  }
}

/**
 * Refresh Discord access token
 */
export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  try {
    const params = new URLSearchParams({
      client_id: config.discord.clientId,
      client_secret: config.discord.clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const response = await fetch(config.discord.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Discord token refresh failed:', error);
      throw ErrorFactory.unauthorized('Failed to refresh Discord token');
    }

    const data = (await response.json()) as DiscordTokenResponse;
    return data;
  } catch (error) {
    console.error('Discord token refresh error:', error);
    throw ErrorFactory.internal('Discord token refresh failed');
  }
}

/**
 * Build Discord OAuth authorization URL
 */
export function getAuthorizationUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: config.discord.clientId,
    redirect_uri: config.discord.redirectUri,
    response_type: 'code',
    scope: config.discord.scopes.join(' '),
  });

  if (state) {
    params.append('state', state);
  }

  return `${config.discord.authUrl}?${params.toString()}`;
}
