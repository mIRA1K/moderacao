const { Message } = require("discord.js");
const { Command } = require("@src/structures");
const { purgeMessages } = require("@utils/modUtils");
const { sendMessage } = require("@utils/botUtils");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class PurgeUser extends Command {
  constructor(client) {
    super(client, {
      name: "purgeuser",
      description: "Exclui a quantidade especificada de mensagens",
      category: "MODERATION",
      userPermissions: ["MANAGE_MESSAGES"],
      botPermissions: ["MANAGE_MESSAGES", "READ_MESSAGE_HISTORY"],
      command: {
        enabled: true,
        usage: "<@user|ID> [amount]",
        aliases: ["purgeusers"],
        minArgsCount: 1,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const target = await resolveMember(message, args[0]);
    if (!target) return message.reply(`No users found matching ${args[0]}`);
    const amount = (args.length > 1 && args[1]) || 99;

    if (amount) {
      if (isNaN(amount)) return message.reply("Números são permitidos apenas");
      if (parseInt(amount) > 100) return message.reply("A quantidade máxima de mensagens que posso excluir é 100");
    }

    const response = await purgeMessages(message.member, message.channel, "USER", amount, target);

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
