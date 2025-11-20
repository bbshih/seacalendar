/**
 * Database test helpers for E2E testing
 * Provides utilities for setup, teardown, and data management
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

// Create a singleton test Prisma client
let testPrisma: PrismaClient | null = null;

/**
 * Get or create test database client
 */
export function getTestPrisma(): PrismaClient {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5433/seacalendar_test',
        },
      },
    });
  }
  return testPrisma;
}

/**
 * Reset test database to clean state
 * Deletes all data in reverse order to respect foreign keys
 */
export async function resetTestDatabase() {
  const prisma = getTestPrisma();

  // Delete in order respecting foreign key constraints
  await prisma.vote.deleteMany();
  await prisma.pollOption.deleteMany();
  await prisma.poll.deleteMany();
  await prisma.venue.deleteMany();
  await prisma.pollTemplate.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.calendar.deleteMany();
  await prisma.authProvider.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * Seed test database with basic data
 */
export async function seedTestDatabase() {
  const prisma = getTestPrisma();

  // Create test users
  const user1 = await prisma.user.create({
    data: {
      discordId: 'test-discord-1',
      username: 'testuser1',
      discriminator: '0001',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      discordId: 'test-discord-2',
      username: 'testuser2',
      discriminator: '0002',
    },
  });

  return { user1, user2 };
}

/**
 * Run database migrations on test database
 */
export function runTestMigrations() {
  try {
    execSync('npm run migrate:deploy -w @seacalendar/database', {
      env: {
        ...process.env,
        DATABASE_URL: 'postgresql://test:test@localhost:5433/seacalendar_test',
      },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run test migrations:', error);
    throw error;
  }
}

/**
 * Setup test database - run migrations and seed
 */
export async function setupTestDatabase() {
  console.log('🔧 Setting up test database...');
  runTestMigrations();
  await resetTestDatabase();
  const seeded = await seedTestDatabase();
  console.log('✅ Test database ready');
  return seeded;
}

/**
 * Teardown test database connection
 */
export async function teardownTestDatabase() {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

/**
 * Create a test transaction context
 * Useful for parallel test isolation
 */
export async function withTestTransaction<T>(
  callback: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = getTestPrisma();

  // Use interactive transaction for test isolation
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient);
  });
}

/**
 * Clean up specific tables (useful for test-specific cleanup)
 */
export async function cleanupTables(tables: string[]) {
  const prisma = getTestPrisma();

  for (const table of tables.reverse()) {
    // @ts-ignore - dynamic table access
    if (prisma[table]) {
      // @ts-ignore
      await prisma[table].deleteMany();
    }
  }
}
