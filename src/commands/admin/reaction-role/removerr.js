const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { removeReactionRole } = require("@schemas/Message");
const { parsePermissions } = require("@utils/botUtils");
const { getMatchingChannel } = require("@utils/guildUtils");

const channelPerms = ["EMBED_LINKS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "MANAGE_MESSAGES"];

module.exports = class RemoveReactionRole extends Command {
  constructor(client) {
    super(client, {
      name: "removerr",
      description: "Remove a reação configurada para a mensagem especificada",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#channel> <messageid>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "channel",
            description: "Canal onde a mensagem existe",
            type: "CHANNEL",
            channelTypes: ["GUILD_TEXT"],
            required: true,
          },
          {
            name: "message_id",
            description: "ID da mensagem para a qual os cargos da reação foram configuradas",
            type: "STRING",
            required: true,
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const targetChannel = getMatchingChannel(message.guild, args[0]);
    if (targetChannel.length === 0) return message.reply(`Nenhum canal encontrado correspondente ${args[0]}`);

    const targetMessage = args[1];
    const response = await removeRR(message.guild, targetChannel[0], targetMessage);

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("channel");
    const messageId = interaction.options.getString("message_id");

    const response = await removeRR(interaction.guild, targetChannel, messageId);
    await interaction.followUp(response);
  }
};

async function removeRR(guild, channel, messageId) {
  if (!channel.permissionsFor(guild.me).has(channelPerms)) {
    return `Você precisa das seguintes permissões em ${channel.toString()}\n${parsePermissions(channelPerms)}`;
  }

  let targetMessage;
  try {
    targetMessage = await channel.messages.fetch(messageId);
  } catch (ex) {
    return "Não foi possível buscar a mensagem. Você forneceu um messageID válido?";
  }

  try {
    await removeReactionRole(guild.id, channel.id, targetMessage.id);
    await targetMessage.reactions?.removeAll();
  } catch (ex) {
    return "Oops! Um erro inesperado ocorreu. Tente mais tarde";
  }

  return "Feito! Configuração atualizada";
}
