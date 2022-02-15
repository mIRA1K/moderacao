const { Command } = require("@src/structures");
const { getEffectiveInvites, checkInviteRewards } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");

module.exports = class AddInvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "addinvites",
      description: "Adicionar convites para um membro",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<@member|id> <invites>",
        minArgsCount: 2,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "user",
            description: "O usuário para dar convites para",
            type: "USER",
            required: true,
          },
          {
            name: "invites",
            description: "O número de convites para dar",
            type: "INTEGER",
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
    const amount = parseInt(args[1]);

    if (!target) return message.reply("Sintaxe incorreta. Você deve mencionar um alvo");
    if (isNaN(amount)) return message.reply("O valor do convite deve ser um número");

    const response = await addInvites(message, target.user, parseInt(amount));
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("invites");
    const response = await addInvites(interaction, user, amount);
    await interaction.followUp(response);
  }
};

async function addInvites({ guild }, user, amount) {
  if (user.bot) return "Oops! Você não pode adicionar convites para bots";

  const memberDb = await getMember(guild.id, user.id);
  memberDb.invite_data.added += amount;
  await memberDb.save();

  const embed = new MessageEmbed()
    .setAuthor(`Adicionou convites para ${user.username}`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${user.tag} now has ${getEffectiveInvites(memberDb.invite_data)} invites`);

  checkInviteRewards(guild, memberDb, true);
  return { embeds: [embed] };
}
