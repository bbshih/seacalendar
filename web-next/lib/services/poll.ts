/**
 * Poll Service
 * Business logic for poll operations
 */

import { db } from '../db';
import { ErrorFactory } from '../errors';

// Type aliases (Prisma client not fully generated)
type PollType = 'EVENT' | 'GENERIC' | 'QOTW';
type PollStatus = 'DRAFT' | 'VOTING' | 'FINALIZED' | 'CANCELLED' | 'EXPIRED';
type PollOptionType = 'DATE' | 'TEXT';

export interface CreatePollData {
  title: string;
  description?: string;
  type?: PollType;
  votingDeadline?: Date;
  guildId?: string;
  channelId?: string;
  options: {
    optionType?: 'DATE' | 'TEXT';
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
export async function createPoll(userId: string, data: CreatePollData) {
  try {
    // Validate options
    if (!data.options || data.options.length === 0) {
      throw ErrorFactory.badRequest('At least one poll option is required');
    }

    if (data.options.length > 30) {
      throw ErrorFactory.badRequest('Maximum 30 poll options allowed');
    }

    // Create poll with options
    const poll = await db.poll.create({
      data: {
        title: data.title,
        description: data.description,
        type: data.type || 'EVENT',
        votingDeadline: data.votingDeadline,
        guildId: data.guildId,
        channelId: data.channelId,
        creatorId: userId,
        status: 'VOTING',
        options: {
          create: data.options.map((option, index) => ({
            optionType: option.optionType === 'TEXT' ? 'TEXT' : 'DATE',
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

    console.log('Poll created:', { pollId: poll.id, creatorId: userId });

    return poll;
  } catch (error) {
    console.error('Failed to create poll:', { error, userId });
    throw error;
  }
}

/**
 * Get poll by ID with all related data
 */
export async function getPoll(pollId: string, userId?: string) {
  const poll = await db.poll.findUnique({
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
  const isCreator = userId === poll.creatorId;
  const isInvited = userId && poll.invites.some((invite: any) => invite.userId === userId);

  if (!isCreator && !isInvited && poll.guildId) {
    // If it's a guild poll, allow viewing (Discord bot handles permissions)
  }

  return poll;
}

/**
 * Update poll
 */
export async function updatePoll(pollId: string, userId: string, data: UpdatePollData) {
  // Verify ownership
  const poll = await db.poll.findUnique({
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
  if (poll.status === 'FINALIZED' || poll.status === 'CANCELLED') {
    throw ErrorFactory.badRequest('Cannot update finalized or cancelled polls');
  }

  // Update poll
  const updatedPoll = await db.poll.update({
    where: { id: pollId },
    data,
    include: {
      options: true,
      votes: true,
      invites: true,
    },
  });

  console.log('Poll updated:', { pollId, userId });

  return updatedPoll;
}

/**
 * Cancel poll (soft delete)
 */
export async function cancelPoll(pollId: string, userId: string) {
  // Verify ownership
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { creatorId: true, status: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can cancel the poll');
  }

  if (poll.status === 'FINALIZED') {
    throw ErrorFactory.badRequest('Cannot cancel finalized polls');
  }

  // Cancel poll
  const cancelledPoll = await db.poll.update({
    where: { id: pollId },
    data: {
      status: 'CANCELLED',
      closedAt: new Date(),
    },
  });

  console.log('Poll cancelled:', { pollId, userId });

  return cancelledPoll;
}

/**
 * Finalize poll (set winning option)
 */
export async function finalizePoll(pollId: string, userId: string, optionId: string) {
  // Verify ownership
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    include: { options: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can finalize the poll');
  }

  if (poll.status === 'FINALIZED') {
    throw ErrorFactory.badRequest('Poll is already finalized');
  }

  // Verify option belongs to this poll
  const option = poll.options.find((opt: any) => opt.id === optionId);
  if (!option) {
    throw ErrorFactory.badRequest('Invalid option ID');
  }

  // Finalize poll
  const finalizedPoll = await db.poll.update({
    where: { id: pollId },
    data: {
      status: 'FINALIZED',
      finalizedOptionId: optionId,
      closedAt: new Date(),
    },
    include: {
      options: true,
      votes: true,
    },
  });

  console.log('Poll finalized:', { pollId, userId, optionId });

  return finalizedPoll;
}

/**
 * Reopen a closed poll for more voting
 */
export async function reopenPoll(pollId: string, userId: string, extensionDays: number = 7) {
  // Verify ownership
  const poll = await db.poll.findUnique({
    where: { id: pollId },
    select: { creatorId: true, status: true },
  });

  if (!poll) {
    throw ErrorFactory.notFound('Poll not found');
  }

  if (poll.creatorId !== userId) {
    throw ErrorFactory.forbidden('Only poll creator can reopen the poll');
  }

  if (poll.status === 'VOTING') {
    throw ErrorFactory.badRequest('Poll is already open for voting');
  }

  // Calculate new deadline
  const newDeadline = new Date(Date.now() + extensionDays * 24 * 60 * 60 * 1000);

  // Reopen poll
  const reopenedPoll = await db.poll.update({
    where: { id: pollId },
    data: {
      status: 'VOTING',
      votingDeadline: newDeadline,
      closedAt: null,
      finalizedOptionId: null,
    },
    include: {
      options: true,
      votes: true,
      creator: true,
    },
  });

  console.log('Poll reopened:', { pollId, userId, extensionDays });

  return reopenedPoll;
}

/**
 * Get user's created polls
 */
export async function getUserPolls(userId: string, status?: PollStatus) {
  const polls = await db.poll.findMany({
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
}

/**
 * Get polls user is invited to
 */
export async function getInvitedPolls(userId: string) {
  const invites = await db.pollInvite.findMany({
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

  return invites.map((invite: any) => invite.poll);
}
