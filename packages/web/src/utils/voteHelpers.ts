import type { Event, VoteTally } from '../types';

/**
 * Calculates vote tallies for all date options in an event.
 * Returns an array of tallies sorted by vote count (descending).
 */
export function calculateVoteTallies(event: Event): VoteTally[] {
  const tallies: Map<string, VoteTally> = new Map();

  // Initialize tallies for all date options
  event.dateOptions.forEach((dateOption) => {
    tallies.set(dateOption.id, {
      dateOption,
      voteCount: 0,
      voters: [],
    });
  });

  // Count votes for each date option
  event.votes.forEach((vote) => {
    vote.selectedDates.forEach((dateId) => {
      const tally = tallies.get(dateId);
      if (tally) {
        tally.voteCount++;
        tally.voters.push(vote.voterName);
      }
    });
  });

  // Sort by vote count (descending), then by date (ascending) for ties
  return Array.from(tallies.values()).sort((a, b) => {
    if (b.voteCount !== a.voteCount) {
      return b.voteCount - a.voteCount;
    }
    // For ties, sort by date
    return a.dateOption.date.localeCompare(b.dateOption.date);
  });
}

/**
 * Gets the list of attendees (voter names) for a specific date.
 */
export function getAttendeesForDate(event: Event, dateId: string): string[] {
  return event.votes
    .filter((vote) => vote.selectedDates.includes(dateId))
    .map((vote) => vote.voterName);
}

/**
 * Gets the top-voted date option(s).
 * Returns an array in case of ties.
 * Only returns dates with at least one vote.
 */
export function getTopVotedDates(event: Event): VoteTally[] {
  const tallies = calculateVoteTallies(event);

  if (tallies.length === 0) {
    return [];
  }

  const topVoteCount = tallies[0].voteCount;

  // Only return dates with at least one vote
  if (topVoteCount === 0) {
    return [];
  }

  return tallies.filter((tally) => tally.voteCount === topVoteCount);
}

/**
 * Checks if a specific voter has already voted in the event.
 */
export function hasVoterVoted(event: Event, voterName: string): boolean {
  return event.votes.some(
    (vote) => vote.voterName.toLowerCase() === voterName.toLowerCase()
  );
}

/**
 * Gets a specific voter's vote data.
 */
export function getVoterVote(event: Event, voterName: string) {
  return event.votes.find(
    (vote) => vote.voterName.toLowerCase() === voterName.toLowerCase()
  );
}

/**
 * Gets the total number of unique voters.
 */
export function getTotalVoters(event: Event): number {
  return event.votes.length;
}

/**
 * Gets vote statistics for the event.
 */
export function getVoteStatistics(event: Event) {
  const tallies = calculateVoteTallies(event);
  const totalVoters = getTotalVoters(event);
  const totalDates = event.dateOptions.length;

  const votesPerDate = tallies.map((t) => t.voteCount);
  const maxVotes = votesPerDate.length > 0 ? Math.max(...votesPerDate) : 0;
  const minVotes = votesPerDate.length > 0 ? Math.min(...votesPerDate) : 0;
  const avgVotes = votesPerDate.length > 0
    ? votesPerDate.reduce((sum, count) => sum + count, 0) / votesPerDate.length
    : 0;

  return {
    totalVoters,
    totalDates,
    maxVotes,
    minVotes,
    avgVotes: Math.round(avgVotes * 10) / 10, // Round to 1 decimal place
  };
}
