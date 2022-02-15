const { Command } = require("@src/structures");
const { CommandInteraction } = require("discord.js");
const { purgeMessages } = require("@utils/modUtils");
const { sendMessage } = require("@utils/botUtils");

// SLASH COMMAND ONLY

module.exports = class PurgeCommand extends Command {
  constructor(client) {
    super(client, {
      name: "purge",
      description: "Comandos para limpar chat",
      category: "MODERATION",
      userPermissions: ["MANAGE_MESSAGES"],
      command: {
        enabled: false,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "all",
            description: "Limpar todas as mensagens",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
          {
            name: "attachments",
            description: "Limpar todas as mensagens with attachments",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
          {
            name: "bots",
            description: "Limpar todas as mensagens do bot",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
          {
            name: "links",
            description: "Limpar todas as mensagens with links",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
          {
            name: "token",
            description: "Limpar todas as mensagens contendo o token especificado",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "token",
                description: "Token a ser procurado nas mensagens",
                type: "STRING",
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
          {
            name: "user",
            description: "Limpar todas as mensagens from the specified user",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal do qual as mensagens devem ser limpas",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "user",
                description: "Usuário cujas mensagens precisam ser limpas",
                type: "USER",
                required: true,
              },
              {
                name: "amount",
                description: "Número de mensagens a serem excluídas (Max 99)",
                type: "INTEGER",
                required: false,
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const { options, member } = interaction;

    const sub = options.getSubcommand();
    const channel = options.getChannel("channel");
    const amount = options.getInteger("amount") || 99;

    let response;
    switch (sub) {
      case "all":
        response = await purgeMessages(member, channel, "ALL", amount);
        break;

      case "attachments":
        response = await purgeMessages(member, channel, "ATTACHMENT", amount);
        break;

      case "bots":
        response = await purgeMessages(member, channel, "BOT", amount);
        break;

      case "links":
        response = await purgeMessages(member, channel, "LINK", amount);
        break;

      case "token": {
        const token = interaction.options.getString("token");
        response = await purgeMessages(member, channel, "TOKEN", amount, token);
        break;
      }

      case "user": {
        const user = interaction.options.getUser("user");
        response = await purgeMessages(member, channel, "TOKEN", amount, user);
        break;
      }

      default:
        return interaction.followUp("Oops! Não é uma seleção de comando válida");
    }

    // Success
    if (typeof response === "number") {
      const message = `Limpo com sucesso ${response} mensagens em ${channel}`;
      if (channel.id !== interaction.channelId) await interaction.followUp(message);
      else await sendMessage(channel, message, 5);
      return;
    }

    // Member missing permissions
    else if (response === "MEMBER_PERM") {
      return interaction.followUp(
        `Você não tem permissão para Read Message History & Manage Messages em ${channel}`
      );
    }

    // Bot missing permissions
    else if (response === "BOT_PERM") {
      return interaction.followUp(`Eu não tenho permissão para Read Message History & Manage Messages em ${channel}`);
    }

    // No messages
    else if (response === "NO_MESSAGES") {
      return interaction.followUp("Nenhuma mensagem que possa ser limpa foi encontrada");
    }

    // Remaining
    else {
      return interaction.followUp("Falha ao limpar mensagens");
    }
  }
};
