/**
 * Configuration for SeaCalendar Discord Bot
 * Loads and validates environment variables
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development' });

// Environment variable schema with validation
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Discord Bot
  DISCORD_BOT_TOKEN: z.string().min(1, 'DISCORD_BOT_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_TEST_GUILD_ID: z.string().optional(), // For faster command deployment in dev

  // Web App
  WEB_APP_URL: z.string().url('WEB_APP_URL must be a valid URL'),

  // Optional: Cron schedule overrides
  VOTE_REMINDER_CRON: z.string().default('0 10 * * *'), // Daily at 10 AM
  EVENT_REMINDER_CRON: z.string().default('0 10 * * *'), // Daily at 10 AM
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
  // Environment
  nodeEnv: config.NODE_ENV,
  isDevelopment: config.NODE_ENV === 'development',
  isProduction: config.NODE_ENV === 'production',
  isTest: config.NODE_ENV === 'test',

  // Database
  databaseUrl: config.DATABASE_URL,

  // Discord
  discord: {
    token: config.DISCORD_BOT_TOKEN,
    clientId: config.DISCORD_CLIENT_ID,
    testGuildId: config.DISCORD_TEST_GUILD_ID,
  },

  // Web App
  webAppUrl: config.WEB_APP_URL,

  // Cron schedules
  cron: {
    voteReminder: config.VOTE_REMINDER_CRON,
    eventReminder: config.EVENT_REMINDER_CRON,
  },

  // Bot settings
  bot: {
    maxVotingOptions: 5, // Max options for Discord emoji voting
    defaultVotingDeadlineDays: 14, // Default voting period: 2 weeks
    voteReminderDays: [3, 1], // Remind 3 days and 1 day before deadline
    eventReminderDays: [7, 1], // Remind 1 week and 1 day before event
  },
};

// Log configuration on startup (hide secrets)
if (!Config.isTest) {
  console.log('🤖 Discord Bot Configuration:');
  console.log(`  Environment: ${Config.nodeEnv}`);
  console.log(`  Database: ${Config.databaseUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`  Discord Token: ${Config.discord.token.substring(0, 20)}...`);
  console.log(`  Discord Client ID: ${Config.discord.clientId}`);
  if (Config.discord.testGuildId) {
    console.log(`  Test Guild ID: ${Config.discord.testGuildId}`);
  }
  console.log(`  Web App URL: ${Config.webAppUrl}`);
}
