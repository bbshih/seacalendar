# Stage 1: Builder
FROM node:20-alpine AS builder

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package files first
COPY package*.json ./
COPY tsconfig.json ./

# Copy all package.json files to establish workspace structure
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Install all dependencies (this creates workspace symlinks)
RUN npm ci

# Copy all source code
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/api ./packages/api

# Generate Prisma client (required for TypeScript types)
WORKDIR /app/packages/database
RUN npx prisma generate

# Build packages in dependency order
WORKDIR /app
RUN npm run build -w @seacalendar/shared
RUN npm run build -w @seacalendar/database
RUN npm run build -w @seacalendar/api

# Stage 2: Production
FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/api/package*.json ./packages/api/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=@seacalendar/api

# Copy built files and generated Prisma client from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma/schema.prisma ./packages/database/prisma/schema.prisma
COPY --from=builder /app/packages/database/prisma/migrations ./packages/database/prisma/migrations
COPY --from=builder /app/packages/api/dist ./packages/api/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Set working directory to api package
WORKDIR /app/packages/api

# Expose API port
EXPOSE 3001

# Run database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=../database/prisma/schema.prisma && node dist/server.js"]
