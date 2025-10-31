/**
 * Natural Language Processing service
 * Parses event descriptions to extract dates and details
 */

import * as chrono from 'chrono-node';
import { addDays, startOfDay, format } from 'date-fns';

export interface ParsedEvent {
  title: string;
  dates: Date[];
  times: string[];
  description?: string;
  raw: string;
}

/**
 * Parse natural language event description
 * Examples:
 * - "Q1 2025 Hangout - Fridays and Saturdays in January"
 * - "Movie night next Friday and Saturday at 7pm"
 * - "Dinner on Jan 10, Jan 17, and Jan 24 at 7:30pm"
 * - "Boys Night every weekend in December"
 */
export function parseEventDescription(text: string): ParsedEvent {
  const parsed: ParsedEvent = {
    title: '',
    dates: [],
    times: [],
    description: '',
    raw: text,
  };

  // Check for "every [day(s)] in [month/year]" pattern
  const everyPattern = /every\s+(weekend|weekday|day|monday|tuesday|wednesday|thursday|friday|saturday|sunday)s?\s+in\s+(\w+)/i;
  const everyMatch = text.match(everyPattern);

  if (everyMatch) {
    const dayType = everyMatch[1].toLowerCase();
    const monthText = everyMatch[2];

    // Parse the month/year
    const monthResult = chrono.parse(monthText);
    if (monthResult.length > 0) {
      const targetDate = monthResult[0].start.date();
      const year = targetDate.getFullYear();
      const month = targetDate.getMonth();

      // Determine which days of week to include
      let daysOfWeek: number[] = [];
      if (dayType === 'weekend') {
        daysOfWeek = [0, 6]; // Saturday and Sunday
      } else if (dayType === 'weekday') {
        daysOfWeek = [1, 2, 3, 4, 5]; // Monday-Friday
      } else {
        // Parse specific day
        daysOfWeek = parseDayOfWeek(dayType);
      }

      // Generate all matching dates in the month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      parsed.dates = generateDateRange(firstDay, lastDay, daysOfWeek);
    }
  } else {
    // Parse dates using chrono-node
    const chronoResults = chrono.parse(text);

    if (chronoResults.length > 0) {
      // Extract dates, filtering out vague time references
      for (const result of chronoResults) {
        // Skip vague references like "night", "morning", "evening" without specific dates
        if (result.text.match(/^(night|morning|evening|afternoon)$/i) && !result.start.isCertain('day')) {
          continue;
        }

        const date = result.start.date();
        parsed.dates.push(date);

        // Extract time if present
        if (result.start.isCertain('hour')) {
          const time = format(date, 'h:mm a');
          if (!parsed.times.includes(time)) {
            parsed.times.push(time);
          }
        }
      }

      // Remove duplicate dates
      parsed.dates = Array.from(new Set(parsed.dates.map(d => d.toISOString())))
        .map(iso => new Date(iso))
        .sort((a, b) => a.getTime() - b.getTime());
    }
  }

  // Try to extract title
  if (everyMatch) {
    // For "every X in Y" pattern, title is everything before "every"
    const titleCandidate = text.substring(0, everyMatch.index).trim();
    if (titleCandidate.length > 0 && titleCandidate.length < 100) {
      parsed.title = titleCandidate;
    }
  } else {
    // For explicit dates, title is before first date mention
    const chronoResults = chrono.parse(text);
    if (chronoResults.length > 0) {
      const firstDateIndex = chronoResults[0].index;
      const titleCandidate = text.substring(0, firstDateIndex).trim();

      // Remove common prefixes
      const cleanTitle = titleCandidate
        .replace(/^(event|hangout|gathering|meeting|dinner|lunch)[\s:]*-?[\s:]*/i, '')
        .trim();

      if (cleanTitle.length > 0 && cleanTitle.length < 100) {
        parsed.title = cleanTitle;
      }
    }
  }

  // If no title found, use first few words
  if (!parsed.title) {
    const words = text.split(/\s+/).slice(0, 5);
    parsed.title = words.join(' ');
  }

  return parsed;
}

/**
 * Generate date options from a date range and days of week
 * Example: "Fridays and Saturdays in January" → [Jan 3, Jan 4, Jan 10, Jan 11, ...]
 */
export function generateDateRange(
  startDate: Date,
  endDate: Date,
  daysOfWeek: number[] // 0=Sunday, 5=Friday, 6=Saturday
): Date[] {
  const dates: Date[] = [];
  let current = startOfDay(startDate);
  const end = startOfDay(endDate);

  while (current <= end) {
    if (daysOfWeek.includes(current.getDay())) {
      dates.push(new Date(current));
    }
    current = addDays(current, 1);
  }

  return dates;
}

/**
 * Parse day of week from text
 * Returns day number (0-6) or -1 if not found
 */
export function parseDayOfWeek(text: string): number[] {
  const days: number[] = [];
  const lower = text.toLowerCase();

  const dayMap: Record<string, number> = {
    sunday: 0,
    sun: 0,
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    friday: 5,
    fri: 5,
    saturday: 6,
    sat: 6,
  };

  for (const [name, num] of Object.entries(dayMap)) {
    if (lower.includes(name)) {
      if (!days.includes(num)) {
        days.push(num);
      }
    }
  }

  return days.sort();
}

/**
 * Format date for display
 */
export function formatDateOption(date: Date): string {
  return format(date, 'EEE MMM d, yyyy');
}

/**
 * Validate parsed event
 */
export function validateParsedEvent(parsed: ParsedEvent): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!parsed.title || parsed.title.length < 3) {
    errors.push('Event title must be at least 3 characters');
  }

  if (parsed.title.length > 100) {
    errors.push('Event title must be less than 100 characters');
  }

  if (parsed.dates.length === 0) {
    errors.push('At least one date must be specified');
  }

  if (parsed.dates.length > 50) {
    errors.push('Maximum of 50 dates allowed');
  }

  // Check for past dates
  const now = new Date();
  const pastDates = parsed.dates.filter(d => d < now);
  if (pastDates.length > 0) {
    errors.push('All dates must be in the future');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
