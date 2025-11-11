/**
 * Shared Types
 * Re-export Prisma types and add custom types
 */

export * from '@prisma/client';

// JWT Payload
export interface JWTPayload {
  userId: string;
  discordId: string | null;
  email?: string;
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Vote submission
export interface VoteSubmission {
  availableOptionIds: string[];
  maybeOptionIds?: string[];
  notes?: string;
}

// User context (for auth middleware)
export interface UserContext {
  id: string;
  username: string;
  discordId: string | null;
  email: string | null;
}
