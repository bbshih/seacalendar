/**
 * Utilities for storing voter information in localStorage
 * This allows voters to edit their votes later
 */

export interface VoterInfo {
  voterName: string;
  selectedDates: string[];
  votedAt: string;
}

/**
 * Get storage key for a specific event
 */
function getVoteKey(gistId: string): string {
  return `seacalendar_vote_${gistId}`;
}

/**
 * Save voter's vote for an event
 */
export function saveVoterInfo(gistId: string, info: VoterInfo): void {
  try {
    localStorage.setItem(getVoteKey(gistId), JSON.stringify(info));
  } catch (error) {
    console.error('Error saving voter info:', error);
  }
}

/**
 * Get voter's saved vote for an event
 */
export function getVoterInfo(gistId: string): VoterInfo | null {
  try {
    const data = localStorage.getItem(getVoteKey(gistId));
    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading voter info:', error);
    return null;
  }
}

/**
 * Clear voter's saved vote for an event
 */
export function clearVoterInfo(gistId: string): void {
  try {
    localStorage.removeItem(getVoteKey(gistId));
  } catch (error) {
    console.error('Error clearing voter info:', error);
  }
}
