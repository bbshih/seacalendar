import { describe, it, expect } from 'vitest';
import {
  encodeEventToUrl,
  decodeEventFromUrl,
  generateOrganizerKey,
  verifyOrganizerKey,
  buildVotingUrl,
  buildResultsUrl,
  buildEventUrl,
  buildVenueUrl,
} from './urlState';
import { Event } from '../types';

describe('urlState', () => {
  const mockEvent: Event = {
    id: 'test-event-123',
    title: 'Q1 2025 Hangouts',
    organizer: 'Alice',
    dateOptions: [
      { id: 'date-1', date: '2025-01-10', label: 'Fri Jan 10' },
      { id: 'date-2', date: '2025-01-17', label: 'Fri Jan 17' },
    ],
    votes: [
      {
        voterName: 'Bob',
        selectedDates: ['date-1'],
        timestamp: '2025-01-01T12:00:00Z',
      },
    ],
    createdAt: '2025-01-01T10:00:00Z',
  };

  describe('encodeEventToUrl / decodeEventFromUrl', () => {
    it('should encode and decode an event correctly', () => {
      const encoded = encodeEventToUrl(mockEvent);
      const decoded = decodeEventFromUrl(encoded);

      expect(decoded).toEqual(mockEvent);
    });

    it('should produce a URL-safe string', () => {
      const encoded = encodeEventToUrl(mockEvent);

      // Should not contain spaces or special characters that break URLs
      expect(encoded).not.toContain(' ');
      expect(encoded).not.toContain('\n');
      expect(encoded.length).toBeGreaterThan(0);
    });

    it('should compress the data (encoded should be shorter than JSON)', () => {
      const encoded = encodeEventToUrl(mockEvent);
      const json = JSON.stringify(mockEvent);

      expect(encoded.length).toBeLessThan(json.length);
    });

    it('should return null when decoding null', () => {
      const decoded = decodeEventFromUrl(null);
      expect(decoded).toBeNull();
    });

    it('should return null when decoding invalid data', () => {
      const decoded = decodeEventFromUrl('invalid-data-123');
      expect(decoded).toBeNull();
    });

    it('should return null when decoding empty string', () => {
      const decoded = decodeEventFromUrl('');
      expect(decoded).toBeNull();
    });

    it('should handle events with finalized data', () => {
      const eventWithVenue: Event = {
        ...mockEvent,
        finalizedEvent: {
          selectedDateId: 'date-1',
          venue: {
            name: 'Test Restaurant',
            address: '123 Main St',
            time: '7:00 PM',
            websiteUrl: 'https://example.com',
            menuUrl: 'https://example.com/menu',
            notes: 'Bring ID',
          },
          attendees: ['Bob', 'Charlie'],
        },
      };

      const encoded = encodeEventToUrl(eventWithVenue);
      const decoded = decodeEventFromUrl(encoded);

      expect(decoded).toEqual(eventWithVenue);
    });

    it('should handle large events with many dates and votes', () => {
      const largeEvent: Event = {
        ...mockEvent,
        dateOptions: Array.from({ length: 50 }, (_, i) => ({
          id: `date-${i}`,
          date: `2025-01-${String(i + 1).padStart(2, '0')}`,
          label: `Date ${i + 1}`,
        })),
        votes: Array.from({ length: 20 }, (_, i) => ({
          voterName: `Voter ${i}`,
          selectedDates: [`date-${i}`, `date-${i + 1}`],
          timestamp: '2025-01-01T12:00:00Z',
        })),
      };

      const encoded = encodeEventToUrl(largeEvent);
      const decoded = decodeEventFromUrl(encoded);

      expect(decoded).toEqual(largeEvent);
    });
  });

  describe('generateOrganizerKey / verifyOrganizerKey', () => {
    it('should generate a consistent key for the same event ID', () => {
      const key1 = generateOrganizerKey('test-event-123');
      const key2 = generateOrganizerKey('test-event-123');

      expect(key1).toBe(key2);
    });

    it('should generate different keys for different event IDs', () => {
      const key1 = generateOrganizerKey('abc-123-456');
      const key2 = generateOrganizerKey('xyz-789-012');

      expect(key1).not.toBe(key2);
    });

    it('should generate a key of length 8', () => {
      const key = generateOrganizerKey('test-event-123');

      expect(key).toHaveLength(8);
    });

    it('should verify a valid organizer key', () => {
      const key = generateOrganizerKey('test-event-123');
      const isValid = verifyOrganizerKey('test-event-123', key);

      expect(isValid).toBe(true);
    });

    it('should reject an invalid organizer key', () => {
      const isValid = verifyOrganizerKey('test-event-123', 'wrong-key');

      expect(isValid).toBe(false);
    });

    it('should reject null organizer key', () => {
      const isValid = verifyOrganizerKey('test-event-123', null);

      expect(isValid).toBe(false);
    });
  });

  describe('buildVotingUrl', () => {
    it('should build a voting URL with encoded event data', () => {
      const url = buildVotingUrl(mockEvent, 'https://example.com/seacalendar');

      expect(url).toContain('https://example.com/seacalendar#/vote?data=');
      expect(url).toContain('data=');
    });

    it('should include the event data that can be decoded', () => {
      const url = buildVotingUrl(mockEvent, 'https://example.com');
      const dataParam = url.split('data=')[1];
      const decoded = decodeEventFromUrl(dataParam);

      expect(decoded).toEqual(mockEvent);
    });
  });

  describe('buildResultsUrl', () => {
    it('should build a results URL with encoded event data and organizer key', () => {
      const url = buildResultsUrl(mockEvent, 'https://example.com/seacalendar');

      expect(url).toContain('https://example.com/seacalendar#/results?data=');
      expect(url).toContain('&key=');
    });

    it('should include a valid organizer key', () => {
      const url = buildResultsUrl(mockEvent, 'https://example.com');
      const keyParam = new URL(url.replace('#/', '')).searchParams.get('key');
      const expectedKey = generateOrganizerKey(mockEvent.id);

      expect(keyParam).toBe(expectedKey);
    });

    it('should include decodeable event data', () => {
      const url = buildResultsUrl(mockEvent, 'https://example.com');
      const dataParam = url.split('data=')[1].split('&')[0];
      const decoded = decodeEventFromUrl(dataParam);

      expect(decoded).toEqual(mockEvent);
    });
  });

  describe('buildEventUrl', () => {
    it('should build an event summary URL with encoded event data', () => {
      const url = buildEventUrl(mockEvent, 'https://example.com/seacalendar');

      expect(url).toContain('https://example.com/seacalendar#/event?data=');
      expect(url).toContain('data=');
    });

    it('should not include an organizer key', () => {
      const url = buildEventUrl(mockEvent, 'https://example.com');

      expect(url).not.toContain('&key=');
    });
  });

  describe('buildVenueUrl', () => {
    it('should build a venue selection URL with encoded event data and organizer key', () => {
      const url = buildVenueUrl(mockEvent, 'https://example.com/seacalendar');

      expect(url).toContain('https://example.com/seacalendar#/venue?data=');
      expect(url).toContain('&key=');
    });

    it('should include a valid organizer key', () => {
      const url = buildVenueUrl(mockEvent, 'https://example.com');
      const keyParam = new URL(url.replace('#/', '')).searchParams.get('key');
      const expectedKey = generateOrganizerKey(mockEvent.id);

      expect(keyParam).toBe(expectedKey);
    });
  });
});
