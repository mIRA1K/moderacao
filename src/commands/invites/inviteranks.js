const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { getSettings } = require("@schemas/Guild");
const { EMBED_COLORS } = require("@root/config");

module.exports = class InviteRanks extends Command {
  constructor(client) {
    super(client, {
      name: "inviteranks",
      description: "Mostra as classificações de convite configuradas neste servidor",
      category: "INVITE",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
      },
      slashCommand: {
        enabled: true,
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const response = await getInviteRanks(message);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await getInviteRanks(interaction);
    await interaction.followUp(response);
  }
};

async function getInviteRanks({ guild }) {
  const settings = await getSettings(guild);

  if (settings.invite.ranks.length === 0) return "Nenhuma classificação de convite configurada neste servidor";
  let str = "";

  settings.invite.ranks.forEach((data) => {
    const roleName = guild.roles.cache.get(data._id)?.toString();
    if (roleName) {
      str += `❯ ${roleName}: ${data.invites} convites\n`;
    }
  });

  const embed = new MessageEmbed().setAuthor("Invite Ranks").setColor(EMBED_COLORS.BOT_EMBED).setDescription(str);
  return { embeds: [embed] };
}
