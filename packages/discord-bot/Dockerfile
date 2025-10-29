# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY packages/database/package*.json ./packages/database/
COPY packages/discord-bot/package*.json ./packages/discord-bot/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code for shared dependencies
COPY packages/shared ./packages/shared
COPY packages/database ./packages/database
COPY packages/discord-bot ./packages/discord-bot

# Build shared packages first, then bot
RUN npm run build -w @seacalendar/shared && \
    npm run build -w @seacalendar/database && \
    npm run build -w @seacalendar/discord-bot

# Stage 2: Production
FROM node:20-alpine

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

# Set working directory to bot package
WORKDIR /app/packages/discord-bot

# Start bot
CMD ["node", "dist/bot.js"]
