import { useSearchParams } from 'react-router-dom';
import type { Event } from '../types';
import { decodeEventFromUrl } from '../utils/urlState';

/**
 * Hook to read event data from URL query parameters
 */
export function useEventFromUrl(): Event | null {
  const [searchParams] = useSearchParams();
  const encodedData = searchParams.get('data');

  if (!encodedData) {
    return null;
  }

  return decodeEventFromUrl(encodedData);
}

/**
 * Hook to check if the current user has organizer access
 */
export function useOrganizerKey(): string | null {
  const [searchParams] = useSearchParams();
  return searchParams.get('key');
}
