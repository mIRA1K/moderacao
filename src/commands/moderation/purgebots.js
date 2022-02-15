const { Message } = require("discord.js");
const { Command } = require("@src/structures");
const { purgeMessages } = require("@utils/modUtils");
const { sendMessage } = require("@utils/botUtils");

module.exports = class PurgeBots extends Command {
  constructor(client) {
    super(client, {
      name: "purgebots",
      description: "Apaga a quantidade especificada de mensagens de bots",
      category: "MODERATION",
      userPermissions: ["MANAGE_MESSAGES"],
      botPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
      command: {
        enabled: true,
        usage: "[amount]",
        aliases: ["purgebot"],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const amount = args[0] || 99;

    if (amount) {
      if (isNaN(amount)) return message.reply("Números são permitidos apenas");
      if (parseInt(amount) > 99) return message.reply("A quantidade máxima de mensagens que posso excluir é 99");
    }
    const response = await purgeMessages(message.member, message.channel, "BOT", amount);

    if (typeof response === "number") {
      return sendMessage(message.channel, `Excluiu com sucesso ${response} mensagens `, 5);
    } else if (response === "BOT_PERM") {
      return message.reply("Não tenho  `Read Message History` e `Manage Messages` para excluir mensagens");
    } else if (response === "MEMBER_PERM") {
      return message.reply("Você não tem `Read Message History` e `Manage Messages` para excluir mensagens");
    } else if (response === "NO_MESSAGES") {
      return message.reply("Nenhuma mensagem encontrada que possa ser limpa");
    } else {
      return message.reply(`Ocorreu um erro! Falha ao excluir mensagens`);
    }
  }
};
