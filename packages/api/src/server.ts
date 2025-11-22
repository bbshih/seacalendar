/**
 * SeaCalendar API Server
 * Express server with Discord OAuth, WebSocket support, and RESTful API
 */

import express, { Express } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { prisma } from "@seacalendar/database";
import { Config } from "./config";
import { helmetConfig, corsConfig } from "./middleware/security";
import { generalLimiter } from "./middleware/rateLimit";
import { requestLogger, logger } from "./middleware/logger";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

// Create Express app
const app: Express = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new SocketIOServer(server, {
  cors: {
    origin: Config.corsOrigins,
    credentials: true,
  },
});

// Middleware setup
app.use(helmetConfig); // Security headers
app.use(corsConfig); // CORS
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(requestLogger); // Request logging
app.use(generalLimiter); // Rate limiting

// Health check endpoint (both paths for compatibility)
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "SeaCalendar API is running",
    timestamp: new Date().toISOString(),
    environment: Config.nodeEnv,
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SeaCalendar API is running",
    timestamp: new Date().toISOString(),
    environment: Config.nodeEnv,
  });
});

// Import routes
import authRoutes from "./routes/auth";
import pollRoutes from "./routes/polls";
import voteRoutes from "./routes/votes";
import userRoutes from "./routes/users";
// import memoryRoutes from "./routes/memories"; // TODO: Re-enable when schema migration complete
// import utilsRoutes from "./routes/utils"; // TODO: Re-enable when schema migration complete

// Register API routes
app.use("/api/auth", authRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api", voteRoutes); // Vote routes include /api/polls/:pollId/vote
app.use("/api/users", userRoutes);
// app.use("/api/memories", memoryRoutes); // TODO: Re-enable when schema migration complete
// app.use("/api/utils", utilsRoutes); // TODO: Re-enable when schema migration complete

// Import and initialize Socket.io handlers
import { initializeSocketHandlers } from "./sockets";
initializeSocketHandlers(io);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, starting graceful shutdown...`);

  // Close server
  server.close(() => {
    logger.info("HTTP server closed");
  });

  // Close Socket.io connections
  io.close(() => {
    logger.info("Socket.io connections closed");
  });

  // Disconnect Prisma
  await prisma.$disconnect();
  logger.info("Database connection closed");

  process.exit(0);
};

// Register shutdown handlers
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info("✅ Database connected");

    // Start listening
    server.listen(Config.port, () => {
      logger.info(`SeaCalendar API server running on port ${Config.port}`);
      logger.info(`📝 Environment: ${Config.nodeEnv}`);
      logger.info(`🔗 Health check: http://localhost:${Config.port}/health`);
    });

    // Export io for use in other modules
    app.set("io", io);
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
};

// Start the server
startServer();

export { app, server, io };
