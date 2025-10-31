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
COPY packages/discord-bot/package*.json ./packages/discord-bot/

# Install all dependencies (this creates workspace symlinks)
RUN npm ci

# Copy all source code
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/discord-bot ./packages/discord-bot

# Generate Prisma client (required for TypeScript types)
WORKDIR /app/packages/database
RUN npx prisma generate

# Build packages in dependency order
WORKDIR /app
RUN npm run build -w @seacalendar/shared
RUN npm run build -w @seacalendar/database
RUN npm run build -w @seacalendar/discord-bot

# Stage 2: Production
FROM node:20-alpine

# Install openssl for Prisma
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/discord-bot/package*.json ./packages/discord-bot/

# Install only production dependencies
RUN npm ci --omit=dev --workspace=@seacalendar/discord-bot

# Copy built files from builder
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/database/dist ./packages/database/dist
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/packages/discord-bot/dist ./packages/discord-bot/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Generate Prisma client in production stage
WORKDIR /app/packages/database
RUN npx prisma generate

# Set working directory to bot package
WORKDIR /app/packages/discord-bot

# Start bot
CMD ["node", "dist/bot.js"]
