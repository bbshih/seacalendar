/**
 * Mock @seacalendar/database module
 * This mock is used in tests to avoid requiring the actual Prisma client
 */

import { createMockPrisma } from '../../mockPrisma';

// Export mock Prisma client
export const prisma = createMockPrisma();

// Export Prisma enums
export enum PollType {
  DATE = 'DATE',
  VENUE = 'VENUE',
  GENERIC = 'GENERIC',
  EVENT = 'EVENT',
}

export enum PollStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  VOTING = 'VOTING',
  FINALIZED = 'FINALIZED',
  CANCELLED = 'CANCELLED',
}

// Export types that might be used
export type User = any;
export type Poll = any;
export type PollOption = any;
export type Vote = any;
export type PollInvite = any;
export type RefreshToken = any;
export type DiscordToken = any;
export type Venue = any;
export type FinalizedEvent = any;
export type UserPreferences = any;
export type Notification = any;
export type NotificationPreference = any;
export type PrismaClient = any;

export default prisma;
