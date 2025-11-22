import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'api-e2e',
    include: ['src/e2e/**/*.e2e.test.ts'],
    environment: 'node',
    setupFiles: ['src/e2e/setup.ts'],
    testTimeout: 30000, // 30s for E2E tests
    hookTimeout: 30000,
    globals: true,
    // Run tests sequentially for DB consistency
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
