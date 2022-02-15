const { Command } = require("@src/structures");
const { getRoleByName } = require("@utils/guildUtils");
const { Message, MessageEmbed, CommandInteraction } = require("discord.js");
const { EMBED_COLORS } = require("@root/config.js");
const { getSettings } = require("@schemas/Guild");
const { table } = require("table");

module.exports = class AutomodConfigCommand extends Command {
  constructor(client) {
    super(client, {
      name: "automodconfig",
      description: "Configurações da AutoModeração",
      category: "AUTOMOD",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "status",
            description: "Verifique a configuração do automod para este servidor",
          },
          {
            trigger: "strikes <number>",
            description: "Número máximo de avisos que um membro pode receber antes de realizar uma ação",
          },
          {
            trigger: "action <MUTE|KICK|BAN>",
            description: "Definir a ação a ser executada após receber o máximo de avisos",
          },
          {
            trigger: "debug <ON|OFF>",
            description: "Ativa o automod para mensagens enviadas por administradores e moderadores",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "status",
            description: "Verifique a configuração do automod",
            type: "SUB_COMMAND",
          },
          {
            name: "strikes",
            description: "Defina o número máximo de avisos antes de realizar uma ação",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Número de avisos (default 5)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "action",
            description: "Defina a ação a ser executada após receber o máximo de avisos",
            type: "SUB_COMMAND",
            options: [
              {
                name: "action",
                description: "Ação para realizar",
                type: "STRING",
                required: true,
                choices: [
                  {
                    name: "MUTE",
                    value: "MUTE",
                  },
                  {
                    name: "KICK",
                    value: "KICK",
                  },
                  {
                    name: "BAN",
                    value: "BAN",
                  },
                ],
              },
            ],
          },
          {
            name: "debug",
            description: "Ativar / desativar automod para mensagens enviadas por administradores e moderadores",
            type: "SUB_COMMAND",
            options: [
              {
                name: "status",
                description: "Status de configuração",
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
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const input = args[0].toLowerCase();
    const settings = await getSettings(message.guild);

    let response;
    if (input === "status") {
      response = await getStatus(settings, message.guild);
    }

    if (input === "strikes") {
      const strikes = args[1];
      if (isNaN(strikes) || Number.parseInt(strikes) < 1) {
        return message.reply("Os avisos devem ser um número válido maior que 0");
      }
      response = await setStrikes(settings, strikes);
    }

    if (input === "action") {
      const action = args[1].toUpperCase();
      if (!action || !["MUTE", "KICK", "BAN"].includes(action))
        return message.reply("Não é uma ação válida. A ação pode ser `Mute`/`Kick`/`Ban`");
      response = await setAction(settings, message.guild, action);
    }

    if (input === "debug") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await setDebug(settings, status);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild);

    let response;

    // status
    if (sub === "status") response = await getStatus(settings, interaction.guild);
    else if (sub === "strikes") response = await setStrikes(settings, interaction.options.getInteger("amount"));
    else if (sub === "action")
      response = await setAction(settings, interaction.guild, interaction.options.getString("action"));
    else if (sub === "debug") response = await setDebug(settings, interaction.options.getString("status"));

    await interaction.followUp(response);
  }
};

async function getStatus(settings, guild) {
  const { automod } = settings;
  const row = [];

  const logChannel = settings.modlog_channel
    ? guild.channels.cache.get(settings.modlog_channel).toString()
    : "Not Configured";

  row.push(["Max Linhas", automod.max_lines || "NA"]);
  row.push(["Max Menções", automod.max_mentions || "NA"]);
  row.push(["Max Roles Mentions", automod.max_role_mentions || "NA"]);
  row.push(["Anti-Links", automod.anti_links ? "✓" : "NA"]);
  row.push(["Anti-Invites", automod.anti_invites ? "✓" : "NA"]);
  row.push(["Anti-Scam", automod.anti_scam ? "✓" : "NA"]);
  row.push(["Anti-Ghost", automod.anti_ghostping ? "✓" : "NA"]);

  const asciiTable = table(row, {
    singleLine: true,
    header: {
      content: "Configuração AutoMod",
      alignment: "center",
    },
    columns: [
      {},
      {
        alignment: "center",
      },
    ],
  });

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription("```" + asciiTable + "```")
    .addField("Canal dos Logs", logChannel, true)
    .addField("Max Avisos", automod.strikes.toString(), true)
    .addField("Ação", automod.action, true);

  return { embeds: [embed] };
}

async function setStrikes(settings, strikes) {
  settings.automod.strikes = strikes;
  await settings.save();
  return `Configuração salva! O máximo de avisos está definido como ${strikes}`;
}

async function setAction(settings, guild, action) {
  if (action === "MUTE") {
    let mutedRole = getRoleByName(guild, "muted");
    if (!mutedRole) {
      return `O cargo Muted não existe neste servidor`;
    }

    if (!mutedRole.editable) {
      return "Eu não tenho permissão para mover membros para `Muted` cargo. Essa função está abaixo da minha função mais alta?";
    }
  }

  if (action === "KICK") {
    if (!guild.me.permissions.has("KICK_MEMBERS")) {
      return "Eu não tenho permissão para expulsar membros";
    }
  }

  if (action === "BAN") {
    if (!guild.me.permissions.has("BAN_MEMBERS")) {
      return "Eu não tenho permissão para banir membros";
    }
  }

  settings.automod.action = action;
  await settings.save();
  return `Configuration saved! Automod action is set to ${action}`;
}

async function setDebug(settings, input) {
  const status = input.toLowerCase() === "on" ? true : false;
  settings.automod.debug = status;
  await settings.save();
  return `Configuração salva! A depuração do Automod é agora ${status ? "enabled" : "disabled"}`;
}
