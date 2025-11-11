/**
 * User Service
 * Business logic for user operations
 */

import { db } from '../db';
import { ErrorFactory } from '../errors';

export interface UpdateUserData {
  email?: string;
  phone?: string;
}

export interface UpdatePreferencesData {
  notifyViaDiscordDM?: boolean;
  notifyViaEmail?: boolean;
  notifyViaSMS?: boolean;
  wantVoteReminders?: boolean;
  wantEventReminders?: boolean;
  showInStats?: boolean;
}

/**
 * Get user by ID
 */
export async function getUser(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: {
      preferences: true,
    },
  });

  if (!user) {
    throw ErrorFactory.notFound('User not found');
  }

  return user;
}

/**
 * Update user profile
 */
export async function updateUser(userId: string, data: UpdateUserData) {
  // Validate email uniqueness if provided
  if (data.email) {
    const existingUser = await db.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser && existingUser.id !== userId) {
      throw ErrorFactory.conflict('Email is already in use');
    }
  }

  // Validate phone uniqueness if provided
  if (data.phone) {
    const existingUser = await db.user.findUnique({
      where: { phone: data.phone },
    });

    if (existingUser && existingUser.id !== userId) {
      throw ErrorFactory.conflict('Phone number is already in use');
    }
  }

  const user = await db.user.update({
    where: { id: userId },
    data,
    include: {
      preferences: true,
    },
  });

  console.log('User updated:', { userId });

  return user;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(userId: string, data: UpdatePreferencesData) {
  // Create or update preferences
  const preferences = await db.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });

  console.log('User preferences updated:', { userId });

  return preferences;
}

/**
 * Get user's polls
 */
export async function getUserPolls(userId: string) {
  const polls = await db.poll.findMany({
    where: { creatorId: userId },
    include: {
      options: true,
      votes: true,
      invites: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return polls;
}

/**
 * Get user statistics
 */
export async function getUserStats(userId: string) {
  // Total polls created
  const totalPollsCreated = await db.poll.count({
    where: { creatorId: userId },
  });

  // Total votes cast
  const totalVotes = await db.vote.count({
    where: { voterId: userId },
  });

  // Total poll invites
  const totalInvites = await db.pollInvite.count({
    where: { userId },
  });

  // Polls by status
  const pollsByStatus = await db.poll.groupBy({
    by: ['status'],
    where: { creatorId: userId },
    _count: true,
  });

  // Participation rate
  const votedInvites = await db.pollInvite.count({
    where: { userId, hasVoted: true },
  });

  const participationRate =
    totalInvites > 0 ? ((votedInvites / totalInvites) * 100).toFixed(1) : '0';

  return {
    totalPollsCreated,
    totalVotes,
    totalInvites,
    votedInvites,
    participationRate: parseFloat(participationRate),
    pollsByStatus: pollsByStatus.reduce(
      (acc, { status, _count }) => {
        acc[status] = _count;
        return acc;
      },
      {} as Record<string, number>
    ),
  };
}

/**
 * Delete user account
 */
export async function deleteUser(userId: string) {
  // Note: This is a hard delete. In production, you might want soft delete.
  // Cascading deletes are handled by Prisma schema (onDelete: Cascade)

  await db.user.delete({
    where: { id: userId },
  });

  console.log('User deleted:', { userId });
}
