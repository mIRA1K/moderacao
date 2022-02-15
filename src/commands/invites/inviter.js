const { Command } = require("@src/structures");
const { getEffectiveInvites } = require("@src/handlers/invite");
const { EMBED_COLORS } = require("@root/config.js");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const outdent = require("outdent");
const { resolveMember } = require("@utils/guildUtils");
const { getMember } = require("@schemas/Member");
const { getSettings } = require("@schemas/Guild");

module.exports = class InviterCommand extends Command {
  constructor(client) {
    super(client, {
      name: "inviter",
      description: "Mostra informações do autor do convite",
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
            description: "O usuário obterá as informações do autor do convite para",
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
    const response = await getInviter(message, target.user);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const user = interaction.options.getUser("user") || interaction.user;
    const response = await getInviter(interaction, user);
    await interaction.followUp(response);
  }
};

async function getInviter({ guild }, user) {
  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return `O rastreamento de convites está desativado neste servidor`;

  const inviteData = (await getMember(guild.id, user.id)).invite_data;
  if (!inviteData || !inviteData.inviter) return `Não é possível rastrear como \`${user.tag}\` joined`;

  const inviter = await guild.client.users.fetch(inviteData.inviter, false, true);
  const inviterData = (await getMember(guild.id, inviteData.inviter)).invite_data;

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor(`Dados do convite do user ${user.username}`)
    .setDescription(
      outdent`
      Inviter: \`${inviter?.tag || "Deleted User"}\`
      Inviter ID: \`${inviteData.inviter}\`
      Invite Code: \`${inviteData.code}\`
      Inviter Invites: \`${getEffectiveInvites(inviterData)}\`
      `
    );

  return { embeds: [embed] };
}
