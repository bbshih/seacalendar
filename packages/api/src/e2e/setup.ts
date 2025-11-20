/**
 * E2E Test Setup
 * Global setup for API E2E tests
 */

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, resetTestDatabase } from '@seacalendar/database';
import dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Setup before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Clean up after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Reset database before each test
beforeEach(async () => {
  await resetTestDatabase();
});
