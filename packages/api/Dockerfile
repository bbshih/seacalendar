# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code for shared dependencies
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/api ./packages/api

# Build shared packages first, then API
RUN npm run build -w @seacalendar/shared && \
    npm run build -w @seacalendar/database && \
    npm run build -w @seacalendar/api

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=@seacalendar/api

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/api/dist ./packages/api/dist

# Set working directory to api package
WORKDIR /app/packages/api

# Expose API port
EXPOSE 3001

# Run database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../database/prisma/schema.prisma && node dist/server.js"]
