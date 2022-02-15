const { Command } = require("@src/structures");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { getSettings } = require("@schemas/Guild");
const { getTop100 } = require("@schemas/Member");

module.exports = class LeaderBoard extends Command {
  constructor(client) {
    super(client, {
      name: "leaderboard",
      description: "Exibir a tabela de classificação XP",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        aliases: ["lb"],
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
    const response = await getLeaderboard(message, message.author);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await getLeaderboard(interaction, interaction.user);
    await interaction.followUp(response);
  }
};

async function getLeaderboard({ guild }, author) {
  const settings = await getSettings(guild);
  if (!settings.ranking.enabled) return "A classificação está desativada neste servidor";

  const top100 = await getTop100(guild.id);
  if (top100.length === 0) return "Nenhum usuário na tabela de classificação";

  const lb = top100.splice(0, top100.length > 10 ? 9 : top100.length);
  let collector = "";
  for (let i = 0; i < lb.length; i++) {
    try {
      const user = await author.client.users.fetch(lb[i].member_id);
      collector += `**#${(i + 1).toString()}** - ${user.tag}\n`;
    } catch (ex) {
      // Ignore
    }
  }

  const embed = new MessageEmbed()
    .setAuthor("XP Entre os melhores")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(collector)
    .setFooter(`Pedido por ${author.tag}`);

  return { embeds: [embed] };
}
