const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { memberInteract } = require("@utils/modUtils");
const { resolveMember } = require("@utils/guildUtils");

module.exports = class NickCommand extends Command {
  constructor(client) {
    super(client, {
      name: "nick",
      description: "Comandos de apelido",
      category: "MODERATION",
      botPermissions: ["MANAGE_NICKNAMES"],
      userPermissions: ["MANAGE_NICKNAMES"],
      command: {
        enabled: true,
        minArgsCount: 2,
        subcommands: [
          {
            trigger: "set <@member> <name>",
            description: "Define o apelido do membro especificado",
          },
          {
            trigger: "reset <@member>",
            description: "Redefinir o apelido de um membro",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "set",
            description: "Mudar o apelido de um membro",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro cujo nick você deseja definir",
                type: "USER",
                required: true,
              },
              {
                name: "name",
                description: "O apelido para definir",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "reset",
            description: "Redefinir o apelido de um membro",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "Os membros cujo nick você deseja redefinir",
                type: "USER",
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
    const sub = args[0].toLowerCase();

    if (sub === "set") {
      const target = await resolveMember(message, args[1]);
      if (!target) return message.reply("Não foi possível encontrar o membro correspondente");
      const name = args.slice(2).join(" ");
      if (!name) return message.reply("Especifique um apelido");

      const response = await nickname(message, target, name);
      return message.reply(response);
    }

    //
    else if (sub === "reset") {
      const target = await resolveMember(message, args[1]);
      if (!target) return message.reply("Não foi possível encontrar o membro correspondente");

      const response = await nickname(message, target);
      return message.reply(response);
    }
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const name = interaction.options.getString("name");
    const target = await interaction.guild.members.fetch(interaction.options.getUser("user"));

    const response = await nickname(interaction, target, name);
    await interaction.followUp(response);
  }
};

async function nickname({ member, guild }, target, name) {
  if (!memberInteract(member, target)) {
    return `Oops! Você não pode gerenciar o apelido de ${target.user.tag}`;
  }
  if (!memberInteract(guild.me, target)) {
    return `Oops! Não consigo gerenciar o apelido de ${target.user.tag}`;
  }

  try {
    await target.setNickname(name);
    return `Com sucesso ${name ? "changed" : "reset"} apelido de ${target.user.tag}`;
  } catch (ex) {
    return `Falhou ao ${name ? "change" : "reset"} apelido para ${target.displayName}. Você forneceu um nome válido?`;
  }
}
