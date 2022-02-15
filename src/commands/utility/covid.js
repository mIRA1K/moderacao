const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const timestampToDate = require("timestamp-to-date");

module.exports = class CovidCommand extends Command {
  constructor(client) {
    super(client, {
      name: "covid",
      description: "Obter estatísticas do Covid-19 para um país",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<country>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "country",
            description: "Nome do país para obter estatísticas do Covi-19 para",
            type: "STRING",
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
    const country = args.join(" ");
    const response = await getCovid(country);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const country = interaction.options.getString("country");
    const response = await getCovid(country);
    await interaction.followUp(response);
  }
};

async function getCovid(country) {
  const response = await getJson(`https://disease.sh/v2/countries/${country}`);

  if (response.status === 404) return "```css\nO país com o nome fornecido não foi encontrado```";
  if (!response.success) return MESSAGES.API_ERROR;
  const { data } = response;

  const mg = timestampToDate(data?.updated, "dd.MM.yyyy as HH:mm");
  const embed = new MessageEmbed()
    .setTitle(`Covid - ${data?.country}`)
    .setThumbnail(data?.countryInfo.flag)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .addField("Casos Totais", data?.cases.toString(), true)
    .addField("Casos Hoje", data?.todayCases.toString(), true)
    .addField("Total Mortes", data?.deaths.toString(), true)
    .addField("Mortes Hoje", data?.todayDeaths.toString(), true)
    .addField("Recuperados", data?.recovered.toString(), true)
    .addField("Ativos", data?.active.toString(), true)
    .addField("Estagio Critico", data?.critical.toString(), true)
    .addField("Casos Em 1 milhão", data?.casesPerOneMillion.toString(), true)
    .addField("Mortes Em 1 milhão", data?.deathsPerOneMillion.toString(), true)
    .setFooter(`Última atualização em ${mg}`);

  return { embeds: [embed] };
}
