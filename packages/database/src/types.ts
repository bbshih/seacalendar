/**
 * Prisma enum types
 * Manual exports as workaround for environments where Prisma client generation is blocked
 */

export enum PollType {
  EVENT = 'EVENT',
  GENERIC = 'GENERIC',
}

export enum PollStatus {
  DRAFT = 'DRAFT',
  VOTING = 'VOTING',
  FINALIZED = 'FINALIZED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PollOptionType {
  DATE = 'DATE',
  TEXT = 'TEXT',
}

// Stub model types (actual types come from @prisma/client when properly generated)
export type Poll = any;
export type User = any;
export type PollOption = any;
export type QotwQuestion = any;
export type QotwConfig = any;
export type QotwHistory = any;
