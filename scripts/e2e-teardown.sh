#!/bin/bash
# E2E Test Environment Teardown Script
# Stops test database and cleans up

set -e

echo "🧹 Tearing down E2E test environment..."

# Stop test database
if docker ps | grep -q seacalendar-test-db; then
  echo "🛑 Stopping test database..."
  docker-compose -f docker-compose.test.yml down
else
  echo "ℹ️  Test database not running"
fi

# Optional: Remove test database volumes (uncomment to enable)
# echo "🗑️  Removing test database volumes..."
# docker-compose -f docker-compose.test.yml down -v

echo "✅ E2E test environment cleaned up!"
