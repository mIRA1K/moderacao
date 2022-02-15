const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { MESSAGES } = require("@root/config.js");
const { getJson } = require("@utils/httpUtils");
const outdent = require("outdent");

module.exports = class GithubCommand extends Command {
  constructor(client) {
    super(client, {
      name: "github",
      description: "Mostra estatísticas do github de um usuário",
      cooldown: 10,
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        aliases: ["git"],
        usage: "<username>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "username",
            description: "Nome de usuário do github",
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
    const username = args.join(" ");
    const response = await getGithubUser(username, message.author);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const username = interaction.options.getString("username");
    const response = await getGithubUser(username, interaction.user);
    await interaction.followUp(response);
  }
};

const websiteProvided = (text) => (text.startsWith("http://") ? true : text.startsWith("https://"));

async function getGithubUser(target, author) {
  const response = await getJson(`https://api.github.com/users/${target}`);
  if (response.status === 404) return "```Nenhum usuário encontrado com esse nome```";
  if (!response.success) return MESSAGES.API_ERROR;

  const json = response.data;
  const {
    login: username,
    name,
    id: githubId,
    avatar_url: avatarUrl,
    html_url: userPageLink,
    followers,
    following,
    bio,
    location,
    blog,
  } = json;

  let website = websiteProvided(blog) ? `[Click Aqui](${blog})` : "Not Provided";
  if (website == null) website = "Not Provided";

  const embed = new MessageEmbed()
    .setAuthor(`Usuário GitHub: ${username}`, avatarUrl, userPageLink)
    .addField(
      "Informação de usuário",
      outdent`**Nome real**: *${name || "Not Provided"}*
        **Localização**: *${location}*
        **GitHub ID**: *${githubId}*
        **Website**: *${website}*\n`,
      true
    )
    .addField("Estatísticas Sociais", `**Seguidores**: *${followers}*\n**Seguindo**: *${following}*`, true)
    .setDescription(`**Bio**:\n${bio || "Not Provided"}`)
    .setImage(avatarUrl)
    .setColor(0x6e5494)
    .setFooter(`Pedido por ${author.tag}`);

  return { embeds: [embed] };
}
