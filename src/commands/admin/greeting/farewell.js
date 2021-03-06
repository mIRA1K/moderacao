const { Command } = require("@src/structures");
const { isHex } = require("@utils/miscUtils");
const { buildGreeting } = require("@src/handlers/greeting");
const { Message, CommandInteraction } = require("discord.js");
const { canSendEmbeds } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");
const { sendMessage } = require("@utils/botUtils");

module.exports = class Farewell extends Command {
  constructor(client) {
    super(client, {
      name: "farewell",
      description: "Configurar mensagem de despedida",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "status <on|off>",
            description: "Habilitar ou desabilitar mensagem de despedida",
          },
          {
            trigger: "channel <#channel>",
            description: "Configurar mensagem de despedida",
          },
          {
            trigger: "preview",
            description: "Visualizar a mensagem de despedida configurada",
          },
          {
            trigger: "desc <text>",
            description: "Definir descrição da Embed",
          },
          {
            trigger: "thumbnail <ON|OFF>",
            description: "Enable/disable embed thumbnail",
          },
          {
            trigger: "color <hexcolor>",
            description: "Definir cor da Embed",
          },
          {
            trigger: "footer <text>",
            description: "Definir conteúdo do rodapé da Embed",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "status",
            description: "Habilitar ou desabilitar mensagem de despedida",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "ATIVAR ou DESATIVAR",
                required: true,
                type: "STRING",
                choices: [
                  {
                    name: "ON",
                    value: "ON",
                  },
                  {
                    name: "OFF",
                    value: "OFF",
                  },
                ],
              },
            ],
          },
          {
            name: "preview",
            description: "Visualizar a mensagem de despedida configurada",
            type: "SUB_COMMAND",
          },
          {
            name: "channel",
            description: "Definir canal de despedida",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Nome do Canal",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
            ],
          },
          {
            name: "desc",
            description: "definir descrição da Embed",
            type: "SUB_COMMAND",
            options: [
              {
                name: "content",
                description: "Conteúdo da descrição",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "thumbnail",
            description: "configure embed thumbnail",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "thumbnail status",
                type: "STRING",
                required: true,
                choices: [
                  {
                    name: "ON",
                    value: "ON",
                  },
                  {
                    name: "OFF",
                    value: "OFF",
                  },
                ],
              },
            ],
          },
          {
            name: "color",
            description: "set embed color",
            type: "SUB_COMMAND",
            options: [
              {
                name: "hex-code",
                description: "hex color code",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "footer",
            description: "set embed footer",
            type: "SUB_COMMAND",
            options: [
              {
                name: "content",
                description: "footer content",
                type: "STRING",
                required: true,
              },
            ],
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
    const type = args[0].toLowerCase();
    const settings = await getSettings(message.guild);
    let response;

    // preview
    if (type === "preview") {
      response = await sendPreview(settings, message.member);
    }

    // status
    if (type === "status") {
      const status = args[1].toLowerCase();
      if (!status || !["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await setStatus(settings, status);
    }

    // channel
    else if (type === "channel") {
      const channel = message.mentions.channels.first();
      response = await setChannel(settings, channel);
    }

    // desc
    if (type === "desc") {
      if (args.length < 2) return message.reply("Argumentos insuficientes! Forneça conteúdo válido");
      const desc = args.slice(1).join(" ");
      response = await setDescription(settings, desc);
    }

    // thumbnail
    if (type === "thumbnail") {
      const status = args[1].toLowerCase();
      if (!status || !["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await setThumbnail(message, status);
    }

    // color
    if (type === "color") {
      const color = args[1];
      if (!color || !isHex(color)) return message.reply("Cor inválida. O valor deve ser uma cor hexadecimal válida");
      response = await setColor(settings, color);
    }

    // footer
    if (type === "footer") {
      if (args.length < 2) return message.reply("Argumentos insuficientes! Forneça conteúdo válido");
      const content = args.slice(1).join(" ");
      response = await setFooter(message, content);
    }

    return message.reply(response);
  }

  /**
   *
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild);

    let response;
    switch (sub) {
      case "preview":
        response = await sendPreview(settings, interaction.member);
        break;

      case "status":
        response = await setStatus(settings, interaction.options.getString("status"));
        break;

      case "channel":
        response = await setChannel(settings, interaction.options.getChannel("channel"));
        break;

      case "desc":
        response = await setDescription(settings, interaction.options.getString("content"));
        break;

      case "thumbnail":
        response = await setThumbnail(settings, interaction.options.getString("status"));
        break;

      case "color":
        response = await setColor(settings, interaction.options.getString("color"));
        break;

      case "footer":
        response = await setFooter(settings, interaction.options.getString("content"));
        break;

      default:
        response = "Subcomando inválido";
    }

    return interaction.followUp(response);
  }
};

async function sendPreview(settings, member) {
  if (!settings.farewell?.enabled) return "Mensagem de despedida não habilitada neste servidor";

  const targetChannel = member.guild.channels.cache.get(settings.farewell.channel);
  if (!targetChannel) return "Nenhum canal está configurado para enviar mensagem de despedida";

  const response = await buildGreeting(member, "FAREWELL", settings.farewell);
  await sendMessage(targetChannel, response);

  return `Sent farewell preview to ${targetChannel.toString()}`;
}

async function setStatus(settings, status) {
  const enabled = status.toUpperCase() === "ON" ? true : false;
  settings.farewell.enabled = enabled;
  await settings.save();
  return `Configuração salva! Mensagem de despedida ${status ? "enabled" : "disabled"}`;
}

async function setChannel(settings, channel) {
  if (!canSendEmbeds(channel)) {
    return (
      "Ugh! Não consigo enviar saiu a esse canal? Eu preciso das permissões `Write Messages` e` Embed Links` em " +
      channel.toString()
    );
  }
  settings.farewell.channel = channel.id;
  await settings.save();
  return `Configuração salva! Mensagem de despedida será enviada para ${channel ? channel.toString() : "Não encontrado"}`;
}

async function setDescription(settings, desc) {
  settings.farewell.embed.description = desc;
  await settings.save();
  return "Configuração salva! Mensagem de despedida atualizada";
}

async function setThumbnail(settings, status) {
  settings.farewell.embed.thumbnail = status.toUpperCase() === "ON" ? true : false;

  settings.farewell.embed.thumbnail = null;
  await settings.save();

  return "Configuração salva! Mensagem de despedida atualizada";
}

async function setColor(settings, color) {
  settings.farewell.embed.color = color;
  await settings.save();
  return "Configuração salva! Mensagem de despedida atualizada";
}

async function setFooter(settings, content) {
  settings.farewell.embed.footer = content;
  await settings.save();
  return "Configuração salva! Mensagem de despedida atualizada";
}
