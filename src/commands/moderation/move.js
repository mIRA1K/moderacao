const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { resolveMember, getMatchingChannel } = require("@utils/guildUtils");
const move = require("./shared/move");

module.exports = class DeafenCommand extends Command {
  constructor(client) {
    super(client, {
      name: "move",
      description: "Mover o membro especificado para o canal de voz",
      category: "MODERATION",
      userPermissions: ["DEAFEN_MEMBERS"],
      botPermissions: ["DEAFEN_MEMBERS"],
      command: {
        enabled: true,
        usage: "<ID|@member> <channel> [reason]",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: false,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const target = await resolveMember(message, args[0], true);
    if (!target) return message.reply(`Nenhum usuário encontrado correspondente ${args[0]}`);

    const channels = getMatchingChannel(message.guild, args[1]);
    if (!channels.length) return message.reply("Nenhum canal correspondente encontrado");
    const targetChannel = channels.pop();
    if (!targetChannel.type === "GUILD_VOICE" && !targetChannel.type === "GUILD_STAGE_VOICE") {
      return message.reply("O canal de destino não é um canal de voz");
    }

    const reason = args.slice(2).join(" ");
    const response = await move(message, target, reason, targetChannel);
    await message.reply(response);
  }
};
