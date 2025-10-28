/**
 * Configuration for SeaCalendar API Server
 * Loads and validates environment variables
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

// Environment variable schema with validation
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('3001').transform(Number),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Discord OAuth
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_CLIENT_SECRET: z.string().min(1, 'DISCORD_CLIENT_SECRET is required'),
  DISCORD_REDIRECT_URI: z.string().url('DISCORD_REDIRECT_URI must be a valid URL'),

  // Web App
  WEB_APP_URL: z.string().url('WEB_APP_URL must be a valid URL'),

  // Optional: Email (future)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
});

// Parse and validate environment variables
let config: z.infer<typeof envSchema>;

try {
  config = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Invalid environment variables:');
    error.errors.forEach((err) => {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

// Export validated config
export const Config = {
  // Server
  nodeEnv: config.NODE_ENV,
  port: config.API_PORT,
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',

  // Database
  databaseUrl: config.DATABASE_URL,

  // JWT
  jwtSecret: config.JWT_SECRET,
  jwtExpiresIn: config.JWT_EXPIRES_IN,
  refreshTokenExpiresIn: config.REFRESH_TOKEN_EXPIRES_IN,

  // Discord
  discord: {
    clientId: config.DISCORD_CLIENT_ID,
    clientSecret: config.DISCORD_CLIENT_SECRET,
    redirectUri: config.DISCORD_REDIRECT_URI,
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userUrl: 'https://discord.com/api/users/@me',
    scopes: ['identify', 'email'],
  },

  // Web App
  webAppUrl: config.WEB_APP_URL,

  // CORS
  corsOrigins: [
    config.WEB_APP_URL,
    ...(config.NODE_ENV === 'development' ? ['http://localhost:5173'] : []),
  ],

  // Rate Limiting
  rateLimit: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Logging
  logging: {
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  },
};

// Log configuration on startup (hide secrets)
if (!Config.isTest) {
  console.log('📋 Configuration loaded:');
  console.log(`  Environment: ${Config.nodeEnv}`);
  console.log(`  Port: ${Config.port}`);
  console.log(`  Database: ${Config.databaseUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`  JWT Secret: ${Config.jwtSecret.substring(0, 8)}...`);
  console.log(`  Discord Client ID: ${Config.discord.clientId}`);
  console.log(`  Web App URL: ${Config.webAppUrl}`);
}
