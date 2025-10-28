import LZString from 'lz-string';
import { Event } from '../types';

/**
 * Encode an Event object into a compressed URL-safe string
 */
export function encodeEventToUrl(event: Event): string {
  const json = JSON.stringify(event);
  return LZString.compressToEncodedURIComponent(json);
}

/**
 * Decode a compressed URL string back into an Event object
 * Returns null if decoding fails
 */
export function decodeEventFromUrl(encoded: string | null): Event | null {
  if (!encoded) return null;

  try {
    const json = LZString.decompressFromEncodedURIComponent(encoded);
    if (!json) return null;
    return JSON.parse(json);
  } catch (error) {
    console.error('Failed to decode event from URL', error);
    return null;
  }
}

/**
 * Generate a simple organizer key based on event ID
 * Not cryptographically secure, just prevents accidental edits
 */
export function generateOrganizerKey(eventId: string): string {
  return btoa(eventId).substring(0, 8);
}

/**
 * Verify an organizer key matches the event ID
 */
export function verifyOrganizerKey(eventId: string, key: string | null): boolean {
  if (!key) return false;
  return generateOrganizerKey(eventId) === key;
}

/**
 * Build a voting URL for an event
 */
export function buildVotingUrl(event: Event, baseUrl?: string): string {
  const data = encodeEventToUrl(event);
  const base = baseUrl || `${window.location.origin}${window.location.pathname}`;
  return `${base}#/vote?data=${data}`;
}

/**
 * Build a results URL for an event (includes organizer key)
 */
export function buildResultsUrl(event: Event, baseUrl?: string): string {
  const data = encodeEventToUrl(event);
  const key = generateOrganizerKey(event.id);
  const base = baseUrl || `${window.location.origin}${window.location.pathname}`;
  return `${base}#/results?data=${data}&key=${key}`;
}

/**
 * Build an event summary URL
 */
export function buildEventUrl(event: Event, baseUrl?: string): string {
  const data = encodeEventToUrl(event);
  const base = baseUrl || `${window.location.origin}${window.location.pathname}`;
  return `${base}#/event?data=${data}`;
}

/**
 * Build a venue selection URL (includes organizer key)
 */
export function buildVenueUrl(event: Event, baseUrl?: string): string {
  const data = encodeEventToUrl(event);
  const key = generateOrganizerKey(event.id);
  const base = baseUrl || `${window.location.origin}${window.location.pathname}`;
  return `${base}#/venue?data=${data}&key=${key}`;
}
