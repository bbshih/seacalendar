/**
 * GitHub Gist storage utilities for SeaCalendar
 * Provides CRUD operations for storing encrypted event data in private Gists
 */

import type { Event } from '../types';
import { encryptData, decryptData, generateEncryptionKey, deriveKeyFromPassword } from './encryption';

const GIST_FILENAME = 'seacalendar-event.enc';

/**
 * GitHub Personal Access Token
 * Users can create one at: https://github.com/settings/tokens
 * Required scopes: gist
 */
export interface GistConfig {
  token: string; // GitHub PAT
}

/**
 * Result from creating an event with Gist storage
 */
export interface CreateEventResult {
  gistId: string;
  encryptionKey: string;
  votingUrl: string;
  resultsUrl: string;
  deleteToken: string; // Simple token to prevent accidental deletion
}

/**
 * Store GitHub token in localStorage
 * Token will persist across browser sessions for convenience
 * Users can clear it anytime using the "Disconnect" button
 */
export function saveGitHubToken(token: string): void {
  localStorage.setItem('seacalendar_github_token', token);
}

/**
 * Get GitHub token from localStorage
 */
export function getGitHubToken(): string | null {
  return localStorage.getItem('seacalendar_github_token');
}

/**
 * Clear GitHub token from localStorage
 */
export function clearGitHubToken(): void {
  localStorage.removeItem('seacalendar_github_token');
}

/**
 * Create a new event and store it in a private encrypted Gist
 * If password is provided, uses password-based encryption (no key in URL)
 */
export async function createEventGist(
  event: Event,
  config: GistConfig,
  password?: string
): Promise<CreateEventResult> {
  // Use password-based key derivation if password provided
  const encryptionKey = password
    ? await deriveKeyFromPassword(password, event.id)
    : generateEncryptionKey();

  const encrypted = await encryptData(JSON.stringify(event), encryptionKey);

  const response = await fetch('https://api.github.com/gists', {
    method: 'POST',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      description: `SeaCalendar Event: ${event.title}`,
      public: false, // Private Gist
      files: {
        [GIST_FILENAME]: {
          content: encrypted,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to create Gist: ${error.message || response.statusText}`);
  }

  const gist = await response.json();
  const gistId = gist.id;

  // Generate URLs
  const baseUrl = `${window.location.origin}${window.location.pathname}`;

  // If password-protected, don't include key in URL
  const votingUrl = password
    ? `${baseUrl}#/vote?gist=${gistId}`
    : `${baseUrl}#/vote?gist=${gistId}&key=${encodeURIComponent(encryptionKey)}`;

  const resultsUrl = password
    ? `${baseUrl}#/results?gist=${gistId}&org=${btoa(event.id)}`
    : `${baseUrl}#/results?gist=${gistId}&key=${encodeURIComponent(encryptionKey)}&org=${btoa(event.id)}`;

  const deleteToken = btoa(gistId).substring(0, 8);

  return {
    gistId,
    encryptionKey,
    votingUrl,
    resultsUrl,
    deleteToken,
  };
}

/**
 * Fetch and decrypt event data from a Gist
 * If password is provided, derives key from password instead of using direct key
 */
export async function fetchEventFromGist(
  gistId: string,
  encryptionKey: string,
  config?: GistConfig,
  password?: string,
  eventId?: string
): Promise<Event> {
  // If password provided, derive the key
  let actualKey = encryptionKey;
  if (password && eventId) {
    actualKey = await deriveKeyFromPassword(password, eventId);
  }
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add auth if available (increases rate limits)
  if (config?.token) {
    headers.Authorization = `token ${config.token}`;
  }

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    headers,
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Event not found - it may have been deleted');
    }
    throw new Error(`Failed to fetch event: ${response.statusText}`);
  }

  const gist = await response.json();
  const encryptedContent = gist.files[GIST_FILENAME]?.content;

  if (!encryptedContent) {
    throw new Error('Event data not found in Gist');
  }

  const decrypted = await decryptData(encryptedContent, actualKey);
  return JSON.parse(decrypted);
}

/**
 * Update event data in a Gist (e.g., add a vote)
 * If password is provided, derives key from password
 */
export async function updateEventGist(
  gistId: string,
  event: Event,
  encryptionKey: string,
  config: GistConfig,
  password?: string
): Promise<void> {
  // If password provided, derive the key
  const actualKey = password
    ? await deriveKeyFromPassword(password, event.id)
    : encryptionKey;

  const encrypted = await encryptData(JSON.stringify(event), actualKey);

  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [GIST_FILENAME]: {
          content: encrypted,
        },
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to update Gist: ${error.message || response.statusText}`);
  }
}

/**
 * Delete a Gist (cleanup after event)
 */
export async function deleteEventGist(
  gistId: string,
  config: GistConfig
): Promise<void> {
  const response = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `token ${config.token}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to delete Gist: ${response.statusText}`);
  }
}

/**
 * Check if GitHub token is valid
 */
export async function validateGitHubToken(token: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `token ${token}`,
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get GitHub rate limit info
 */
export async function getGitHubRateLimit(token?: string): Promise<{
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `token ${token}`;
  }

  const response = await fetch('https://api.github.com/rate_limit', {
    headers,
  });

  const data = await response.json();
  const core = data.resources.core;

  return {
    limit: core.limit,
    remaining: core.remaining,
    reset: new Date(core.reset * 1000),
  };
}
