/**
 * SeaCalendar Discord Bot
 * Main entry point for the Discord bot
 */

import { Client, GatewayIntentBits, Collection, Events, REST, Routes } from 'discord.js';
import { Config } from './config.js';
import { Command } from './types/command.js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '@seacalendar/database';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.DirectMessages,
  ],
});

// Commands collection
client.commands = new Collection<string, Command>();

/**
 * Load all commands from the commands directory
 */
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  let commandFiles: string[] = [];

  try {
    const files = await readdir(commandsPath);
    commandFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  } catch (error) {
    console.warn('⚠️  No commands directory found. Creating placeholder...');
    return;
  }

  console.log(`📦 Loading ${commandFiles.length} commands...`);

  for (const file of commandFiles) {
    try {
      const filePath = join(commandsPath, file);
      const command = await import(filePath);

      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`  ✅ Loaded command: ${command.data.name}`);
      } else {
        console.warn(`  ⚠️  Command ${file} is missing required "data" or "execute" property`);
      }
    } catch (error) {
      console.error(`  ❌ Failed to load command ${file}:`, error);
    }
  }
}

/**
 * Load all event handlers
 */
async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  let eventFiles: string[] = [];

  try {
    const files = await readdir(eventsPath);
    eventFiles = files.filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  } catch (error) {
    console.warn('⚠️  No events directory found. Using default handlers...');
    return;
  }

  console.log(`📦 Loading ${eventFiles.length} event handlers...`);

  for (const file of eventFiles) {
    try {
      const filePath = join(eventsPath, file);
      const event = await import(filePath);

      if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
      } else {
        client.on(event.name, (...args) => event.execute(...args));
      }

      console.log(`  ✅ Loaded event: ${event.name}`);
    } catch (error) {
      console.error(`  ❌ Failed to load event ${file}:`, error);
    }
  }
}

/**
 * Default event handlers (used if no event files exist)
 */
function setupDefaultHandlers() {
  // Ready event
  client.once(Events.ClientReady, (c) => {
    console.log(`✅ Discord bot ready! Logged in as ${c.user.tag}`);
  });

  // Interaction handler
  client.on(Events.InteractionCreate, async (interaction) => {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);

        const errorMessage = {
          content: '❌ There was an error executing this command!',
          ephemeral: true
        };

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(errorMessage);
        } else {
          await interaction.reply(errorMessage);
        }
      }
    }

    // Handle autocomplete
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);

      if (!command || !command.autocomplete) {
        return;
      }

      try {
        await command.autocomplete(interaction);
      } catch (error) {
        console.error(`Error in autocomplete for ${interaction.commandName}:`, error);
      }
    }
  });

  // Error handling
  client.on(Events.Error, (error) => {
    console.error('Discord client error:', error);
  });

  // Warnings
  client.on(Events.Warn, (info) => {
    console.warn('Discord client warning:', info);
  });
}

/**
 * Initialize cron jobs for reminders
 */
async function initializeCronJobs() {
  // Cron jobs will be implemented in Phase 4
  // Placeholder for now
  console.log('⏰ Cron jobs initialization (Phase 4)');
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  console.log('\n🛑 Shutting down bot...');

  try {
    // Destroy Discord client
    client.destroy();

    // Disconnect Prisma
    await prisma.$disconnect();

    console.log('✅ Shutdown complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

/**
 * Main function to start the bot
 */
async function main() {
  try {
    console.log('🚀 Starting SeaCalendar Discord Bot...\n');

    // Test database connection
    console.log('📊 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected\n');

    // Load commands and events
    await loadCommands();
    await loadEvents();

    // If no event handlers were loaded, use defaults
    if (client.listenerCount(Events.ClientReady) === 0) {
      console.log('📦 Using default event handlers...');
      setupDefaultHandlers();
    }

    // Initialize cron jobs
    await initializeCronJobs();

    // Login to Discord
    console.log('\n🔐 Logging in to Discord...');
    await client.login(Config.discord.token);

  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

// Start the bot
main();

// TypeScript declaration to add commands property to Client
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, Command>;
  }
}
