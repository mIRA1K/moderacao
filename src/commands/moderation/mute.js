const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { muteTarget } = require("@utils/modUtils");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class MuteCommand extends Command {
  constructor(client) {
    super(client, {
      name: "mute",
      description: "Silencia o membro especificado",
      category: "MODERATION",
      botPermissions: ["MANAGE_ROLES"],
      userPermissions: ["MUTE_MEMBERS"],
      command: {
        enabled: true,
        usage: "<@member> [reason]",
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
            description: "Razão para o silenciamento",
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
    const response = await mute(message.member, target, reason);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");
    const target = await interaction.guild.members.fetch(user.id);

    const response = await mute(interaction.member, target, reason);
    await interaction.followUp(response);
  }
};

async function mute(issuer, target, reason) {
  const response = await muteTarget(issuer, target, reason);
  if (typeof response === "boolean") return `${target.user.tag} agora está mutado!`;
  if (response === "BOT_PERM") return `Eu não tenho permissão para silenciar ${target.user.tag}`;
  else if (response === "MEMBER_PERM") return `Você não tem permissão para silenciar ${target.user.tag}`;
  else if (response === "ALREADY_MUTED") return `${target.user.tag} já está mudo neste servidor`;
  else if (response === "NO_MUTED_ROLE")
    return "Não há cargo Muted neste servidor. Crie o cargo `Muted` ou use `mutesetup` para criar automaticamente um";
  else if (response === "NO_MUTED_PERMISSION")
    return "Eu não tenho permissão para mover membros para `Muted` cargo. Essa função está abaixo da minha função mais alta?";
  else return `Failed to mute ${target.user.tag}`;
}
