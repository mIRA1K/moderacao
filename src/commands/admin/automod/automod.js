const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

module.exports = class Automod extends Command {
  constructor(client) {
    super(client, {
      name: "automod",
      description: "Várias configurações de AutoModeração",
      category: "AUTOMOD",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "antighostping <ON|OFF>",
            description: "Registra menções fantasmas em seu servidor",
          },
          {
            trigger: "antiinvites <ON|OFF>",
            description: "Permitir ou proibir o envio de convites de outros discord na mensagem",
          },
          {
            trigger: "antilinks <ON|OFF>",
            description: "Permitir ou proibir o envio de links na mensagem",
          },
          {
            trigger: "antiscam <ON|OFF>",
            description: "Ativar ou desativar detecção antiscam",
          },
          {
            trigger: "maxlines <number>",
            description: "Define o máximo de linhas permitidas por mensagem [0 to disable]",
          },
          {
            trigger: "maxmentions <number>",
            description: "Define o máximo de menções de membros permitidas por mensagem [0 to disable]",
          },
          {
            trigger: "maxrolementions <number>",
            description: "Define o máximo de menções de cargos permitidas por mensagem [0 to disable]",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "antighostping",
            description: "Registra menções fantasmas em seu servidor",
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
          {
            name: "antiinvites",
            description: "Permitir ou proibir o envio de convites de outros discord na mensagem",
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
          {
            name: "antilinks",
            description: "Permitir ou proibir o envio de links na mensagem",
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
          {
            name: "antiscam",
            description: "Ativar ou desativar detecção antiscam",
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
          {
            name: "maxlines",
            description: "Define o máximo de linhas permitidas por mensagem",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Configuração de Quantidade (0 to disable)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "maxmentions",
            description: "Define o máximo de menções do usuário permitidas por mensagem",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Configuração de Quantidade (0 to disable)",
                required: true,
                type: "INTEGER",
              },
            ],
          },
          {
            name: "maxrolementions",
            description: "Define o máximo de menções de cargos permitidas por mensagem",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Configuração de Quantidade (0 to disable)",
                required: true,
                type: "INTEGER",
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
    const settings = await getSettings(message.guild);
    const sub = args[0].toLowerCase();

    let response;
    if (sub == "antighostping") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await antighostPing(settings, status);
    }

    //
    else if (sub === "antiinvites") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await antiInvites(settings, status);
    }

    //
    else if (sub == "antilinks") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await antilinks(settings, status);
    }

    //
    else if (sub == "antiscam") {
      const status = args[1].toLowerCase();
      if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");
      response = await antiScam(settings, status);
    }

    //
    else if (sub === "maxlines") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Máximo de linhas deve ser um número válido maior que 0");
      }
      response = await maxLines(settings, max);
    }

    //
    else if (sub === "maxmentions") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Máximo de menções deve ser um número válido maior que 0");
      }
      response = await maxMentions(settings, max);
    }

    //
    else if (sub === "maxrolementions") {
      const max = args[1];
      if (isNaN(max) || Number.parseInt(max) < 1) {
        return message.reply("Máximo de menções de cargos deve ser um número válido maior que 0");
      }
      response = await maxRoleMentions(settings, max);
    }

    //
    else response = "Uso de comando inválido!";

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    const settings = await getSettings(interaction.guild);

    let response;
    if (sub == "antighostping") response = await antighostPing(settings, interaction.options.getString("status"));
    else if (sub === "antiinvites") response = await antiInvites(settings, interaction.options.getString("status"));
    else if (sub == "antilinks") response = await antilinks(settings, interaction.options.getString("status"));
    else if (sub == "antiscam") response = await antiScam(settings, interaction.options.getString("status"));
    else if (sub === "maxlines") response = await maxLines(settings, interaction.options.getInteger("amount"));
    else if (sub === "maxmentions") response = await maxMentions(settings, interaction.options.getInteger("amount"));
    else if (sub === "maxrolementions") {
      response = await maxRoleMentions(settings, interaction.options.getInteger("amount"));
    }

    await interaction.followUp(response);
  }
};

async function antighostPing(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_ghostping = status;
  await settings.save();
  return `Configuração salva! Antighost ping é agora ${status ? "enabled" : "disabled"}`;
}

async function antiInvites(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_invites = status;
  await settings.save();
  return `Mensagens ${
    status ? "com convites para servidores de discord serão automaticamente excluídos" : "Não será filtrado para banir convites de Discord agora"
  }`;
}

async function antilinks(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_links = status;
  await settings.save();
  return `Mensagens ${status ? "com links agora serão automaticamente excluídos" : "Não será filtrado para links agora"}`;
}

async function antiScam(settings, input) {
  const status = input.toUpperCase() === "ON" ? true : false;
  settings.automod.anti_scam = status;
  await settings.save();
  return `A detecção do Antiscam é agora ${status ? "enabled" : "disabled"}`;
}

async function maxLines(settings, input) {
  const lines = Number.parseInt(input);
  if (isNaN(lines)) return "Por favor, insira um número válido";

  settings.automod.max_lines = lines;
  await settings.save();
  return `${
    input === 0
      ? "O limite máximo de linha está desativado"
      : `Mensagens mais longas que \`${input}\` linhas agora serão excluídas automaticamente`
  }`;
}

async function maxMentions(settings, input) {
  const mentions = Number.parseInt(input);
  if (isNaN(mentions)) return "Por favor, insira um número válido";

  settings.automod.max_mentions = mentions;
  await settings.save();
  return `${
    input === 0
      ? "O limite máximo de menções do usuário está desativado"
      : `Mensagens com mais de \`${input}\` menções do usuário agora serão excluídas automaticamente`
  }`;
}

async function maxRoleMentions(settings, input) {
  const mentions = Number.parseInt(input);
  if (isNaN(mentions)) return "Por favor, insira um número válido";

  settings.automod.max_role_mentions = mentions;
  await settings.save();
  return `${
    input === 0
      ? "Maximum role mentions limit is disabled"
      : `Mensagens com mais de \`${input}\` menções de função agora serão automaticamente excluídas`
  }`;
}
