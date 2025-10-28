import { describe, it, expect } from 'vitest';
import type { Event, DateOption, Vote } from '../types';
import {
  calculateVoteTallies,
  getAttendeesForDate,
  getTopVotedDates,
  hasVoterVoted,
  getVoterVote,
  getTotalVoters,
  getVoteStatistics,
} from './voteHelpers';

// Test data helpers
const createDateOption = (id: string, date: string, label: string): DateOption => ({
  id,
  date,
  label,
});

const createVote = (voterName: string, selectedDates: string[]): Vote => ({
  voterName,
  selectedDates,
  timestamp: new Date().toISOString(),
});

const createEvent = (
  dateOptions: DateOption[],
  votes: Vote[] = []
): Event => ({
  id: 'test-event-123',
  title: 'Test Event',
  organizer: 'Test Organizer',
  dateOptions,
  votes,
  createdAt: new Date().toISOString(),
});

describe('voteHelpers', () => {
  describe('calculateVoteTallies', () => {
    it('should return empty tallies for event with no votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const event = createEvent(dateOptions);

      const tallies = calculateVoteTallies(event);

      expect(tallies).toHaveLength(2);
      expect(tallies[0].voteCount).toBe(0);
      expect(tallies[1].voteCount).toBe(0);
      expect(tallies[0].voters).toEqual([]);
      expect(tallies[1].voters).toEqual([]);
    });

    it('should calculate tallies for single vote', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      const tallies = calculateVoteTallies(event);

      expect(tallies[0].dateOption.id).toBe('date-1');
      expect(tallies[0].voteCount).toBe(1);
      expect(tallies[0].voters).toEqual(['Alice']);
      expect(tallies[1].voteCount).toBe(0);
    });

    it('should calculate tallies for multiple votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
        createDateOption('date-3', '2025-01-24', 'Fri Jan 24'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-2']),
        createVote('Bob', ['date-2', 'date-3']),
        createVote('Charlie', ['date-2']),
      ];
      const event = createEvent(dateOptions, votes);

      const tallies = calculateVoteTallies(event);

      // date-2 should be first with 3 votes
      expect(tallies[0].dateOption.id).toBe('date-2');
      expect(tallies[0].voteCount).toBe(3);
      expect(tallies[0].voters).toEqual(['Alice', 'Bob', 'Charlie']);

      // date-1 and date-3 should have 1 vote each
      expect(tallies[1].voteCount).toBe(1);
      expect(tallies[2].voteCount).toBe(1);
    });

    it('should sort tallies by vote count descending', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
        createDateOption('date-3', '2025-01-24', 'Fri Jan 24'),
      ];
      const votes = [
        createVote('Alice', ['date-3']),
        createVote('Bob', ['date-1', 'date-3']),
        createVote('Charlie', ['date-1', 'date-2', 'date-3']),
      ];
      const event = createEvent(dateOptions, votes);

      const tallies = calculateVoteTallies(event);

      expect(tallies[0].dateOption.id).toBe('date-3'); // 3 votes
      expect(tallies[1].dateOption.id).toBe('date-1'); // 2 votes
      expect(tallies[2].dateOption.id).toBe('date-2'); // 1 vote
    });

    it('should sort tied dates by date ascending', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-24', 'Fri Jan 24'),
        createDateOption('date-2', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-3', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-2', 'date-3']),
      ];
      const event = createEvent(dateOptions, votes);

      const tallies = calculateVoteTallies(event);

      // All have 1 vote, should be sorted by date
      expect(tallies[0].dateOption.date).toBe('2025-01-10');
      expect(tallies[1].dateOption.date).toBe('2025-01-17');
      expect(tallies[2].dateOption.date).toBe('2025-01-24');
    });

    it('should handle votes for non-existent dates gracefully', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'non-existent-date']),
      ];
      const event = createEvent(dateOptions, votes);

      const tallies = calculateVoteTallies(event);

      expect(tallies).toHaveLength(1);
      expect(tallies[0].voteCount).toBe(1);
      expect(tallies[0].voters).toEqual(['Alice']);
    });

    it('should handle event with no date options', () => {
      const event = createEvent([]);

      const tallies = calculateVoteTallies(event);

      expect(tallies).toEqual([]);
    });
  });

  describe('getAttendeesForDate', () => {
    it('should return empty array for date with no votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const event = createEvent(dateOptions);

      const attendees = getAttendeesForDate(event, 'date-1');

      expect(attendees).toEqual([]);
    });

    it('should return single attendee', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      const attendees = getAttendeesForDate(event, 'date-1');

      expect(attendees).toEqual(['Alice']);
    });

    it('should return multiple attendees', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1']),
        createVote('Bob', ['date-1', 'date-2']),
        createVote('Charlie', ['date-1']),
      ];
      const event = createEvent(dateOptions, votes);

      const attendees = getAttendeesForDate(event, 'date-1');

      expect(attendees).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should only return attendees for specified date', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1']),
        createVote('Bob', ['date-2']),
      ];
      const event = createEvent(dateOptions, votes);

      const attendeesDate1 = getAttendeesForDate(event, 'date-1');
      const attendeesDate2 = getAttendeesForDate(event, 'date-2');

      expect(attendeesDate1).toEqual(['Alice']);
      expect(attendeesDate2).toEqual(['Bob']);
    });

    it('should return empty array for non-existent date', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      const attendees = getAttendeesForDate(event, 'non-existent');

      expect(attendees).toEqual([]);
    });
  });

  describe('getTopVotedDates', () => {
    it('should return empty array for event with no votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const event = createEvent(dateOptions);

      const topDates = getTopVotedDates(event);

      expect(topDates).toEqual([]);
    });

    it('should return empty array for event with no date options', () => {
      const event = createEvent([]);

      const topDates = getTopVotedDates(event);

      expect(topDates).toEqual([]);
    });

    it('should return single top-voted date', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1']),
        createVote('Bob', ['date-1']),
      ];
      const event = createEvent(dateOptions, votes);

      const topDates = getTopVotedDates(event);

      expect(topDates).toHaveLength(1);
      expect(topDates[0].dateOption.id).toBe('date-1');
      expect(topDates[0].voteCount).toBe(2);
    });

    it('should return all tied top dates', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
        createDateOption('date-3', '2025-01-24', 'Fri Jan 24'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-3']),
        createVote('Bob', ['date-2', 'date-3']),
      ];
      const event = createEvent(dateOptions, votes);

      const topDates = getTopVotedDates(event);

      // date-3 has 2 votes, date-1 and date-2 each have 1 vote
      expect(topDates).toHaveLength(1);
      expect(topDates[0].voteCount).toBe(2);
      expect(topDates[0].dateOption.id).toBe('date-3');
    });

    it('should return all dates when they all tie for top votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-2']),
        createVote('Bob', ['date-1', 'date-2']),
      ];
      const event = createEvent(dateOptions, votes);

      const topDates = getTopVotedDates(event);

      // Both dates have 2 votes
      expect(topDates).toHaveLength(2);
      expect(topDates[0].voteCount).toBe(2);
      expect(topDates[1].voteCount).toBe(2);
      const ids = topDates.map((t) => t.dateOption.id);
      expect(ids).toContain('date-1');
      expect(ids).toContain('date-2');
    });
  });

  describe('hasVoterVoted', () => {
    it('should return false when voter has not voted', () => {
      const event = createEvent([]);

      expect(hasVoterVoted(event, 'Alice')).toBe(false);
    });

    it('should return true when voter has voted', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      expect(hasVoterVoted(event, 'Alice')).toBe(true);
    });

    it('should be case-insensitive', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      expect(hasVoterVoted(event, 'alice')).toBe(true);
      expect(hasVoterVoted(event, 'ALICE')).toBe(true);
      expect(hasVoterVoted(event, 'AlIcE')).toBe(true);
    });

    it('should return false for different voter', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      expect(hasVoterVoted(event, 'Bob')).toBe(false);
    });
  });

  describe('getVoterVote', () => {
    it('should return undefined when voter has not voted', () => {
      const event = createEvent([]);

      expect(getVoterVote(event, 'Alice')).toBeUndefined();
    });

    it('should return vote data for voter', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-2']),
        createVote('Bob', ['date-1']),
      ];
      const event = createEvent(dateOptions, votes);

      const aliceVote = getVoterVote(event, 'Alice');

      expect(aliceVote).toBeDefined();
      expect(aliceVote?.voterName).toBe('Alice');
      expect(aliceVote?.selectedDates).toEqual(['date-1', 'date-2']);
    });

    it('should be case-insensitive', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      expect(getVoterVote(event, 'alice')).toBeDefined();
      expect(getVoterVote(event, 'ALICE')).toBeDefined();
    });
  });

  describe('getTotalVoters', () => {
    it('should return 0 for event with no votes', () => {
      const event = createEvent([]);

      expect(getTotalVoters(event)).toBe(0);
    });

    it('should return correct count for single voter', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [createVote('Alice', ['date-1'])];
      const event = createEvent(dateOptions, votes);

      expect(getTotalVoters(event)).toBe(1);
    });

    it('should return correct count for multiple voters', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
      ];
      const votes = [
        createVote('Alice', ['date-1']),
        createVote('Bob', ['date-1']),
        createVote('Charlie', ['date-1']),
      ];
      const event = createEvent(dateOptions, votes);

      expect(getTotalVoters(event)).toBe(3);
    });
  });

  describe('getVoteStatistics', () => {
    it('should return zero statistics for event with no votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
      ];
      const event = createEvent(dateOptions);

      const stats = getVoteStatistics(event);

      expect(stats).toEqual({
        totalVoters: 0,
        totalDates: 2,
        maxVotes: 0,
        minVotes: 0,
        avgVotes: 0,
      });
    });

    it('should calculate statistics for event with votes', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
        createDateOption('date-3', '2025-01-24', 'Fri Jan 24'),
      ];
      const votes = [
        createVote('Alice', ['date-1', 'date-2']),
        createVote('Bob', ['date-1', 'date-2', 'date-3']),
        createVote('Charlie', ['date-1']),
      ];
      const event = createEvent(dateOptions, votes);

      const stats = getVoteStatistics(event);

      expect(stats.totalVoters).toBe(3);
      expect(stats.totalDates).toBe(3);
      expect(stats.maxVotes).toBe(3); // date-1
      expect(stats.minVotes).toBe(1); // date-3
      expect(stats.avgVotes).toBe(2); // (3 + 2 + 1) / 3 = 2
    });

    it('should round average votes to 1 decimal place', () => {
      const dateOptions = [
        createDateOption('date-1', '2025-01-10', 'Fri Jan 10'),
        createDateOption('date-2', '2025-01-17', 'Fri Jan 17'),
        createDateOption('date-3', '2025-01-24', 'Fri Jan 24'),
      ];
      const votes = [
        createVote('Alice', ['date-1']),
        createVote('Bob', ['date-1', 'date-2']),
      ];
      const event = createEvent(dateOptions, votes);

      const stats = getVoteStatistics(event);

      // (2 + 1 + 0) / 3 = 1.0
      expect(stats.avgVotes).toBe(1);
    });

    it('should handle event with no date options', () => {
      const event = createEvent([]);

      const stats = getVoteStatistics(event);

      expect(stats).toEqual({
        totalVoters: 0,
        totalDates: 0,
        maxVotes: 0,
        minVotes: 0,
        avgVotes: 0,
      });
    });
  });
});
