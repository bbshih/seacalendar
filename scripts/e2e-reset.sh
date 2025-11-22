#!/bin/bash
# E2E Test Database Reset Script
# Resets test database to clean state

set -e

echo "🔄 Resetting test database..."

# Load test environment variables
export $(cat .env.test | grep -v '^#' | xargs)

# Reset database using Prisma
cd packages/database
npx prisma migrate reset --force --skip-seed
npx prisma db seed
cd ../..

echo "✅ Test database reset complete!"
