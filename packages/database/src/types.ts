/**
 * Prisma enum types
 * Manual exports as workaround for environments where Prisma client generation is blocked
 *
 * NOTE: Only export enums here, not model types, to avoid conflicts with @prisma/client
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
