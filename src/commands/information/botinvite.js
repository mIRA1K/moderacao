const { Command } = require("@src/structures");
const { Message } = require("discord.js");
const botinvite = require("./shared/botinvite");

module.exports = class BotInvite extends Command {
  constructor(client) {
    super(client, {
      name: "botinvite",
      description: "Dá a você um convite do bot",
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
    const response = botinvite(message.client);
    try {
      await message.author.send(response);
      return message.reply("Verifique sua DM para obter minhas informações! :envelope_with_arrow:");
    } catch (ex) {
      return message.reply("Eu não posso te enviar minhas informações! A sua DM está aberto??");
    }
  }
};
