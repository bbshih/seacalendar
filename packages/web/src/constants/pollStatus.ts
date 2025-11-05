/**
 * Poll status constants
 * Matches the PollStatus type from @seacalendar/shared
 */

export const POLL_STATUS = {
  DRAFT: 'DRAFT',
  VOTING: 'VOTING',
  FINALIZED: 'FINALIZED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type PollStatus = typeof POLL_STATUS[keyof typeof POLL_STATUS];

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Draft',
    VOTING: 'Voting',
    FINALIZED: 'Finalized',
    CANCELLED: 'Cancelled',
    EXPIRED: 'Expired',
  };
  return labels[status] || status;
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    VOTING: 'bg-ocean-100 text-ocean-700',
    FINALIZED: 'bg-seaweed-100 text-seaweed-700',
    CANCELLED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}
