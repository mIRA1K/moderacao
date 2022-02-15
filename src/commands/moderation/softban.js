const { resolveMember } = require("@root/src/utils/guildUtils");
const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { softbanTarget } = require("@utils/modUtils");

module.exports = class SoftBan extends Command {
  constructor(client) {
    super(client, {
      name: "softban",
      description: "Softban o membro especificado. Expulsa e apaga mensagens",
      category: "MODERATION",
      botPermissions: ["BAN_MEMBERS"],
      userPermissions: ["KICK_MEMBERS"],
      command: {
        enabled: true,
        usage: "<ID|@member> [reason]",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "user",
            description: "O membro alvo",
            type: "USER",
            required: true,
          },
          {
            name: "reason",
            description: "Razão para o softban",
            type: "STRING",
            required: false,
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
    const target = await resolveMember(message, args[0], true);
    if (!target) return message.reply(`Nenhum usuário encontrado correspondente ${args[0]}`);
    const reason = message.content.split(args[0])[1].trim();
    const response = await softban(message.member, target, reason);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await softban(interaction.member, target, reason);
    await interaction.followUp(response);
  }
};

async function softban(issuer, target, reason) {
  const response = await softbanTarget(issuer, target, reason);
  if (typeof response === "boolean") return `${target.user.tag} foi banido por software!`;
  if (response === "BOT_PERM") return `Eu não tenho permissão para softban ${target.user.tag}`;
  else if (response === "MEMBER_PERM") return `Você não tem permissão para softban ${target.user.tag}`;
  else return `Falha ao softban ${target.user.tag}`;
}
