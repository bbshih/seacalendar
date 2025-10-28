import type { Event } from '../types';

/**
 * Gets the list of attendees (voters) who selected a specific date
 *
 * @param event - The event object containing votes
 * @param dateId - The ID of the date to check
 * @returns Array of attendee names who selected this date
 */
export function getAttendeesForDate(event: Event, dateId: string): string[] {
  return event.votes
    .filter((vote) => vote.selectedDates.includes(dateId))
    .map((vote) => vote.voterName);
}

/**
 * Gets the count of attendees for a specific date
 *
 * @param event - The event object containing votes
 * @param dateId - The ID of the date to check
 * @returns Number of attendees for this date
 */
export function getAttendeeCount(event: Event, dateId: string): number {
  return getAttendeesForDate(event, dateId).length;
}

/**
 * Gets the list of voters who did NOT select a specific date
 *
 * @param event - The event object containing votes
 * @param dateId - The ID of the date to check
 * @returns Array of voter names who did not select this date
 */
export function getVotersNotAvailable(event: Event, dateId: string): string[] {
  return event.votes
    .filter((vote) => !vote.selectedDates.includes(dateId))
    .map((vote) => vote.voterName);
}
