/**
 * Test Data Factory
 * Provides mock data for testing
 */

import type { User, Poll, PollOption, Vote, PollType, PollStatus } from '@seacalendar/database';

/**
 * Create a mock user
 */
export const createMockUser = (overrides?: Partial<User>): User => ({
  id: 'user-123',
  discordId: '123456789012345678',
  username: 'testuser',
  discriminator: '1234',
  email: 'test@example.com',
  avatar: 'https://cdn.discordapp.com/avatars/123/abc.png',
  displayName: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  lastSeenAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock poll
 */
export const createMockPoll = (overrides?: Partial<Poll>): Poll => ({
  id: 'poll-123',
  creatorId: 'user-123',
  title: 'Test Poll',
  description: 'Test poll description',
  type: 'DATE' as PollType,
  status: 'ACTIVE' as PollStatus,
  votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
  finalizedAt: null,
  guildId: null,
  channelId: null,
  messageId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock poll option
 */
export const createMockPollOption = (overrides?: Partial<PollOption>): PollOption => ({
  id: 'option-123',
  pollId: 'poll-123',
  label: 'Option 1',
  description: null,
  date: new Date('2024-06-15'),
  timeStart: '18:00',
  timeEnd: '21:00',
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create a mock vote
 */
export const createMockVote = (overrides?: Partial<Vote>): Vote => ({
  id: 'vote-123',
  pollId: 'poll-123',
  userId: 'user-123',
  optionId: 'option-123',
  availability: 'YES',
  comment: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create multiple mock poll options
 */
export const createMockPollOptions = (count: number, pollId: string): PollOption[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `option-${i + 1}`,
    pollId,
    label: `Option ${i + 1}`,
    description: null,
    date: new Date(`2024-06-${15 + i}`),
    timeStart: '18:00',
    timeEnd: '21:00',
    createdAt: new Date('2024-01-01'),
  }));
};

/**
 * Create a complete poll with options
 */
export const createMockPollWithOptions = (optionCount: number = 3) => {
  const poll = createMockPoll();
  const options = createMockPollOptions(optionCount, poll.id);
  return { poll, options };
};

/**
 * Create mock JWT payload
 */
export const createMockJwtPayload = (overrides?: {
  userId?: string;
  discordId?: string;
  email?: string;
}) => ({
  userId: overrides?.userId || 'user-123',
  discordId: overrides?.discordId || '123456789012345678',
  email: overrides?.email || 'test@example.com',
});

/**
 * Create mock refresh token
 */
export const createMockRefreshToken = (userId: string = 'user-123') => ({
  id: 'refresh-123',
  token: 'mock-refresh-token',
  userId,
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  revoked: false,
  createdAt: new Date(),
  user: createMockUser({ id: userId }),
});

/**
 * Create mock Discord OAuth response
 */
export const createMockDiscordOAuthResponse = () => ({
  access_token: 'mock-discord-access-token',
  token_type: 'Bearer',
  expires_in: 604800,
  refresh_token: 'mock-discord-refresh-token',
  scope: 'identify email',
});

/**
 * Create mock Discord user response
 */
export const createMockDiscordUser = () => ({
  id: '123456789012345678',
  username: 'testuser',
  discriminator: '1234',
  avatar: 'abc123',
  email: 'test@example.com',
  verified: true,
});
