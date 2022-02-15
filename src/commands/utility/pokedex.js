const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { MESSAGES, EMBED_COLORS } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const outdent = require("outdent");

module.exports = class Pokedex extends Command {
  constructor(client) {
    super(client, {
      name: "pokedex",
      description: "Mostra informações do Pokémon",
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      cooldown: 5,
      command: {
        enabled: true,
        usage: "<pokemon>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "pokemon",
            description: "Nome do Pokémon para obter informações sobre",
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
    const pokemon = args.join(" ");
    const response = await pokedex(pokemon);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const pokemon = interaction.options.getString("pokemon");
    const response = await pokedex(pokemon);
    await interaction.followUp(response);
  }
};

async function pokedex(pokemon) {
  const response = await getJson(`https://pokeapi.glitch.me/v1/pokemon/${pokemon}`);
  if (response.status === 404) return "```O Pokémon fornecido não foi encontrado```";
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data[0];

  const embed = new MessageEmbed()
    .setTitle(`Pokédex - ${json.name}`)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(json.sprite)
    .setDescription(
      outdent`
            ♢ **ID**: ${json.number}
            ♢ **Nome**: ${json.name}
            ♢ **Espécies**: ${json.species}
            ♢ **Tipo(s)**: ${json.types}
            ♢ **Habilidades(normal)**: ${json.abilities.normal}
            ♢ **Habilidades(escondidas)**: ${json.abilities.hidden}
            ♢ **Grupo de ovo(s)**: ${json.eggGroups}
            ♢ **Gênero**: ${json.gender}
            ♢ **Altura**: ${json.height} pé de altura
            ♢ **Peso**: ${json.weight}
            ♢ **Estágio de evolução atual**: ${json.family.evolutionStage}
            ♢ **Linha de Evolução**: ${json.family.evolutionLine}
            ♢ **É o Starter?**: ${json.starter}
            ♢ **É lendário?**: ${json.legendary}
            ♢ **É mítico?**: ${json.mythical}
            ♢ **É Geração?**: ${json.gen}
            `
    )
    .setFooter(json.description);

  return { embeds: [embed] };
}
