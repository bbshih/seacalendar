/**
 * Google OAuth Service
 */

import axios from 'axios';
import { config } from '@/lib/config';
import { ErrorFactory } from '@/lib/errors';

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleUserInfo {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name?: string;
  picture: string;
  locale?: string;
}

/**
 * Get Google OAuth authorization URL
 */
export function getGoogleAuthUrl(state?: string, includeCalendar?: boolean): string {
  const scopes = includeCalendar
    ? [...config.google.scopes.basic, ...config.google.scopes.calendar]
    : config.google.scopes.basic;

  const params = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline', // Get refresh token
    prompt: 'consent', // Force consent to get refresh token
    ...(state && { state }),
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeGoogleCode(code: string): Promise<GoogleTokenResponse> {
  try {
    const response = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        code,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        redirect_uri: config.google.redirectUri,
        grant_type: 'authorization_code',
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Google token exchange error:', error.response?.data || error.message);
    throw ErrorFactory.internal('Failed to exchange Google authorization code');
  }
}

/**
 * Get Google user info from access token
 */
export async function fetchGoogleUser(accessToken: string): Promise<GoogleUserInfo> {
  try {
    const response = await axios.get<GoogleUserInfo>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Google user info error:', error.response?.data || error.message);
    throw ErrorFactory.internal('Failed to fetch Google user info');
  }
}

/**
 * Refresh Google access token
 */
export async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse> {
  try {
    const response = await axios.post<GoogleTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        refresh_token: refreshToken,
        client_id: config.google.clientId,
        client_secret: config.google.clientSecret,
        grant_type: 'refresh_token',
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Google token refresh error:', error.response?.data || error.message);
    throw ErrorFactory.internal('Failed to refresh Google access token');
  }
}
