const { Command } = require("@src/structures");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");
const { getRoleByName } = require("@utils/guildUtils");

module.exports = class MaxWarn extends Command {
  constructor(client) {
    super(client, {
      name: "maxwarn",
      description: "Definir configuração máxima de avisos",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "limit <number>",
            description: "Definir o máximo de avisos que um membro pode receber antes de realizar uma ação",
          },
          {
            trigger: "action <mute|kick|ban>",
            description: "Defina a ação a ser executada após receber o máximo de avisos",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "limit",
            description: "Definir o máximo de avisos que um membro pode receber antes de realizar uma ação",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Número máximo de avisos",
                type: "INTEGER",
                required: true,
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
    if (!["limit", "action"].includes(input)) return message.reply("Uso de comando inválido");

    let response;
    if (input === "limit") {
      const max = parseInt(args[1]);
      if (isNaN(max) || max < 1) return message.reply("Máximo de avisos deve ser um número válido maior que 0");
      response = await setLimit(message.guild, max);
    }

    if (input === "action") {
      const action = args[1]?.toUpperCase();
      if (!action || !["MUTE", "KICK", "BAN"].includes(action))
        return message.reply("Não é uma ação válida. A ação pode ser `Mute`/`Kick`/`Ban`");
      response = await setAction(message.guild, action);
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();

    let response;
    if (sub === "limit") {
      response = await setLimit(interaction.guild, interaction.options.getInteger("amount"));
    }

    if (sub === "action") {
      response = await setAction(interaction.guild, interaction.options.getString("action"));
    }

    await interaction.followUp(response);
  }
};

async function setLimit(guild, limit) {
  const settings = await getSettings(guild);
  settings.max_warn.limit = limit;
  await settings.save();
  return `Configuração salva! O máximo de avisos está definido para ${limit}`;
}

async function setAction(guild, action) {
  if (action === "MUTE") {
    let mutedRole = getRoleByName(guild, "muted");
    if (!mutedRole) {
      return `O cargo muted não existe nesse servidor`;
    }

    if (!mutedRole.editable) {
      return "Não tenho permissão para mover membros para o cargo `muted`. Esse cargo está abaixo da minha função mais alta?";
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

  const settings = await getSettings(guild);
  settings.max_warn.action = action;
  await settings.save();
  return `Configuração salva! A ação do Automod está definida para ${action}`;
}
