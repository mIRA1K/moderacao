const { Command } = require("@src/structures");
const { findMatchingRoles, getMatchingChannel } = require("@utils/guildUtils");
const { addReactionRole, getReactionRoles } = require("@schemas/Message");
const { Util, Message, CommandInteraction } = require("discord.js");
const { parsePermissions } = require("@utils/botUtils");

const channelPerms = ["EMBED_LINKS", "READ_MESSAGE_HISTORY", "ADD_REACTIONS", "USE_EXTERNAL_EMOJIS", "MANAGE_MESSAGES"];

module.exports = class AddReactionRole extends Command {
  constructor(client) {
    super(client, {
      name: "addrr",
      description: "Configurar cargo de reação para a mensagem especificada",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<#channel> <messageid> <emote> <role>",
        minArgsCount: 4,
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
            description: "ID da mensagem para a qual as funções de reação devem ser configuradas",
            type: "STRING",
            required: true,
          },
          {
            name: "emoji",
            description: "Emoji para usar",
            type: "STRING",
            required: true,
          },
          {
            name: "role",
            description: "Cargo a ser dado para o emoji selecionado",
            type: "ROLE",
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

    const role = findMatchingRoles(message.guild, args[3])[0];
    if (!role) return message.reply(`No roles found matching ${args[3]}`);

    const reaction = args[2];

    const response = await addRR(message.guild, targetChannel[0], targetMessage, reaction, role);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const targetChannel = interaction.options.getChannel("channel");
    const messageId = interaction.options.getString("message_id");
    const reaction = interaction.options.getString("emoji");
    const role = interaction.options.getRole("role");

    const response = await addRR(interaction.guild, targetChannel, messageId, reaction, role);
    await interaction.followUp(response);
  }
};

async function addRR(guild, channel, messageId, reaction, role) {
  if (!channel.permissionsFor(guild.me).has(channelPerms)) {
    return `Você precisa das seguintes permissões em ${channel.toString()}\n${parsePermissions(channelPerms)}`;
  }

  let targetMessage;
  try {
    targetMessage = await channel.messages.fetch(messageId);
  } catch (ex) {
    return "Não foi possível buscar a mensagem. Você forneceu um mensageID válido?";
  }

  if (role.managed) {
    return "Eu não posso atribuir funções de bot.";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Você não pode atribuir a função de todos.";
  }

  if (guild.me.roles.highest.position < role.position) {
    return "Oops! Não posso adicionar / remover membros para esse cargo. Esse cargo é mais alto do que o meu?";
  }

  const custom = Util.parseEmoji(reaction);
  if (custom.id && !guild.emojis.cache.has(custom.id)) return "Este emoji não pertence a este servidor";
  const emoji = custom.id ? custom.id : custom.name;

  try {
    await targetMessage.react(emoji);
  } catch (ex) {
    return `Oops! Falha ao reagir. Este é um emoji válido: ${reaction} ?`;
  }

  let reply = "";
  const previousRoles = getReactionRoles(guild.id, channel.id, targetMessage.id);
  if (previousRoles.length > 0) {
    const found = previousRoles.find((rr) => rr.emote === emoji);
    if (found) reply = "Uma função já está configurada para este emoji. Sobrescrever dados,\n";
  }

  await addReactionRole(guild.id, channel.id, targetMessage.id, emoji, role.id);
  return (reply += "Feito! Configuração salva");
}
