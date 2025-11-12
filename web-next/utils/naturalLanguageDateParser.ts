/**
 * Parse natural language date inputs into ISO date strings
 * Supports patterns like "tomorrow", "next week", "12/25/2024", etc.
 */

export function parseDateFromNaturalLanguage(input: string): string[] {
  const trimmedInput = input.trim().toLowerCase();
  const dates: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Helper to format date as ISO string
  const toISODate = (date: Date) => date.toISOString().split('T')[0];

  // Pattern: "tomorrow"
  if (trimmedInput === 'tomorrow') {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return [toISODate(tomorrow)];
  }

  // Pattern: "today"
  if (trimmedInput === 'today') {
    return [toISODate(today)];
  }

  // Pattern: "next [day of week]"
  const nextDayMatch = trimmedInput.match(/^next\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/);
  if (nextDayMatch) {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDay = dayNames.indexOf(nextDayMatch[1]);
    const currentDay = today.getDay();
    const daysUntil = ((targetDay - currentDay + 7) % 7) || 7;
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + daysUntil);
    return [toISODate(nextDate)];
  }

  // Pattern: "next week" - all 7 days starting next Monday
  if (trimmedInput === 'next week') {
    const currentDay = today.getDay();
    const daysUntilMonday = ((1 - currentDay + 7) % 7) || 7;
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + daysUntilMonday + i);
      dates.push(toISODate(date));
    }
    return dates;
  }

  // Pattern: "this weekend" - Saturday and Sunday
  if (trimmedInput === 'this weekend' || trimmedInput === 'weekend') {
    const currentDay = today.getDay();
    const daysUntilSaturday = (6 - currentDay + 7) % 7;
    const saturday = new Date(today);
    saturday.setDate(saturday.getDate() + (daysUntilSaturday === 0 ? 0 : daysUntilSaturday));
    const sunday = new Date(saturday);
    sunday.setDate(sunday.getDate() + 1);
    return [toISODate(saturday), toISODate(sunday)];
  }

  // Pattern: "next 3 days", "next 5 days", etc.
  const nextDaysMatch = trimmedInput.match(/^next\s+(\d+)\s+days?$/);
  if (nextDaysMatch) {
    const numDays = parseInt(nextDaysMatch[1], 10);
    if (numDays > 0 && numDays <= 30) {
      for (let i = 1; i <= numDays; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        dates.push(toISODate(date));
      }
      return dates;
    }
  }

  // Pattern: "all weekdays next week"
  if (trimmedInput.includes('weekday') && trimmedInput.includes('next week')) {
    const currentDay = today.getDay();
    const daysUntilMonday = ((1 - currentDay + 7) % 7) || 7;
    for (let i = 0; i < 5; i++) { // Mon-Fri
      const date = new Date(today);
      date.setDate(date.getDate() + daysUntilMonday + i);
      dates.push(toISODate(date));
    }
    return dates;
  }

  // Pattern: specific date formats like "12/25", "12/25/2024", "2024-12-25"
  const dateMatch = trimmedInput.match(/^(\d{1,2})\/(\d{1,2})(\/(\d{4}))?$/);
  if (dateMatch) {
    const month = parseInt(dateMatch[1], 10) - 1;
    const day = parseInt(dateMatch[2], 10);
    const year = dateMatch[4] ? parseInt(dateMatch[4], 10) : today.getFullYear();
    const parsedDate = new Date(year, month, day);
    if (!isNaN(parsedDate.getTime())) {
      return [toISODate(parsedDate)];
    }
  }

  return [];
}
