/**
 * Tests for Natural Language Processing service
 */

import { describe, it, expect } from 'vitest';
import {
  parseEventDescription,
  validateParsedEvent,
  parseDayOfWeek,
  generateDateRange,
} from './nlp';

describe('NLP Service', () => {
  describe('parseEventDescription', () => {
    it('should parse event with explicit dates', () => {
      const result = parseEventDescription('Q1 Hangout on January 10 and January 17 at 7pm');

      expect(result.title).toContain('Q1');
      expect(result.dates.length).toBeGreaterThan(0);
      expect(result.times).toContain('7:00 PM');
    });

    it('should parse event with relative dates', () => {
      const result = parseEventDescription('Movie night next Friday and Saturday');

      expect(result.title).toBeTruthy();
      expect(result.dates.length).toBeGreaterThan(0);
    });

    it('should handle event without explicit times', () => {
      const result = parseEventDescription('Dinner on Friday');

      expect(result.title).toBeTruthy();
      expect(result.dates.length).toBeGreaterThan(0);
      expect(result.times.length).toBe(0);
    });

    it('should extract title from beginning of text', () => {
      const result = parseEventDescription('Summer BBQ on July 4th at noon');

      expect(result.title.toLowerCase()).toContain('summer');
    });
  });

  describe('validateParsedEvent', () => {
    it('should validate a good event', () => {
      const parsed = {
        title: 'Valid Event',
        dates: [new Date(Date.now() + 86400000)], // Tomorrow
        times: ['7:00 PM'],
        raw: 'test',
      };

      const result = validateParsedEvent(parsed);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject event with no title', () => {
      const parsed = {
        title: '',
        dates: [new Date(Date.now() + 86400000)],
        times: [],
        raw: 'test',
      };

      const result = validateParsedEvent(parsed);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('title'))).toBe(true);
    });

    it('should reject event with no dates', () => {
      const parsed = {
        title: 'Valid Title',
        dates: [],
        times: [],
        raw: 'test',
      };

      const result = validateParsedEvent(parsed);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('date'))).toBe(true);
    });

    it('should reject event with too many dates', () => {
      const parsed = {
        title: 'Valid Title',
        dates: Array.from({ length: 51 }, (_, i) => new Date(Date.now() + i * 86400000)),
        times: [],
        raw: 'test',
      };

      const result = validateParsedEvent(parsed);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Maximum'))).toBe(true);
    });
  });

  describe('parseDayOfWeek', () => {
    it('should parse full day names', () => {
      const result = parseDayOfWeek('Friday and Saturday');
      expect(result).toContain(5); // Friday
      expect(result).toContain(6); // Saturday
    });

    it('should parse abbreviated day names', () => {
      const result = parseDayOfWeek('Fri and Sat');
      expect(result).toContain(5);
      expect(result).toContain(6);
    });

    it('should return empty array if no days found', () => {
      const result = parseDayOfWeek('no days here');
      expect(result).toHaveLength(0);
    });
  });

  describe('generateDateRange', () => {
    it('should generate dates for specific days of week', () => {
      const start = new Date('2025-01-01'); // Wednesday
      const end = new Date('2025-01-31');
      const daysOfWeek = [5, 6]; // Friday, Saturday

      const result = generateDateRange(start, end, daysOfWeek);

      expect(result.length).toBeGreaterThan(0);
      // Check that all dates are Friday or Saturday
      result.forEach(date => {
        expect([5, 6]).toContain(date.getDay());
      });
    });

    it('should handle single day', () => {
      const start = new Date('2025-01-03'); // Friday
      const end = new Date('2025-01-03');
      const daysOfWeek = [5]; // Friday

      const result = generateDateRange(start, end, daysOfWeek);

      expect(result).toHaveLength(1);
    });
  });
});
