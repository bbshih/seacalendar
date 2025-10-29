/**
 * Test Setup
 * Configures the test environment for API tests
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/seacalendar_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-characters-long-for-security';
process.env.JWT_EXPIRES_IN = '15m';
process.env.REFRESH_TOKEN_EXPIRES_IN = '7d';
process.env.DISCORD_CLIENT_ID = 'test-discord-client-id';
process.env.DISCORD_CLIENT_SECRET = 'test-discord-client-secret';
process.env.DISCORD_REDIRECT_URI = 'http://localhost:3001/api/auth/discord/callback';
process.env.WEB_APP_URL = 'http://localhost:5173';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '100';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock Winston logger to prevent console pollution
vi.mock('../middleware/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));
