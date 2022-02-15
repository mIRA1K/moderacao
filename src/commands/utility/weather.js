const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");

const API_KEY = process.env.WEATHERSTACK_KEY;

module.exports = class WeatherCommand extends Command {
  constructor(client) {
    super(client, {
      name: "weather",
      description: "Obter informações meteorológicas",
      cooldown: 5,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<place>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "place",
            description: "country/city nome para obter informações meteorológicas para",
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
    const place = args.join(" ");
    const response = await weather(place);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const place = interaction.options.getString("place");
    const response = await weather(place);
    await interaction.followUp(response);
  }
};

async function weather(place) {
  const response = await getJson(`http://api.weatherstack.com/current?access_key=${API_KEY}&query=${place}`);
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  if (!json.request) return `Nenhuma cidade encontrada correspondente \`${place}\``;

  const embed = new MessageEmbed()
    .setTitle("Clima")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.current?.weather_icons[0])
    .addField("Cidade", json.location?.name || "NA", true)
    .addField("Região", json.location?.region || "NA", true)
    .addField("Pais", json.location?.country || "NA", true)
    .addField("Condição do tempo", json.current?.weather_descriptions[0] || "NA", true)
    .addField("Data", json.location?.localtime.slice(0, 10) || "NA", true)
    .addField("Tempo", json.location?.localtime.slice(11, 16) || "NA", true)
    .addField("Temperatura", `${json.current?.temperature}°C`, true)
    .addField("Cloudcover", `${json.current?.cloudcover}%`, true)
    .addField("Vento", `${json.current?.wind_speed} km/h`, true)
    .addField("Direção do Vento", json.current?.wind_dir || "NA", true)
    .addField("Pressão", `${json.current?.pressure} mb`, true)
    .addField("Precipitação", `${json.current?.precip.toString()} mm`, true)
    .addField("Umidade", json.current?.humidity.toString() || "NA", true)
    .addField("Distância visual", `${json.current?.visibility} km`, true)
    .addField("UV", json.current?.uv_index.toString() || "NA", true)
    .setFooter(`Última verificação em ${json.current?.observation_time} GMT`);

  return { embeds: [embed] };
}
