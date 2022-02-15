const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const vunmute = require("./shared/vunmute");

module.exports = class VUnMuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "vunmute",
      description: "Ativa a voz do membro especificado",
      category: "MODERATION",
      userPermissions: ["MUTE_MEMBERS"],
      botPermissions: ["MUTE_MEMBERS"],
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
    const response = await vunmute(message, target, reason);
    await message.reply(response);
  }
};
