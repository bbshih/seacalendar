/**
 * Test data fixtures and factories
 * Provides reusable test data creation functions
 */

import { PrismaClient, PollType, PollStatus } from '@prisma/client';
import { getTestPrisma } from './testHelpers';

/**
 * Create a test user
 */
export async function createTestUser(
  prisma: PrismaClient = getTestPrisma(),
  overrides: Partial<{
    discordId: string;
    username: string;
    discriminator: string;
    email: string;
    avatar: string;
  }> = {}
) {
  const timestamp = Date.now();
  return await prisma.user.create({
    data: {
      discordId: overrides.discordId || `test-discord-${timestamp}`,
      username: overrides.username || `testuser${timestamp}`,
      discriminator: overrides.discriminator || '0001',
      email: overrides.email,
      avatar: overrides.avatar,
    },
  });
}

/**
 * Create a test poll with options
 */
export async function createTestPoll(
  prisma: PrismaClient = getTestPrisma(),
  overrides: Partial<{
    title: string;
    description: string;
    creatorId: string;
    guildId: string;
    channelId: string;
    type: PollType;
    status: PollStatus;
    optionsCount: number;
  }> = {}
) {
  const timestamp = Date.now();
  const optionsCount = overrides.optionsCount || 3;

  // Create creator if not provided
  let creatorId = overrides.creatorId;
  if (!creatorId) {
    const creator = await createTestUser(prisma);
    creatorId = creator.id;
  }

  // Create poll with options
  const poll = await prisma.poll.create({
    data: {
      title: overrides.title || `Test Event ${timestamp}`,
      description: overrides.description || 'Test event description',
      type: overrides.type || PollType.EVENT,
      status: overrides.status || PollStatus.VOTING,
      creatorId,
      guildId: overrides.guildId || `guild-${timestamp}`,
      channelId: overrides.channelId || `channel-${timestamp}`,
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      options: {
        create: Array.from({ length: optionsCount }, (_, i) => ({
          label: `Option ${i + 1}`,
          description: `Test option ${i + 1}`,
          date: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000),
          timeStart: '18:00',
          timeEnd: '21:00',
          order: i,
        })),
      },
    },
    include: {
      options: true,
      creator: true,
    },
  });

  return poll;
}

/**
 * Create a test vote
 */
export async function createTestVote(
  prisma: PrismaClient = getTestPrisma(),
  overrides: {
    voterId: string;
    pollId: string;
    availableOptionIds?: string[];
    maybeOptionIds?: string[];
  }
) {
  return await prisma.vote.create({
    data: {
      voterId: overrides.voterId,
      pollId: overrides.pollId,
      availableOptionIds: overrides.availableOptionIds || [],
      maybeOptionIds: overrides.maybeOptionIds || [],
    },
  });
}

/**
 * Create a test venue
 */
export async function createTestVenue(
  prisma: PrismaClient = getTestPrisma(),
  overrides: Partial<{
    name: string;
    address: string;
    guildId: string;
    addedById: string;
  }> = {}
) {
  const timestamp = Date.now();
  return await prisma.venue.create({
    data: {
      name: overrides.name || `Test Venue ${timestamp}`,
      address: overrides.address || `123 Test St, Test City`,
      guildId: overrides.guildId || `guild-${timestamp}`,
      addedById: overrides.addedById || `user-${timestamp}`,
    },
  });
}

/**
 * Create a complete poll scenario with votes
 */
export async function createPollScenario(
  prisma: PrismaClient = getTestPrisma(),
  scenario: {
    voterCount?: number;
    optionsCount?: number;
    withVotes?: boolean;
  } = {}
) {
  const voterCount = scenario.voterCount || 3;
  const optionsCount = scenario.optionsCount || 3;

  // Create voters
  const voters = await Promise.all(
    Array.from({ length: voterCount }, (_, i) =>
      createTestUser(prisma, {
        username: `voter${i + 1}`,
        discordId: `voter-discord-${i + 1}`,
      })
    )
  );

  // Create poll
  const poll = await createTestPoll(prisma, { optionsCount });

  // Create votes if requested
  if (scenario.withVotes) {
    const votes = [];
    for (const voter of voters) {
      // Each voter votes for 1-2 random options
      const votesPerVoter = Math.floor(Math.random() * 2) + 1;
      const optionsToVote = poll.options
        .sort(() => Math.random() - 0.5)
        .slice(0, votesPerVoter);

      for (const option of optionsToVote) {
        const vote = await createTestVote(prisma, {
          userId: voter.id,
          optionId: option.id,
          availability: Math.random() > 0.3 ? 'AVAILABLE' : 'MAYBE',
        });
        votes.push(vote);
      }
    }

    return { poll, voters, votes };
  }

  return { poll, voters };
}

/**
 * Create test auth provider
 */
export async function createTestAuthProvider(
  prisma: PrismaClient = getTestPrisma(),
  overrides: {
    userId: string;
    provider: string;
    providerId: string;
    accessToken?: string;
  }
) {
  return await prisma.authProvider.create({
    data: {
      userId: overrides.userId,
      provider: overrides.provider as any, // Cast to AuthProviderType enum
      providerId: overrides.providerId,
      accessToken: overrides.accessToken,
    },
  });
}
