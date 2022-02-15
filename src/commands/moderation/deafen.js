const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const deafen = require("./shared/deafen");

module.exports = class DeafenCommand extends Command {
  constructor(client) {
    super(client, {
      name: "deafen",
      description: "Mutar um membro especificado em canais de voz",
      category: "MODERATION",
      userPermissions: ["DEAFEN_MEMBERS"],
      botPermissions: ["DEAFEN_MEMBERS"],
      command: {
        enabled: true,
        usage: "<ID|@member> [reason]",
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
    const reason = message.content.split(args[0])[1].trim();
    const response = await deafen(message, target, reason);
    await message.reply(response);
  }
};
