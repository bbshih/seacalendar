import { useState, useEffect } from 'react';
import type { Event } from '../types';
import { fetchEventFromGist } from '../utils/githubStorage';

/**
 * Hook for loading password-protected or key-based encrypted events
 * Handles both URL-key based access and password-based access
 */
export function usePasswordProtectedEvent(
  gistId: string | null,
  encryptionKey: string | null
) {
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Password state
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Load event from Gist
  useEffect(() => {
    if (!gistId) {
      setLoadError('Invalid link - missing event ID');
      setIsLoading(false);
      return;
    }

    loadEvent();
  }, [gistId]);

  const loadEvent = async () => {
    if (!gistId) return;

    setIsLoading(true);
    setLoadError('');

    try {
      // Check if we have an encryption key in the URL
      if (encryptionKey) {
        // Normal flow with key in URL
        const eventData = await fetchEventFromGist(gistId, encryptionKey);
        setEvent(eventData);
      } else {
        // Password-protected event - need password
        setNeedsPassword(true);
      }
    } catch (error) {
      console.error('Failed to load event:', error);
      setLoadError(
        error instanceof Error ? error.message : 'Failed to load event'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setPasswordError('Please enter the event password');
      return;
    }

    setIsLoading(true);
    setPasswordError('');

    try {
      // For password-protected events, we need to try decrypting
      // We don't know the eventId yet, so we'll use the gistId as a placeholder
      // The actual eventId will be in the decrypted data
      const eventData = await fetchEventFromGist(
        gistId!,
        '', // Empty key - will be derived from password
        undefined,
        password,
        gistId ?? undefined // Use gistId as salt temporarily - this is a limitation
      );
      setEvent(eventData);
      setNeedsPassword(false);
      setPasswordError('');
    } catch (error) {
      console.error('Failed to decrypt event:', error);
      setPasswordError('Wrong password or corrupted data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPasswordError = () => {
    setPasswordError('');
  };

  return {
    // Event state
    event,
    setEvent,
    isLoading,
    loadError,

    // Password state
    needsPassword,
    password,
    setPassword,
    passwordError,
    resetPasswordError,

    // Actions
    loadEvent,
    handlePasswordSubmit,
  };
}
