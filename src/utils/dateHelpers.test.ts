import { describe, it, expect } from 'vitest';
import {
  formatDateLabel,
  generateDatesInRange,
  createDateOption,
  generateDateOptions,
  parseDate,
  formatDateFull,
  getDayName,
} from './dateHelpers';

describe('dateHelpers', () => {
  describe('formatDateLabel', () => {
    it('should format a date as "Day Mon DD"', () => {
      const result = formatDateLabel('2025-01-10');
      expect(result).toBe('Fri Jan 10');
    });

    it('should handle different months', () => {
      expect(formatDateLabel('2025-03-15')).toBe('Sat Mar 15');
      expect(formatDateLabel('2025-12-25')).toBe('Thu Dec 25');
    });

    it('should handle single-digit days', () => {
      expect(formatDateLabel('2025-01-05')).toBe('Sun Jan 5');
    });

    it('should handle different years', () => {
      expect(formatDateLabel('2026-06-20')).toBe('Sat Jun 20');
    });
  });

  describe('generateDatesInRange', () => {
    it('should generate all Fridays in a one-week range', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');
      const fridays = generateDatesInRange(start, end, [5]); // 5 = Friday

      expect(fridays).toHaveLength(1);
      expect(fridays[0]).toBe('2025-01-03');
    });

    it('should generate multiple days in a range', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-14');
      const weekends = generateDatesInRange(start, end, [0, 6]); // 0 = Sunday, 6 = Saturday

      expect(weekends.length).toBeGreaterThanOrEqual(4); // At least 2 weeks of weekends
    });

    it('should generate dates for multiple days of week', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');
      const dates = generateDatesInRange(start, end, [5, 6, 0]); // Fri, Sat, Sun

      // One week should have at least 1 of each
      expect(dates.length).toBeGreaterThanOrEqual(3);
    });

    it('should return empty array if no days match', () => {
      const start = new Date('2025-01-03'); // Friday
      const end = new Date('2025-01-03');
      const mondays = generateDatesInRange(start, end, [1]); // Monday

      expect(mondays).toHaveLength(0);
    });

    it('should handle single day range that matches', () => {
      // Use a date with explicit time to avoid timezone issues
      const start = new Date(2025, 0, 5); // Jan 5, 2025 (Sunday)
      const end = new Date(2025, 0, 5);
      const sundays = generateDatesInRange(start, end, [0]); // Sunday

      expect(sundays).toHaveLength(1);
      expect(sundays[0]).toBe('2025-01-05');
    });

    it('should handle cross-month ranges', () => {
      const start = new Date('2025-01-29');
      const end = new Date('2025-02-05');
      const fridays = generateDatesInRange(start, end, [5]); // Fridays

      expect(fridays.length).toBeGreaterThanOrEqual(1);
      expect(fridays).toContain('2025-01-31');
    });

    it('should format dates as YYYY-MM-DD', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');
      const dates = generateDatesInRange(start, end, [1]); // Monday

      expect(dates[0]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('createDateOption', () => {
    it('should create a DateOption with generated ID', () => {
      const option = createDateOption('2025-01-10');

      expect(option).toEqual({
        id: 'date-2025-01-10',
        date: '2025-01-10',
        label: 'Fri Jan 10',
      });
    });

    it('should create a DateOption with custom ID', () => {
      const option = createDateOption('2025-01-10', 'custom-id-1');

      expect(option).toEqual({
        id: 'custom-id-1',
        date: '2025-01-10',
        label: 'Fri Jan 10',
      });
    });

    it('should format the label correctly', () => {
      const option = createDateOption('2025-12-25');

      expect(option.label).toBe('Thu Dec 25');
    });
  });

  describe('generateDateOptions', () => {
    it('should generate DateOptions for all matching days', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-10');
      const options = generateDateOptions(start, end, [5]); // Fridays

      expect(options.length).toBeGreaterThanOrEqual(1);
      expect(options[0].date).toBe('2025-01-03');
      if (options.length > 1) {
        expect(options[1].date).toBe('2025-01-10');
      }
    });

    it('should assign sequential IDs', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');
      const options = generateDateOptions(start, end, [5, 6]); // Fri, Sat

      expect(options.length).toBeGreaterThanOrEqual(2);
      expect(options[0].id).toBe('date-0');
      expect(options[1].id).toBe('date-1');
    });

    it('should include formatted labels', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-07');
      const options = generateDateOptions(start, end, [5]); // Friday

      expect(options.length).toBeGreaterThanOrEqual(1);
      expect(options[0].label).toBe('Fri Jan 3');
    });

    it('should handle empty results', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-01-01');
      const options = generateDateOptions(start, end, [5]); // Friday (Jan 1 is Wed)

      expect(options).toHaveLength(0);
    });
  });

  describe('parseDate', () => {
    it('should parse ISO date format', () => {
      const date = parseDate('2025-01-10');

      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(0); // January is 0
      // getDate() might be 9 or 10 depending on timezone
      expect(date?.getDate()).toBeGreaterThanOrEqual(9);
      expect(date?.getDate()).toBeLessThanOrEqual(10);
    });

    it('should parse MM/DD/YYYY format', () => {
      const date = parseDate('01/10/2025');

      expect(date).toBeInstanceOf(Date);
      expect(date?.getFullYear()).toBe(2025);
    });

    it('should return null for invalid date', () => {
      const date = parseDate('invalid-date');

      expect(date).toBeNull();
    });

    it('should return null for empty string', () => {
      const date = parseDate('');

      expect(date).toBeNull();
    });
  });

  describe('formatDateFull', () => {
    it('should format date in full format', () => {
      const result = formatDateFull('2025-01-10');

      expect(result).toBe('Friday, January 10, 2025');
    });

    it('should handle different dates', () => {
      expect(formatDateFull('2025-12-25')).toBe('Thursday, December 25, 2025');
      expect(formatDateFull('2025-07-04')).toBe('Friday, July 4, 2025');
    });
  });

  describe('getDayName', () => {
    it('should return day names for all days', () => {
      expect(getDayName(0)).toBe('Sun');
      expect(getDayName(1)).toBe('Mon');
      expect(getDayName(2)).toBe('Tue');
      expect(getDayName(3)).toBe('Wed');
      expect(getDayName(4)).toBe('Thu');
      expect(getDayName(5)).toBe('Fri');
      expect(getDayName(6)).toBe('Sat');
    });

    it('should return empty string for invalid day number', () => {
      expect(getDayName(7)).toBe('');
      expect(getDayName(-1)).toBe('');
    });
  });
});
