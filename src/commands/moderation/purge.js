const { Message } = require("discord.js");
const { Command } = require("@src/structures");
const { purgeMessages } = require("@utils/modUtils");
const { sendMessage } = require("@utils/botUtils");

module.exports = class PurgeCommand extends Command {
  constructor(client) {
    super(client, {
      name: "purge",
      description: "Exclui a quantidade especificada de mensagens",
      category: "MODERATION",
      userPermissions: ["MANAGE_MESSAGES"],
      botPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
      command: {
        enabled: true,
        usage: "<amount>",
        minArgsCount: 1,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const amount = args[0];

    if (isNaN(amount)) return message.reply("Números são permitidos apenas");
    if (parseInt(amount) > 99) return message.reply("A quantidade máxima de mensagens que posso excluir é 99");

    const response = await purgeMessages(message.member, message.channel, "ALL", amount);

    if (typeof response === "number") {
      return sendMessage(message.channel, `Excluído com sucesso ${response} mensagens`, 5);
    } else if (response === "BOT_PERM") {
      return message.reply("Eu não tenho `Read Message History` & `Manage Messages` apagar mensagens");
    } else if (response === "MEMBER_PERM") {
      return message.reply("Você não tem `Read Message History` & `Manage Messages` apagar mensagens");
    } else if (response === "NO_MESSAGES") {
      return message.reply("Nenhuma mensagem encontrada que possa ser limpa");
    } else {
      return message.reply(`Ocorreu um erro! Falha ao excluir mensagens`);
    }
  }
};
