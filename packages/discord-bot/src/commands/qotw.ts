/**
 * /qotw command
 * Question of the Week management
 */

import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType,
  PermissionFlagsBits,
  ChannelType,
  type TextChannel,
  PollBuilder,
} from 'discord.js';
import * as qotwService from '../services/qotwService.js';
import { DateTime } from 'luxon';

export const data = new SlashCommandBuilder()
  .setName('qotw')
  .setDescription('Question of the Week commands')
  // User commands
  .addSubcommand(sub =>
    sub
      .setName('submit')
      .setDescription('Submit a question for QOTW')
      .addStringOption(opt =>
        opt
          .setName('question')
          .setDescription('Your question (max 1000 characters)')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('list')
      .setDescription('List all submitted questions')
      .addIntegerOption(opt =>
        opt
          .setName('page')
          .setDescription('Page number (default: 1)')
          .setMinValue(1)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('edit')
      .setDescription('Edit a question you submitted')
      .addStringOption(opt =>
        opt
          .setName('question_id')
          .setDescription('Question ID to edit')
          .setRequired(true)
      )
      .addStringOption(opt =>
        opt
          .setName('new_question')
          .setDescription('New question text')
          .setRequired(true)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('delete')
      .setDescription('Delete a question')
      .addStringOption(opt =>
        opt
          .setName('question_id')
          .setDescription('Question ID to delete')
          .setRequired(true)
      )
  )
  // Admin commands
  .addSubcommand(sub =>
    sub
      .setName('setup')
      .setDescription('[Admin] Configure QOTW for your server')
      .addChannelOption(opt =>
        opt
          .setName('channel')
          .setDescription('Channel for QOTW (e.g., #❔│qotw)')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildText)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('schedule')
      .setDescription('[Admin] Set when questions are posted')
      .addStringOption(opt =>
        opt
          .setName('day')
          .setDescription('Day of week (Sunday, Monday, etc.)')
          .setRequired(true)
          .addChoices(
            { name: 'Sunday', value: '0' },
            { name: 'Monday', value: '1' },
            { name: 'Tuesday', value: '2' },
            { name: 'Wednesday', value: '3' },
            { name: 'Thursday', value: '4' },
            { name: 'Friday', value: '5' },
            { name: 'Saturday', value: '6' }
          )
      )
      .addIntegerOption(opt =>
        opt
          .setName('hour')
          .setDescription('Hour (0-23, Pacific Time)')
          .setRequired(true)
          .setMinValue(0)
          .setMaxValue(23)
      )
      .addIntegerOption(opt =>
        opt
          .setName('minute')
          .setDescription('Minute (0-59)')
          .setMinValue(0)
          .setMaxValue(59)
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('next')
      .setDescription('[Admin] View or set the next question')
      .addStringOption(opt =>
        opt
          .setName('question_id')
          .setDescription('Question ID to set as next (leave empty to view current)')
      )
  )
  .addSubcommand(sub =>
    sub
      .setName('asknow')
      .setDescription('[Admin] Post the next question immediately')
  )
  .addSubcommand(sub =>
    sub
      .setName('poll')
      .setDescription('[Admin] Create a poll to select the next question')
  )
  .addSubcommand(sub =>
    sub
      .setName('enable')
      .setDescription('[Admin] Enable QOTW posting')
  )
  .addSubcommand(sub =>
    sub
      .setName('disable')
      .setDescription('[Admin] Disable QOTW posting')
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  // Admin command check
  const adminCommands = ['setup', 'schedule', 'next', 'asknow', 'poll', 'enable', 'disable'];
  if (adminCommands.includes(subcommand)) {
    const member = interaction.member;
    if (!member || !('permissions' in member) || !member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({
        content: '❌ Only administrators can use this command.',
        ephemeral: true,
      });
      return;
    }
  }

  switch (subcommand) {
    case 'submit':
      await handleSubmit(interaction);
      break;
    case 'list':
      await handleList(interaction);
      break;
    case 'edit':
      await handleEdit(interaction);
      break;
    case 'delete':
      await handleDelete(interaction);
      break;
    case 'setup':
      await handleSetup(interaction);
      break;
    case 'schedule':
      await handleSchedule(interaction);
      break;
    case 'next':
      await handleNext(interaction);
      break;
    case 'asknow':
      await handleAskNow(interaction);
      break;
    case 'poll':
      await handlePoll(interaction);
      break;
    case 'enable':
      await handleEnable(interaction);
      break;
    case 'disable':
      await handleDisable(interaction);
      break;
  }
}

async function handleSubmit(interaction: ChatInputCommandInteraction) {
  const question = interaction.options.getString('question', true);
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Validate length
    if (question.length > qotwService.MAX_QUESTION_LENGTH) {
      await interaction.editReply({
        content: `❌ Question is too long (${question.length}/${qotwService.MAX_QUESTION_LENGTH} characters)`,
      });
      return;
    }

    // Show preview
    const embed = new EmbedBuilder()
      .setColor(0x0ea5e9)
      .setTitle('🌊 Question Preview')
      .setDescription(question)
      .addFields(
        { name: 'Submitter', value: interaction.user.tag, inline: true },
        { name: 'Length', value: `${question.length}/${qotwService.MAX_QUESTION_LENGTH}`, inline: true }
      );

    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('qotw_confirm')
          .setLabel('✅ Submit Question')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('qotw_cancel')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.editReply({
      content: '**Preview your question:**',
      embeds: [embed],
      components: [buttons],
    });

    // Wait for confirmation
    const confirmation = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60_000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    if (confirmation.customId === 'qotw_cancel') {
      await confirmation.update({
        content: '❌ Question submission cancelled.',
        embeds: [],
        components: [],
      });
      return;
    }

    await confirmation.deferUpdate();

    // Submit question
    const submitted = await qotwService.submitQuestion({
      question,
      guildId,
      submitterId: interaction.user.id,
      submitterUsername: interaction.user.tag,
    });

    const successEmbed = new EmbedBuilder()
      .setColor(0x10b981)
      .setTitle('✅ Question Submitted!')
      .setDescription(submitted.question)
      .addFields(
        { name: 'Question ID', value: submitted.id, inline: false },
        { name: 'Status', value: 'In queue', inline: true }
      );

    await confirmation.editReply({
      content: 'Thanks for your contribution!',
      embeds: [successEmbed],
      components: [],
    });

  } catch (error) {
    console.error('Error submitting question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({
      content: `❌ Error: ${errorMessage}`,
    });
  }
}

async function handleList(interaction: ChatInputCommandInteraction) {
  const page = interaction.options.getInteger('page') || 1;
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    const result = await qotwService.listQuestions(guildId, page, 50);

    if (result.total === 0) {
      await interaction.editReply({
        content: '❌ No questions submitted yet. Use `/qotw submit` to add one!',
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x0ea5e9)
      .setTitle('🌊 QOTW Question List')
      .setFooter({ text: `Page ${page}/${result.pages} • ${result.total} total questions` });

    // Format questions (show first 10 per page for embed limit)
    const questionsToShow = result.questions.slice(0, 10);
    const description = questionsToShow.map((q) => {
      const truncated = q.question.length > 100 ? q.question.substring(0, 97) + '...' : q.question;
      const askedCount = q.timesAsked > 0 ? ` (asked ${q.timesAsked}x)` : '';
      return `**${q.id.substring(0, 8)}...** - ${truncated}\n_By ${q.submitterUsername} on ${DateTime.fromJSDate(q.submittedAt).toFormat('MMM d, yyyy')}${askedCount}_\n`;
    }).join('\n');

    embed.setDescription(description || 'No questions to display');

    if (result.questions.length > 10) {
      embed.addFields({
        name: 'Note',
        value: `Showing first 10 of ${result.questions.length} questions on this page`,
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error listing questions:', error);
    await interaction.editReply({ content: '❌ Error loading questions' });
  }
}

async function handleEdit(interaction: ChatInputCommandInteraction) {
  const questionId = interaction.options.getString('question_id', true);
  const newQuestion = interaction.options.getString('new_question', true);
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Check question exists and permissions
    const question = await qotwService.getQuestion(questionId, guildId);
    if (!question) {
      await interaction.editReply({ content: '❌ Question not found' });
      return;
    }

    const isAdmin = interaction.member && 'permissions' in interaction.member &&
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!qotwService.canModifyQuestion(question, interaction.user.id, isAdmin)) {
      await interaction.editReply({ content: '❌ You can only edit questions you submitted' });
      return;
    }

    // Validate length
    if (newQuestion.length > qotwService.MAX_QUESTION_LENGTH) {
      await interaction.editReply({
        content: `❌ Question is too long (${newQuestion.length}/${qotwService.MAX_QUESTION_LENGTH} characters)`,
      });
      return;
    }

    // Show preview
    const embed = new EmbedBuilder()
      .setColor(0x0ea5e9)
      .setTitle('🌊 Edit Question Preview')
      .addFields(
        { name: 'Old Question', value: question.question, inline: false },
        { name: 'New Question', value: newQuestion, inline: false }
      );

    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('qotw_edit_confirm')
          .setLabel('✅ Save Changes')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('qotw_edit_cancel')
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });

    const confirmation = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60_000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    if (confirmation.customId === 'qotw_edit_cancel') {
      await confirmation.update({
        content: '❌ Edit cancelled',
        embeds: [],
        components: [],
      });
      return;
    }

    await confirmation.deferUpdate();

    await qotwService.updateQuestion(questionId, guildId, newQuestion);

    await confirmation.editReply({
      content: '✅ Question updated successfully!',
      embeds: [],
      components: [],
    });

  } catch (error) {
    console.error('Error editing question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({ content: `❌ Error: ${errorMessage}` });
  }
}

async function handleDelete(interaction: ChatInputCommandInteraction) {
  const questionId = interaction.options.getString('question_id', true);
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    const question = await qotwService.getQuestion(questionId, guildId);
    if (!question) {
      await interaction.editReply({ content: '❌ Question not found' });
      return;
    }

    const isAdmin = interaction.member && 'permissions' in interaction.member &&
      interaction.member.permissions.has(PermissionFlagsBits.Administrator);

    if (!qotwService.canModifyQuestion(question, interaction.user.id, isAdmin)) {
      await interaction.editReply({ content: '❌ You can only delete questions you submitted' });
      return;
    }

    // Confirm deletion
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ Confirm Deletion')
      .setDescription(question.question)
      .addFields({ name: 'Warning', value: 'This action cannot be undone' });

    const buttons = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('qotw_delete_confirm')
          .setLabel('🗑️ Delete')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('qotw_delete_cancel')
          .setLabel('Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

    const response = await interaction.editReply({
      embeds: [embed],
      components: [buttons],
    });

    const confirmation = await response.awaitMessageComponent({
      componentType: ComponentType.Button,
      time: 60_000,
      filter: (i) => i.user.id === interaction.user.id,
    });

    if (confirmation.customId === 'qotw_delete_cancel') {
      await confirmation.update({
        content: '❌ Deletion cancelled',
        embeds: [],
        components: [],
      });
      return;
    }

    await confirmation.deferUpdate();

    await qotwService.deleteQuestion(questionId, guildId);

    await confirmation.editReply({
      content: '✅ Question deleted',
      embeds: [],
      components: [],
    });

  } catch (error) {
    console.error('Error deleting question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({ content: `❌ Error: ${errorMessage}` });
  }
}

async function handleSetup(interaction: ChatInputCommandInteraction) {
  const channel = interaction.options.getChannel('channel', true) as TextChannel;
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    await qotwService.updateConfig(guildId, { channelId: channel.id });

    await interaction.editReply({
      content: `✅ QOTW channel set to ${channel}\n\nQuestions will be posted here according to your schedule (use \`/qotw schedule\` to configure)`,
    });

  } catch (error) {
    console.error('Error setting up QOTW:', error);
    await interaction.editReply({ content: '❌ Error setting up QOTW' });
  }
}

async function handleSchedule(interaction: ChatInputCommandInteraction) {
  const day = interaction.options.getString('day', true);
  const hour = interaction.options.getInteger('hour', true);
  const minute = interaction.options.getInteger('minute') || 0;
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    // Convert to cron format: "minute hour * * dayOfWeek"
    const cronSchedule = `${minute} ${hour} * * ${day}`;

    await qotwService.updateConfig(guildId, { cronSchedule });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[parseInt(day)];
    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    await interaction.editReply({
      content: `✅ QOTW schedule updated!\n\nQuestions will be posted every **${dayName}** at **${timeStr} Pacific Time**`,
    });

  } catch (error) {
    console.error('Error updating schedule:', error);
    await interaction.editReply({ content: '❌ Error updating schedule' });
  }
}

async function handleNext(interaction: ChatInputCommandInteraction) {
  const questionId = interaction.options.getString('question_id');
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    if (!questionId) {
      // View current next question
      const config = await qotwService.getOrCreateConfig(guildId);
      if (!config.nextQuestionId) {
        const nextQuestion = await qotwService.getNextQuestion(guildId);
        if (!nextQuestion) {
          await interaction.editReply({
            content: '❌ No questions available. Use `/qotw submit` to add some!',
          });
          return;
        }
        await interaction.editReply({
          content: `**Next question (automatic):**\n${nextQuestion.question}\n\n_ID: ${nextQuestion.id}_`,
        });
      } else {
        const question = await qotwService.getQuestion(config.nextQuestionId, guildId);
        if (question) {
          await interaction.editReply({
            content: `**Next question (manually set):**\n${question.question}\n\n_ID: ${question.id}_`,
          });
        } else {
          await interaction.editReply({ content: '❌ Configured next question not found' });
        }
      }
    } else {
      // Set next question
      const question = await qotwService.getQuestion(questionId, guildId);
      if (!question) {
        await interaction.editReply({ content: '❌ Question not found' });
        return;
      }

      // If there was a previous next question, put it back in pool
      const oldConfig = await qotwService.getOrCreateConfig(guildId);
      if (oldConfig.nextQuestionId && oldConfig.nextQuestionId !== questionId) {
        // Just clear it - the service already handles this
      }

      await qotwService.setNextQuestion(guildId, questionId);

      await interaction.editReply({
        content: `✅ Next question set to:\n${question.question}`,
      });
    }

  } catch (error) {
    console.error('Error handling next question:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({ content: `❌ Error: ${errorMessage}` });
  }
}

async function handleAskNow(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await qotwService.getOrCreateConfig(guildId);

    if (!config.channelId) {
      await interaction.editReply({
        content: '❌ No QOTW channel configured. Use `/qotw setup` first.',
      });
      return;
    }

    const channel = await interaction.guild?.channels.fetch(config.channelId) as TextChannel;
    if (!channel) {
      await interaction.editReply({ content: '❌ Configured channel not found' });
      return;
    }

    await postQuestion(guildId, channel);

    await interaction.editReply({
      content: `✅ Question posted in ${channel}`,
    });

  } catch (error) {
    console.error('Error posting question now:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({ content: `❌ Error: ${errorMessage}` });
  }
}

async function handlePoll(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    const config = await qotwService.getOrCreateConfig(guildId);

    if (!config.channelId) {
      await interaction.editReply({
        content: '❌ No QOTW channel configured. Use `/qotw setup` first.',
      });
      return;
    }

    const channel = await interaction.guild?.channels.fetch(config.channelId) as TextChannel;
    if (!channel) {
      await interaction.editReply({ content: '❌ Configured channel not found' });
      return;
    }

    await postSelectionPoll(guildId, channel);

    await interaction.editReply({
      content: `✅ Selection poll posted in ${channel}`,
    });

  } catch (error) {
    console.error('Error posting selection poll:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await interaction.editReply({ content: `❌ Error: ${errorMessage}` });
  }
}

async function handleEnable(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    await qotwService.updateConfig(guildId, { enabled: true });
    await interaction.editReply({ content: '✅ QOTW posting enabled' });
  } catch (error) {
    console.error('Error enabling QOTW:', error);
    await interaction.editReply({ content: '❌ Error enabling QOTW' });
  }
}

async function handleDisable(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId!;

  await interaction.deferReply({ ephemeral: true });

  try {
    await qotwService.updateConfig(guildId, { enabled: false });
    await interaction.editReply({ content: '✅ QOTW posting disabled' });
  } catch (error) {
    console.error('Error disabling QOTW:', error);
    await interaction.editReply({ content: '❌ Error disabling QOTW' });
  }
}

// Helper function to post a question
export async function postQuestion(guildId: string, channel: TextChannel): Promise<void> {
  const hasQs = await qotwService.hasQuestions(guildId);

  if (!hasQs) {
    // No questions available - post default and request more
    const defaultQuestion = qotwService.getDefaultQuestion();
    const message = await channel.send({
      content: `🌊 **QUESTION OF THE WEEK** 🌊\n\n${defaultQuestion}\n\n_Submitted by SeaCalendar Bot_\n\n⚠️ **We're out of questions!** Submit yours with \`/qotw submit\``,
    });
    return;
  }

  const question = await qotwService.getNextQuestion(guildId);

  if (!question) {
    throw new Error('Failed to get next question');
  }

  const message = await channel.send({
    content: `🌊 **QUESTION OF THE WEEK** 🌊\n\n${question.question}\n\n_Submitted by ${question.submitterUsername}_`,
  });

  await qotwService.markQuestionAsked(question.id, guildId, channel.id, message.id);
}

// Helper function to post selection poll
export async function postSelectionPoll(guildId: string, channel: TextChannel): Promise<void> {
  const questions = await qotwService.getQuestionsForPoll(guildId, 5);

  if (questions.length === 0) {
    await channel.send('⚠️ No questions available for selection poll. Use `/qotw submit` to add questions!');
    return;
  }

  // Create Discord poll
  const pollBuilder = new PollBuilder()
    .setQuestion({ text: '🌊 Vote for next week\'s question!' })
    .setDuration(3); // 3 days

  questions.forEach((q, i) => {
    const truncated = q.question.length > 55 ? q.question.substring(0, 52) + '...' : q.question;
    pollBuilder.addAnswer({ text: truncated, emoji: ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][i] });
  });

  await channel.send({
    poll: pollBuilder,
    content: questions.map((q, i) => `**${i + 1}.** ${q.question} _(by ${q.submitterUsername})_`).join('\n\n'),
  });

  await qotwService.updatePollTimestamp(guildId);

  // TODO: Handle poll result and set next question
  // This would require listening to poll end events in bot.ts
}
