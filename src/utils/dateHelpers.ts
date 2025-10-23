import { DateOption } from '../types';

/**
 * Format an ISO date string into a display label
 * Example: "2025-01-10" -> "Fri Jan 10"
 */
export function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00'); // Add time to avoid timezone issues
  const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  return `${dayOfWeek} ${month} ${day}`;
}

/**
 * Generate all dates in a range that match specified days of week
 * @param startDate - Start date (inclusive)
 * @param endDate - End date (inclusive)
 * @param daysOfWeek - Array of day numbers (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * @returns Array of ISO date strings
 */
export function generateDatesInRange(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[]
): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    if (daysOfWeek.includes(current.getDay())) {
      // Format as ISO date string (YYYY-MM-DD)
      const year = current.getFullYear();
      const month = String(current.getMonth() + 1).padStart(2, '0');
      const day = String(current.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Create a DateOption object from an ISO date string
 */
export function createDateOption(isoDate: string, id?: string): DateOption {
  return {
    id: id || `date-${isoDate}`,
    date: isoDate,
    label: formatDateLabel(isoDate),
  };
}

/**
 * Generate DateOptions for a range of dates with specified days of week
 */
export function generateDateOptions(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[]
): DateOption[] {
  const dates = generateDatesInRange(startDate, endDate, daysOfWeek);
  return dates.map((date, index) => createDateOption(date, `date-${index}`));
}

/**
 * Parse a date string in various formats to a Date object
 * Supports: YYYY-MM-DD, MM/DD/YYYY, etc.
 */
export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Format a date for display in full format
 * Example: "2025-01-10" -> "Friday, January 10, 2025"
 */
export function formatDateFull(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get day of week abbreviation (0-6 -> Sun-Sat)
 */
export function getDayName(dayNumber: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayNumber] || '';
}
