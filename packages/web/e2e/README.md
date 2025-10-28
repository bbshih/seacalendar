# SeaCalendar E2E Tests

End-to-end tests for SeaCalendar using Playwright.

## Running Tests

### First Time Setup

Install Playwright browsers:

```bash
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode

```bash
npm run test:e2e:ui
```

### Run Specific Test File

```bash
npx playwright test e2e/landing-page.spec.ts
```

### Run Tests in Headed Mode (See Browser)

```bash
npx playwright test --headed
```

## Test Files

- **complete-flow.spec.ts** - Full end-to-end flow from event creation to calendar download
- **landing-page.spec.ts** - Landing page navigation and responsive design tests
- **error-scenarios.spec.ts** - Error handling and edge case tests

## Test Strategy

### Mocking GitHub API

The tests use Playwright's route interception to mock GitHub Gist API calls:

```typescript
await page.route('https://api.github.com/gists', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(mockData),
  });
});
```

This allows us to test the complete user flow without requiring actual GitHub API access during tests.

### Complete Flow Test

The main test (`complete-flow.spec.ts`) covers:

1. ✅ Event creation with date selection
2. ✅ Voting by multiple users
3. ✅ Results viewing with vote tallies
4. ✅ Date selection by organizer
5. ✅ Venue details entry
6. ✅ Event finalization
7. ✅ Event summary display
8. ✅ Calendar download availability
9. ✅ Share options (email, copy link)

### Error Scenarios

The error tests (`error-scenarios.spec.ts`) cover:

- ✅ Missing organizer key
- ✅ Event not found (404)
- ✅ Empty events (no dates)
- ✅ Voting without name
- ✅ No votes in results
- ✅ Venue form validation
- ✅ Non-finalized event access

## Debugging Tests

### View Test Report

After running tests, view the HTML report:

```bash
npx playwright show-report
```

### Debug Specific Test

```bash
npx playwright test --debug e2e/complete-flow.spec.ts
```

### Take Screenshots on Failure

Tests are configured to take screenshots on failure by default. Find them in `test-results/` directory.

## CI/CD Integration

The tests are configured to run in CI mode with:
- Retries: 2
- Workers: 1
- Reporter: HTML

See `playwright.config.ts` for full configuration.
