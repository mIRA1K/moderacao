const { Command } = require("@src/structures");
const { resolveMember } = require("@utils/guildUtils");
const { Message, CommandInteraction } = require("discord.js");
const { getMember } = require("@schemas/Member");

module.exports = class ResetInvites extends Command {
  constructor(client) {
    super(client, {
      name: "resetinvites",
      description: "Limpar convites adicionados por usuários",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<@member>",
        aliases: ["clearinvites"],
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "user",
            description: "O usuário limpará convites para",
            type: "USER",
            required: true,
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
    if (!target) return message.reply("Sintaxe incorreta. Você deve mencionar um alvo");
    const response = await clearInvites(message, target.user);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const response = await clearInvites(interaction, user);
    await interaction.followUp(response);
  }
};

async function clearInvites({ guild }, user) {
  const memberDb = await getMember(guild.id, user.id);
  memberDb.invite_data.added = 0;
  await memberDb.save();
  return `Feito! Convites cancelados para \`${user.tag}\``;
}
