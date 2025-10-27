import { Event } from '../types';

/**
 * Generates an RFC-5545 compliant .ics (iCalendar) file content
 * @param event - The finalized event to generate calendar file for
 * @returns .ics file content as a string
 * @throws Error if event is not finalized or selected date not found
 */
export function generateIcsFile(event: Event): string {
  if (!event.finalizedEvent) {
    throw new Error('Event must be finalized before generating .ics file');
  }

  const { venue, selectedDateId, attendees } = event.finalizedEvent;
  const dateOption = event.dateOptions.find((d) => d.id === selectedDateId);

  if (!dateOption) {
    throw new Error('Selected date not found');
  }

  // Parse date and time
  // venue.time is in format "7:00 PM" or "19:00"
  const eventDate = parseDateAndTime(dateOption.date, venue.time);
  const dtStart = formatIcsDateTime(eventDate);
  const dtEnd = formatIcsDateTime(
    new Date(eventDate.getTime() + 2 * 60 * 60 * 1000)
  ); // +2 hours default

  // Build description
  let description = `Attendees: ${attendees.join(', ')}`;
  if (venue.menuUrl) description += `\\nMenu: ${venue.menuUrl}`;
  if (venue.websiteUrl) description += `\\nWebsite: ${venue.websiteUrl}`;
  if (venue.notes) description += `\\n\\n${venue.notes}`;

  // Generate unique timestamp
  const now = new Date();
  const dtstamp = formatIcsDateTime(now);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SeaCalendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.id}@seacalendar`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `LOCATION:${escapeIcsText(venue.name + ', ' + venue.address)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    `ORGANIZER;CN=${escapeIcsText(event.organizer)}:MAILTO:noreply@seacalendar.app`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return icsContent;
}

/**
 * Parses a date string and time string into a Date object
 * @param dateStr - ISO date string (e.g., "2025-01-10")
 * @param timeStr - Time string (e.g., "7:00 PM" or "19:00")
 * @returns Date object
 */
function parseDateAndTime(dateStr: string, timeStr: string): Date {
  // Parse time string (handles both "7:00 PM" and "19:00" formats)
  let hours = 0;
  let minutes = 0;

  const time12HourMatch = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (time12HourMatch) {
    hours = parseInt(time12HourMatch[1], 10);
    minutes = parseInt(time12HourMatch[2], 10);
    const meridiem = time12HourMatch[3].toUpperCase();

    if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
  } else {
    // 24-hour format
    const time24HourMatch = timeStr.match(/(\d+):(\d+)/);
    if (time24HourMatch) {
      hours = parseInt(time24HourMatch[1], 10);
      minutes = parseInt(time24HourMatch[2], 10);
    }
  }

  // Create date object
  const date = new Date(dateStr);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

/**
 * Formats a Date object into iCalendar DATETIME format (UTC)
 * Format: YYYYMMDDTHHmmssZ
 * @param date - Date object to format
 * @returns Formatted datetime string
 */
function formatIcsDateTime(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in .ics text fields
 * Escapes: backslash, semicolon, comma, newline
 * @param text - Text to escape
 * @returns Escaped text
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\') // Escape backslashes
    .replace(/;/g, '\\;') // Escape semicolons
    .replace(/,/g, '\\,') // Escape commas
    .replace(/\n/g, '\\n'); // Escape newlines
}

/**
 * Triggers a download of the .ics file for the given event
 * @param event - The finalized event to download
 */
export function downloadIcsFile(event: Event): void {
  const icsContent = generateIcsFile(event);
  const blob = new Blob([icsContent], {
    type: 'text/calendar;charset=utf-8',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);

  // Generate filename from event title
  const filename = `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up the blob URL
  URL.revokeObjectURL(link.href);
}
