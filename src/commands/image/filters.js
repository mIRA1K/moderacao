const { MessageEmbed, MessageAttachment, Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { getBuffer } = require("@utils/httpUtils");
const { getImageFromCommand, getFilter } = require("@utils/imageUtils");
const { EMBED_COLORS } = require("@root/config.js");

const availableFilters = ["blur", "burn", "gay", "greyscale", "invert", "pixelate", "sepia", "sharpen"];

module.exports = class Filters extends Command {
  constructor(client) {
    super(client, {
      name: "filter",
      description: "Adicionar filtro à imagem fornecida",
      cooldown: 5,
      category: "IMAGE",
      botPermissions: ["EMBED_LINKS", "ATTACH_FILES"],
      command: {
        enabled: true,
        aliases: availableFilters,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "name",
            description: "O tipo de filtro",
            type: "STRING",
            required: true,
            choices: availableFilters.map((filter) => ({ name: filter, value: filter })),
          },
          {
            name: "user",
            description: "O usuário a cujo avatar o filtro precisa ser aplicado",
            type: "USER",
            required: false,
          },
          {
            name: "link",
            description: "O link da imagem ao qual o filtro deve ser aplicado",
            type: "STRING",
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
  async messageRun(message, args, invoke) {
    const image = await getImageFromCommand(message, args);

    // use invoke as an endpoint
    const url = getFilter(invoke.toLowerCase(), image);
    const response = await getBuffer(url);

    if (!response.success) return message.reply("Falha ao gerar imagem");

    const attachment = new MessageAttachment(response.buffer, "attachment.png");
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage("attachment://attachment.png")
      .setFooter(`Pedido por: ${message.author.tag}`);

    await message.reply({ embeds: [embed], files: [attachment] });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const author = interaction.user;
    const user = interaction.options.getUser("user");
    const imageLink = interaction.options.getString("link");
    const filter = interaction.options.getString("name");

    let image;
    if (user) image = user.displayAvatarURL({ size: 256, format: "png" });
    if (!image && imageLink) image = imageLink;
    if (!image) image = author.displayAvatarURL({ size: 256, format: "png" });

    const url = getFilter(filter, image);
    const response = await getBuffer(url);

    if (!response.success) return interaction.followUp("Falha ao gerar imagem");

    const attachment = new MessageAttachment(response.buffer, "attachment.png");
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.TRANSPARENT)
      .setImage("attachment://attachment.png")
      .setFooter(`Pedido por: ${author.tag}`);

    await interaction.followUp({ embeds: [embed], files: [attachment] });
  }
};
