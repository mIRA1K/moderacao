const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { unmuteTarget } = require("@utils/modUtils");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class UnmuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "unmute",
      description: "Desmuta o membro especificado",
      botPermissions: ["MANAGE_ROLES"],
      userPermissions: ["MUTE_MEMBERS"],
      category: "MODERATION",
      command: {
        enabled: true,
        usage: "<@member> [reason]",
        minArgsCount: 1,
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
    const response = await unmute(message.member, target, reason);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await unmute(interaction.member, target, reason);
    await interaction.followUp(response);
  }
};

async function unmute(issuer, target, reason) {
  const response = await unmuteTarget(issuer, target, reason);
  if (typeof response === "boolean") return `${target.user.tag} foi desmutado!`;
  if (response === "BOT_PERM") return `Eu não tenho permissão para desmutar ${target.user.tag}`;
  else if (response === "MEMBER_PERM") return `Você não tem permissão para desmutar ${target.user.tag}`;
  else if (response === "NOT_MUTED") return `${target.user.tag} não está silenciado neste servidor`;
  else return `Falha ao desmutar ${target.user.tag}`;
}
