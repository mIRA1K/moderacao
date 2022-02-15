const { Command } = require("@src/structures");
const { MessageEmbed, MessageButton, MessageActionRow, CommandInteraction } = require("discord.js");
const { timeformat } = require("@utils/miscUtils");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config.js");
const botstats = require("./shared/botstats");

module.exports = class BotCommand extends Command {
  constructor(client) {
    super(client, {
      name: "bot",
      description: "Comandos relacionados a o bot",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: false,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "invite",
            description: "Obter convite de bot",
            type: "SUB_COMMAND",
          },
          {
            name: "stats",
            description: "Obter estatísticas do bot",
            type: "SUB_COMMAND",
          },
          {
            name: "uptime",
            description: "Obter tempo de atividade do bot",
            type: "SUB_COMMAND",
          },
        ],
      },
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    if (!sub) return interaction.followUp("Não é um subcomando válido");

    // Invite
    if (sub === "invite") {
      const response = botInvite(interaction.client);
      try {
        await interaction.user.send(response);
        return interaction.followUp("Verifique sua DM para obter minhas informações! :envelope_with_arrow:");
      } catch (ex) {
        return interaction.followUp("Eu não posso te enviar minhas informações! A sua DM está aberto??");
      }
    }

    // Stats
    else if (sub === "stats") {
      const response = botstats(interaction.client);
      return interaction.followUp(response);
    }

    // Uptime
    else if (sub === "uptime") {
      await interaction.followUp(`My Uptime: \`${timeformat(process.uptime())}\``);
    }
  }
};

function botInvite(client) {
  const embed = new MessageEmbed()
    .setAuthor("Convite do Bot 🥰")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("Ei! Obrigado por considerar a possibilidade de me convidar \nUse o botão abaixo para navegar para onde quiser");

  // Buttons
  let components = [];
  components.push(new MessageButton().setLabel("Convite Link").setURL(client.getInvite()).setStyle("LINK"));

  if (SUPPORT_SERVER) {
    components.push(new MessageButton().setLabel("Servidor Link").setURL(SUPPORT_SERVER).setStyle("LINK"));
  }

  if (DASHBOARD.enabled) {
    components.push(new MessageButton().setLabel("Painel de Controle").setURL(DASHBOARD.baseURL).setStyle("LINK"));
  }

  let buttonsRow = new MessageActionRow().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
}
