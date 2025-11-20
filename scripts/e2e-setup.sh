#!/bin/bash
# E2E Test Environment Setup Script
# Starts test database, runs migrations, and seeds data

set -e

echo "🚀 Setting up E2E test environment..."

# Check if test database is already running
if docker ps | grep -q seacalendar-test-db; then
  echo "ℹ️  Test database already running"
else
  echo "📦 Starting test database..."
  docker-compose -f docker-compose.test.yml up -d

  # Wait for database to be healthy
  echo "⏳ Waiting for database to be ready..."
  timeout 30 bash -c 'until docker exec seacalendar-test-db pg_isready -U test -d seacalendar_test > /dev/null 2>&1; do sleep 1; done'
fi

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

echo "🔧 Running migrations on test database..."
cd packages/database && npx prisma migrate deploy && cd ../..

echo "🌱 Seeding test database..."
cd packages/database && npx prisma db seed && cd ../..

echo "✅ E2E test environment ready!"
echo ""
echo "Test database: postgresql://test:test@localhost:5433/seacalendar_test"
echo "API server port: 3002"
echo "Web app port: 5174"
echo ""
echo "To run tests:"
echo "  npm run test:e2e:api    # API E2E tests"
echo "  npm run test:e2e:web    # Web E2E tests"
echo "  npm run test:e2e:full   # All E2E tests"
echo ""
echo "To teardown:"
echo "  npm run test:e2e:clean"
