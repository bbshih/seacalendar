/**
 * Utilities for managing user's created events in localStorage
 */

export interface SavedEvent {
  gistId: string;
  title: string;
  createdAt: string;
  votingUrl: string;
  resultsUrl: string;
}

const MY_EVENTS_KEY = 'seacalendar_my_events';

/**
 * Save an event to the user's list
 */
export function saveMyEvent(event: SavedEvent): void {
  const events = getMyEvents();

  // Check if event already exists (by gistId)
  const existingIndex = events.findIndex(e => e.gistId === event.gistId);

  if (existingIndex >= 0) {
    // Update existing event
    events[existingIndex] = event;
  } else {
    // Add new event
    events.unshift(event); // Add to beginning
  }

  localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(events));
}

/**
 * Get all saved events
 */
export function getMyEvents(): SavedEvent[] {
  try {
    const data = localStorage.getItem(MY_EVENTS_KEY);
    if (!data) return [];

    const events = JSON.parse(data);
    return Array.isArray(events) ? events : [];
  } catch (error) {
    console.error('Error loading my events:', error);
    return [];
  }
}

/**
 * Remove an event from the list
 */
export function removeMyEvent(gistId: string): void {
  const events = getMyEvents();
  const filtered = events.filter(e => e.gistId !== gistId);
  localStorage.setItem(MY_EVENTS_KEY, JSON.stringify(filtered));
}

/**
 * Clear all saved events
 */
export function clearMyEvents(): void {
  localStorage.removeItem(MY_EVENTS_KEY);
}
