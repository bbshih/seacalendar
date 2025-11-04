/**
 * Test Data Factory
 * Provides mock data for testing
 */

import type {
  User,
  Poll,
  PollOption,
  Vote,
  PollType,
  PollStatus,
  AuthProvider,
  AuthProviderType,
  CalendarConnection,
  CalendarProvider,
  SyncStatus,
  CalendarEvent,
} from '@seacalendar/database';

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

/**
 * Create mock AuthProvider
 */
export const createMockAuthProvider = (overrides?: Partial<AuthProvider>): AuthProvider => ({
  id: 'auth-123',
  userId: 'user-123',
  provider: 'DISCORD' as AuthProviderType,
  providerId: '123456789012345678',
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  scope: 'identify email',
  providerData: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create mock Google OAuth response
 */
export const createMockGoogleOAuthResponse = () => ({
  access_token: 'mock-google-access-token',
  refresh_token: 'mock-google-refresh-token',
  expires_in: 3600,
  scope: 'openid email profile',
  token_type: 'Bearer',
});

/**
 * Create mock Google user response
 */
export const createMockGoogleUser = () => ({
  id: 'google-user-123',
  email: 'test@gmail.com',
  verified_email: true,
  name: 'Test User',
  given_name: 'Test',
  family_name: 'User',
  picture: 'https://example.com/picture.jpg',
  locale: 'en',
});

/**
 * Create mock CalendarConnection
 */
export const createMockCalendarConnection = (
  overrides?: Partial<CalendarConnection>
): CalendarConnection => ({
  id: 'cal-123',
  userId: 'user-123',
  provider: 'GOOGLE' as CalendarProvider,
  providerAccountId: 'google-cal-123',
  accessToken: 'mock-calendar-access-token',
  refreshToken: 'mock-calendar-refresh-token',
  expiresAt: new Date(Date.now() + 3600 * 1000),
  syncEnabled: true,
  showBusyTimes: true,
  showEventTitles: false,
  lastSyncAt: new Date('2024-01-01'),
  syncStatus: 'SUCCESS' as SyncStatus,
  syncError: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

/**
 * Create mock CalendarEvent
 */
export const createMockCalendarEvent = (overrides?: Partial<CalendarEvent>): CalendarEvent => ({
  id: 'event-123',
  connectionId: 'cal-123',
  providerEventId: 'google-event-123',
  title: 'Test Meeting',
  description: 'A test calendar event',
  location: 'Conference Room A',
  startTime: new Date('2024-06-15T14:00:00Z'),
  endTime: new Date('2024-06-15T15:00:00Z'),
  isAllDay: false,
  timezone: 'America/Los_Angeles',
  status: 'confirmed',
  transparency: 'opaque',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});
