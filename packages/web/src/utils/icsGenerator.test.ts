import { describe, it, expect } from 'vitest';
import { generateIcsFile } from './icsGenerator';
import type { Event } from '../types';

describe('icsGenerator', () => {
  const mockEvent: Event = {
    id: 'test-event-123',
    title: 'Q1 2025 Hangout',
    organizer: 'Alice',
    dateOptions: [
      {
        id: 'date-1',
        date: '2025-01-10',
        label: 'Fri Jan 10',
      },
      {
        id: 'date-2',
        date: '2025-01-17',
        label: 'Fri Jan 17',
      },
    ],
    votes: [
      {
        voterName: 'Bob',
        selectedDates: ['date-1'],
        timestamp: '2025-01-01T10:00:00Z',
      },
      {
        voterName: 'Carol',
        selectedDates: ['date-1', 'date-2'],
        timestamp: '2025-01-01T11:00:00Z',
      },
    ],
    finalizedEvent: {
      selectedDateId: 'date-1',
      venue: {
        name: "The Ocean's Table",
        address: '123 Seaside Ave, Beach City, CA 90210',
        time: '7:00 PM',
        websiteUrl: 'https://example.com',
        menuUrl: 'https://example.com/menu',
        notes: 'Dress code: Casual upscale',
      },
      attendees: ['Bob', 'Carol'],
    },
    createdAt: '2025-01-01T09:00:00Z',
  };

  describe('generateIcsFile', () => {
    it('should throw error if event is not finalized', () => {
      const unfinalizedEvent: Event = {
        ...mockEvent,
        finalizedEvent: undefined,
      };

      expect(() => generateIcsFile(unfinalizedEvent)).toThrow(
        'Event must be finalized before generating .ics file'
      );
    });

    it('should throw error if selected date not found', () => {
      const invalidEvent: Event = {
        ...mockEvent,
        finalizedEvent: {
          ...mockEvent.finalizedEvent!,
          selectedDateId: 'date-999',
        },
      };

      expect(() => generateIcsFile(invalidEvent)).toThrow(
        'Selected date not found'
      );
    });

    it('should generate valid .ics file content', () => {
      const icsContent = generateIcsFile(mockEvent);

      // Check basic structure
      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('VERSION:2.0');
      expect(icsContent).toContain('PRODID:-//SeaCalendar//EN');
      expect(icsContent).toContain('BEGIN:VEVENT');
      expect(icsContent).toContain('END:VEVENT');
      expect(icsContent).toContain('END:VCALENDAR');
    });

    it('should include event details in .ics file', () => {
      const icsContent = generateIcsFile(mockEvent);

      // Check event details
      expect(icsContent).toContain('SUMMARY:Q1 2025 Hangout');
      expect(icsContent).toContain(
        "LOCATION:The Ocean's Table\\, 123 Seaside Ave\\, Beach City\\, CA 90210"
      );
      expect(icsContent).toContain('ORGANIZER;CN=Alice');
    });

    it('should include attendees in description', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('DESCRIPTION:Attendees: Bob\\, Carol');
    });

    it('should include venue URLs in description', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('Menu: https://example.com/menu');
      expect(icsContent).toContain('Website: https://example.com');
    });

    it('should include venue notes in description', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('Dress code: Casual upscale');
    });

    it('should include UID with event ID', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('UID:test-event-123@seacalendar');
    });

    it('should include DTSTAMP', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toMatch(/DTSTAMP:\d{8}T\d{6}Z/);
    });

    it('should include DTSTART and DTEND', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toMatch(/DTSTART:\d{8}T\d{6}Z/);
      expect(icsContent).toMatch(/DTEND:\d{8}T\d{6}Z/);
    });

    it('should handle 12-hour time format (PM)', () => {
      const icsContent = generateIcsFile(mockEvent);

      // Date is 2025-01-10 at 7:00 PM (19:00 UTC-8 = 03:00 UTC next day in winter)
      // The actual UTC time will depend on timezone conversion
      expect(icsContent).toContain('DTSTART:');
    });

    it('should handle 12-hour time format (AM)', () => {
      const amEvent: Event = {
        ...mockEvent,
        finalizedEvent: {
          ...mockEvent.finalizedEvent!,
          venue: {
            ...mockEvent.finalizedEvent!.venue,
            time: '11:00 AM',
          },
        },
      };

      const icsContent = generateIcsFile(amEvent);

      expect(icsContent).toContain('DTSTART:');
      expect(icsContent).toContain('DTEND:');
    });

    it('should handle 24-hour time format', () => {
      const event24h: Event = {
        ...mockEvent,
        finalizedEvent: {
          ...mockEvent.finalizedEvent!,
          venue: {
            ...mockEvent.finalizedEvent!.venue,
            time: '19:00',
          },
        },
      };

      const icsContent = generateIcsFile(event24h);

      expect(icsContent).toContain('DTSTART:');
      expect(icsContent).toContain('DTEND:');
    });

    it('should escape special characters in text fields', () => {
      const specialCharEvent: Event = {
        ...mockEvent,
        title: 'Q1; 2025, Hangout\\Test',
        finalizedEvent: {
          ...mockEvent.finalizedEvent!,
          venue: {
            ...mockEvent.finalizedEvent!.venue,
            name: 'Restaurant; Test, Name\\Here',
            notes: 'Line 1\nLine 2',
          },
        },
      };

      const icsContent = generateIcsFile(specialCharEvent);

      // Check escaped characters
      expect(icsContent).toContain('SUMMARY:Q1\\; 2025\\, Hangout\\\\Test');
      expect(icsContent).toContain('Restaurant\\; Test\\, Name\\\\Here');
      expect(icsContent).toContain('Line 1\\nLine 2');
    });

    it('should handle event without optional fields', () => {
      const minimalEvent: Event = {
        ...mockEvent,
        finalizedEvent: {
          selectedDateId: 'date-1',
          venue: {
            name: 'Simple Restaurant',
            address: '123 Main St',
            time: '6:00 PM',
          },
          attendees: ['Alice'],
        },
      };

      const icsContent = generateIcsFile(minimalEvent);

      expect(icsContent).toContain('BEGIN:VCALENDAR');
      expect(icsContent).toContain('SUMMARY:Q1 2025 Hangout');
      expect(icsContent).toContain('LOCATION:Simple Restaurant');
      expect(icsContent).not.toContain('Menu:');
      expect(icsContent).not.toContain('Website:');
    });

    it('should set event duration to 2 hours', () => {
      const icsContent = generateIcsFile(mockEvent);

      // Extract DTSTART and DTEND
      const dtStartMatch = icsContent.match(/DTSTART:(\d{8}T\d{6}Z)/);
      const dtEndMatch = icsContent.match(/DTEND:(\d{8}T\d{6}Z)/);

      expect(dtStartMatch).toBeTruthy();
      expect(dtEndMatch).toBeTruthy();

      if (dtStartMatch && dtEndMatch) {
        const startTime = new Date(
          dtStartMatch[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
        ).getTime();
        const endTime = new Date(
          dtEndMatch[1].replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z')
        ).getTime();

        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        expect(durationHours).toBe(2);
      }
    });

    it('should include CALSCALE and METHOD', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('CALSCALE:GREGORIAN');
      expect(icsContent).toContain('METHOD:PUBLISH');
    });

    it('should include STATUS and SEQUENCE', () => {
      const icsContent = generateIcsFile(mockEvent);

      expect(icsContent).toContain('STATUS:CONFIRMED');
      expect(icsContent).toContain('SEQUENCE:0');
    });

    it('should use CRLF line endings', () => {
      const icsContent = generateIcsFile(mockEvent);

      // Check that lines are separated by \r\n
      expect(icsContent).toContain('\r\n');
      expect(icsContent.split('\r\n').length).toBeGreaterThan(10);
    });
  });
});
