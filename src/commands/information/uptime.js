const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const { timeformat } = require("@utils/miscUtils");

module.exports = class BotInvite extends Command {
  constructor(client) {
    super(client, {
      name: "uptime",
      description: "Tempo de atividade do bot",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
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
    await message.reply(`Meu tempo de vida: \`${timeformat(process.uptime())}\``);
  }
};
