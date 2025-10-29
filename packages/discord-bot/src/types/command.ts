/**
 * Discord slash command type definition
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  CommandInteraction,
  AutocompleteInteraction
} from 'discord.js';

export interface Command {
  data: SlashCommandBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export interface CommandMap {
  [key: string]: Command;
}
