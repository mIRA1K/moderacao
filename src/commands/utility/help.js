const { Command, CommandCategory, BotClient } = require("@src/structures");
const { EMBED_COLORS, SUPPORT_SERVER } = require("@root/config.js");
const {
  MessageEmbed,
  MessageActionRow,
  MessageSelectMenu,
  Message,
  MessageButton,
  CommandInteraction,
} = require("discord.js");

const CMDS_PER_PAGE = 5;
const IDLE_TIMEOUT = 20;

module.exports = class HelpCommand extends Command {
  constructor(client) {
    super(client, {
      name: "help",
      description: "Menu de Comandos do Bot",
      category: "UTILITY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "[command]",
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "command",
            description: "Menu de Comandos do Bot",
            required: false,
            type: "STRING",
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   * @param {string} invoke
   * @param {string} prefix
   */
  async messageRun(message, args, invoke, prefix) {
    let trigger = args[0];

    // !help
    if (!trigger) {
      const response = await getHelpMenu(message);
      const sentMsg = await message.reply(response);
      return waiter(sentMsg, message.author.id, prefix);
    }

    // check if command help (!help cat)
    const cmd = this.client.getCommand(trigger);
    if (cmd) return cmd.sendUsage(message.channel, prefix, trigger);

    // No matching command/category found
    message.reply("Nenhum comando correspondente encontrado");
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    let cmdName = interaction.options.getString("command");

    // !help
    if (!cmdName) {
      const response = await getHelpMenu(interaction);
      const sentMsg = await interaction.followUp(response);
      return waiter(sentMsg, interaction.user.id);
    }

    // check if command help (!help cat)
    const cmd = this.client.slashCommands.get(cmdName);
    if (cmd) {
      const embed = cmd.getSlashUsage();
      return interaction.followUp({ embeds: [embed] });
    }

    // No matching command/category found
    return interaction.followUp("Nenhum comando correspondente encontrado");
  }
};

/**
 * @param {CommandInteraction} interaction
 */
async function getHelpMenu({ client, guild }) {
  // Menu Row
  const options = [];
  const keys = Object.keys(CommandCategory);
  keys.forEach((key) => {
    const value = CommandCategory[key];
    const data = {
      label: value.name,
      value: value.name,
      description: `Ver os comandos da categoria ${value.name}`,
      emoji: value.emoji,
    };
    options.push(data);
  });

  const menuRow = new MessageActionRow().addComponents(
    new MessageSelectMenu().setCustomId("help-menu").setPlaceholder("Escolha a categoria de comando").addOptions(options)
  );

  // Buttons Row
  let components = [];
  components.push(
    new MessageButton().setCustomId("previousBtn").setEmoji("⬅️").setStyle("SECONDARY").setDisabled(true),
    new MessageButton().setCustomId("nextBtn").setEmoji("➡️").setStyle("SECONDARY").setDisabled(true)
  );

  let buttonsRow = new MessageActionRow().addComponents(components);

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(
      "**Sobre mim:**\n\n" +
        `Olá eu sou ${guild.me.displayName}!\n\n` +
        "Um bot de discord legal e **__multifuncional__** estou aqui para lhe ajudar! \n\n" +
        `**Me convide pro seu Servidor:** [[Clicando Aqui]](${client.getInvite()})\n` +
        `**Servidor de Jogos:** [[Entrar no Servidor]](${SUPPORT_SERVER})`
    );

  return {
    embeds: [embed],
    components: [menuRow, buttonsRow],
  };
}

/**
 * @param {Message} msg
 * @param {string} userId
 * @param {string} prefix
 */
const waiter = (msg, userId, prefix) => {
  const collector = msg.channel.createMessageComponentCollector({
    filter: (reactor) => reactor.user.id === userId,
    idle: IDLE_TIMEOUT * 1000,
    dispose: true,
  });

  let arrEmbeds = [];
  let currentPage = 0;
  let menuRow = msg.components[0];
  let buttonsRow = msg.components[1];

  collector.on("collect", async (response) => {
    await response.deferUpdate();

    switch (response.customId) {
      case "help-menu": {
        const cat = response.values[0].toUpperCase();
        arrEmbeds = prefix ? getMsgCategoryEmbeds(msg.client, cat, prefix) : getSlashCategoryEmbeds(msg.client, cat);
        currentPage = 0;
        buttonsRow.components.forEach((button) => button.setDisabled(arrEmbeds.length > 1 ? false : true));
        await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] });
        break;
      }

      case "previousBtn":
        if (currentPage !== 0) {
          --currentPage;
          await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] });
        }
        break;

      case "nextBtn":
        if (currentPage < arrEmbeds.length - 1) {
          currentPage++;
          await msg.edit({ embeds: [arrEmbeds[currentPage]], components: [menuRow, buttonsRow] });
        }
        break;
    }
  });

  collector.on("end", () => {
    return msg.edit({ components: [] });
  });
};

/**
 * Returns an array of message embeds for a particular command category [SLASH COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 */
function getSlashCategoryEmbeds(client, category) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.slashCommands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) => (collector += `\`/${cmd.name}\`\n ❯ ${cmd.description}\n\n`));

    const availableFilters = client.slashCommands
      .get("filter")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    const availableGens = client.slashCommands
      .get("generator")
      .slashCommand.options[0].choices.map((ch) => ch.name)
      .join(", ");

    collector +=
      "**Filtros Disponíveis:**\n" + `${availableFilters}` + `*\n\n**Geradores Disponíveis**\n` + `${availableGens}`;

    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Comandos`)
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = Array.from(client.slashCommands.filter((cmd) => cmd.category === category).values());

  if (commands.length === 0) {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Commands`)
      .setDescription("Nenhum comando nesta categoria");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);

    toAdd = toAdd.map((cmd) => {
      const subCmds = cmd.slashCommand.options.filter((opt) => opt.type === "SUB_COMMAND");
      const subCmdsString = subCmds.map((s) => s.name).join(", ");

      return `\`/${cmd.name}\`\n ❯ **Descrição**: ${cmd.description}\n ${
        subCmds == 0 ? "" : `❯ **Subcomandos [${subCmds.length}]**: ${subCmdsString}\n`
      } `;
    });

    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Comandos`)
      .setDescription(item.join("\n"))
      .setFooter(`Página ${index + 1} dê ${arrSplitted.length}`);
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}

/**
 * Returns an array of message embeds for a particular command category [MESSAGE COMMANDS]
 * @param {BotClient} client
 * @param {string} category
 * @param {string} prefix
 */
function getMsgCategoryEmbeds(client, category, prefix) {
  let collector = "";

  // For IMAGE Category
  if (category === "IMAGE") {
    client.commands
      .filter((cmd) => cmd.category === category)
      .forEach((cmd) =>
        cmd.command.aliases.forEach((alias) => {
          collector += `\`${alias}\`, `;
        })
      );

    collector +=
      "\n\nVocê pode usar esses comandos de imagem nos seguintes formatos\n" +
      `**${prefix}cmd:** Escolhe o avatar do autor da mensagem como imagem\n` +
      `**${prefix}cmd <@member>:** Escolhe o avatar dos membros mencionados como imagem\n` +
      `**${prefix}cmd <url>:** Escolhe a imagem do URL fornecido\n` +
      `**${prefix}cmd [attachment]:** Imagem do anexo de escolha`;

    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Comandos`)
      .setDescription(collector);

    return [embed];
  }

  // For REMAINING Categories
  const commands = client.commands.filter((cmd) => cmd.category === category);

  if (commands.length === 0) {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Commands`)
      .setDescription("Nenhum comando nesta categoria");

    return [embed];
  }

  const arrSplitted = [];
  const arrEmbeds = [];

  while (commands.length) {
    let toAdd = commands.splice(0, commands.length > CMDS_PER_PAGE ? CMDS_PER_PAGE : commands.length);
    toAdd = toAdd.map((cmd) => `\`${prefix}${cmd.name}\`\n ❯ ${cmd.description}\n`);
    arrSplitted.push(toAdd);
  }

  arrSplitted.forEach((item, index) => {
    const embed = new MessageEmbed()
      .setColor(EMBED_COLORS.BOT_EMBED)
      .setThumbnail(CommandCategory[category].image)
      .setAuthor(`${category} Comandos`)
      .setDescription(item.join("\n"))
      .setFooter(
        `Página ${index + 1} dê ${arrSplitted.length} | Use ${prefix}help <command> para mais informações de comando`
      );
    arrEmbeds.push(embed);
  });

  return arrEmbeds;
}
