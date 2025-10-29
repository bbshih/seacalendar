/**
 * Poll Service
 * Business logic for poll operations
 */

import { prisma, PollType, PollStatus } from '@seacalendar/database';
import { ErrorFactory } from '../middleware/errorHandler';
import { logger } from '../middleware/logger';

export interface CreatePollData {
  title: string;
  description?: string;
  type?: PollType;
  votingDeadline?: Date;
  guildId?: string;
  channelId?: string;
  options: {
    label: string;
    description?: string;
    date?: Date;
    timeStart?: string;
    timeEnd?: string;
  }[];
  invitedUserIds?: string[];
}

export interface UpdatePollData {
  title?: string;
  description?: string;
  votingDeadline?: Date;
  status?: PollStatus;
}

/**
 * Create a new poll
 */
export const createPoll = async (userId: string, data: CreatePollData) => {
  try {
    // Validate options
    if (!data.options || data.options.length === 0) {
      throw ErrorFactory.badRequest('At least one poll option is required');
    }

    if (data.options.length > 30) {
      throw ErrorFactory.badRequest('Maximum 30 poll options allowed');
    }

    // Create poll with options
    const poll = await prisma.poll.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || PollType.EVENT,
        votingDeadline: data.votingDeadline,
        guildId: data.guildId,
        channelId: data.channelId,
        creatorId: userId,
        status: PollStatus.VOTING,
        options: {
          create: data.options.map((option, index) => ({
            label: option.label,
            description: option.description,
            date: option.date,
            timeStart: option.timeStart,
            timeEnd: option.timeEnd,
            order: index,
          })),
        },
        invites: data.invitedUserIds
          ? {
              create: data.invitedUserIds.map((userId) => ({
                userId,
              })),
            }
          : undefined,
      },
      include: {
        options: true,
        invites: {
          include: {
            user: true,
          },
        },
        creator: true,
      },
    });

    logger.info('Poll created', { pollId: poll.id, creatorId: userId });

    return poll;
  } catch (error) {
    logger.error('Failed to create poll', { error, userId });
    throw error;
  }
};

/**
 * Get poll by ID with all related data
 */
export const getPoll = async (pollId: string, userId?: string) => {
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: {
      options: {
        orderBy: { order: 'asc' },
      },
      votes: {
        include: {
          voter: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatar: true,
            },
          },
        },
      },
      invites: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatar: true,
            },
          },
        },
      },
      creator: {
        select: {
          id: true,
          username: true,
          discriminator: true,
          avatar: true,
        },
      },
      venue: true,
    },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  // Check if user has access to view this poll
  // Public polls can be viewed by anyone, private polls only by invited users
  const isCreator = userId === poll.creatorId;
  const isInvited = userId && poll.invites.some((invite) => invite.userId === userId);

  if (!isCreator && !isInvited && poll.guildId) {
    // If it's a guild poll, we'll allow viewing (Discord bot will handle permissions)
    // For now, allow all authenticated users to view
  }

  return poll;
};

/**
 * Update poll
 */
export const updatePoll = async (pollId: string, userId: string, data: UpdatePollData) => {
  // Verify ownership
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { creatorId: true, status: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can update the poll');
  }

  // Don't allow updates to finalized or cancelled polls
  if (poll.status === PollStatus.FINALIZED || poll.status === PollStatus.CANCELLED) {
    throw ErrorFactory.badRequest('Cannot update finalized or cancelled polls');
  }

  // Update poll
  const updatedPoll = await prisma.poll.update({
    where: { id: pollId },
    data,
    include: {
      options: true,
      votes: true,
      invites: true,
    },
  });

  logger.info('Poll updated', { pollId, userId });

  return updatedPoll;
};

/**
 * Cancel poll (soft delete)
 */
export const cancelPoll = async (pollId: string, userId: string) => {
  // Verify ownership
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    select: { creatorId: true, status: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can cancel the poll');
  }

  if (poll.status === PollStatus.FINALIZED) {
    throw ErrorFactory.badRequest('Cannot cancel finalized polls');
  }

  // Cancel poll
  const cancelledPoll = await prisma.poll.update({
    where: { id: pollId },
    data: {
      status: PollStatus.CANCELLED,
      closedAt: new Date(),
    },
  });

  logger.info('Poll cancelled', { pollId, userId });

  return cancelledPoll;
};

/**
 * Finalize poll (set winning option)
 */
export const finalizePoll = async (pollId: string, userId: string, optionId: string) => {
  // Verify ownership
  const poll = await prisma.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can finalize the poll');
  }

  if (poll.status === PollStatus.FINALIZED) {
    throw ErrorFactory.badRequest('Poll is already finalized');
  }

  // Verify option belongs to this poll
  const option = poll.options.find((opt) => opt.id === optionId);
  if (!option) {
    throw ErrorFactory.badRequest('Invalid option ID');
  }

  // Finalize poll
  const finalizedPoll = await prisma.poll.update({
    where: { id: pollId },
    data: {
      status: PollStatus.FINALIZED,
      finalizedOptionId: optionId,
      closedAt: new Date(),
    },
    include: {
      options: true,
      votes: true,
    },
  });

  logger.info('Poll finalized', { pollId, userId, optionId });

  return finalizedPoll;
};

/**
 * Get user's polls
 */
export const getUserPolls = async (userId: string, status?: PollStatus) => {
  const polls = await prisma.poll.findMany({
    where: {
      creatorId: userId,
      ...(status && { status }),
    },
    include: {
      options: true,
      votes: true,
      invites: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return polls;
};

/**
 * Get polls user is invited to
 */
export const getInvitedPolls = async (userId: string) => {
  const invites = await prisma.pollInvite.findMany({
    where: {
      userId,
    },
    include: {
      poll: {
        include: {
          options: true,
          votes: true,
          creator: {
            select: {
              id: true,
              username: true,
              discriminator: true,
              avatar: true,
            },
          },
        },
      },
    },
    orderBy: {
      invitedAt: 'desc',
    },
  });

  return invites.map((invite) => invite.poll);
};
