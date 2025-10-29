/**
 * /myevents command
 * List events created by the user
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getUserPolls, generateVotingUrl } from '../services/pollService.js';
import { Config } from '../config.js';

export const data = new SlashCommandBuilder()
  .setName('myevents')
  .setDescription('List all events you created');

export async function execute(interaction: ChatInputCommandInteraction) {
  await interaction.deferReply({ ephemeral: true }); // Private reply

  try {
    // Get user's polls
    const polls = await getUserPolls(interaction.user.id);

    if (polls.length === 0) {
      await interaction.editReply({
        content: '📭 You haven\'t created any events yet.\n\nUse `/event` to create your first event!',
      });
      return;
    }

    // Filter polls by guild (show only this server's events)
    const guildPolls = polls.filter(p => p.guildId === interaction.guildId);

    // Create embed
    const embed = new EmbedBuilder()
      .setColor(0x0ea5e9)
      .setTitle('🌊 Your Events')
      .setDescription(`You've created ${guildPolls.length} event${guildPolls.length !== 1 ? 's' : ''} in this server.`);

    // Add polls to embed (max 10)
    for (const poll of guildPolls.slice(0, 10)) {
      const statusEmoji = poll.status === 'OPEN'
        ? '🟢'
        : poll.status === 'FINALIZED'
        ? '✅'
        : poll.status === 'CANCELLED'
        ? '❌'
        : '⏸️';

      const deadlineText = poll.votingDeadline
        ? `Deadline: <t:${Math.floor(poll.votingDeadline.getTime() / 1000)}:R>`
        : 'No deadline';

      embed.addFields({
        name: `${statusEmoji} ${poll.title}`,
        value: `📅 ${poll.options.length} date options • ${deadlineText}\n🔗 [Vote](${generateVotingUrl(poll.id)}) • [Results](${Config.webAppUrl}/results/${poll.id})`,
        inline: false,
      });
    }

    if (guildPolls.length > 10) {
      embed.setFooter({ text: `Showing 10 of ${guildPolls.length} events` });
    }

    // Add "Create Event" button
    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_event')
          .setLabel('➕ Create New Event')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel('🌐 View All on Web')
          .setStyle(ButtonStyle.Link)
          .setURL(`${Config.webAppUrl}/dashboard`),
      );

    await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });

  } catch (error) {
    console.error('Error in /myevents command:', error);
    await interaction.editReply({
      content: '❌ **Error fetching your events:**\n' +
        (error instanceof Error ? error.message : 'Unknown error occurred'),
    });
  }
}
