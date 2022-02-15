const { Command } = require("@src/structures");
const { getEffectiveInvites } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");
const { getSettings } = require("@schemas/Guild");

module.exports = class InvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "invites",
      description: "Mostra o número de convites neste servidor",
      category: "INVITE",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[@member|id]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "user",
            description: "O usuário receberá os convites para",
            type: "USER",
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
    const target = (await resolveMember(message, args[0])) || message.member;
    const response = await getInvites(message, target.user);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await getInvites(interaction, user);
    await interaction.followUp(response);
  }
};

async function getInvites({ guild }, user) {
  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return `O rastreamento de convites está desativado neste servidor`;

  const inviteData = (await getMember(guild.id, user.id)).invite_data;

  const embed = new MessageEmbed()
    .setAuthor(`Convites para ${user.username}`)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(user.displayAvatarURL())
    .setDescription(`${user.toString()} has ${getEffectiveInvites(inviteData)} convites`)
    .addField("Total Convites", `**${inviteData?.tracked + inviteData?.added || 0}**`, true)
    .addField("Fake Convites", `**${inviteData?.fake || 0}**`, true)
    .addField("Left Convites", `**${inviteData?.left || 0}**`, true);

  return { embeds: [embed] };
}
