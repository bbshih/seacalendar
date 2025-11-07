/**
 * @seacalendar/database
 * Prisma client and database utilities
 */

export * from '@prisma/client';

// Re-export for convenience
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export default prisma;

// Export types (workaround for environments where Prisma generation is blocked)
export * from './types';
