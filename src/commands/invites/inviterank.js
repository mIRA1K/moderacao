const { Command } = require("@src/structures");
const { findMatchingRoles } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");
const { Message, CommandInteraction } = require("discord.js");

module.exports = class AddInvitesCommand extends Command {
  constructor(client) {
    super(client, {
      name: "inviterank",
      description: "Configurar classificações de convite",
      category: "INVITE",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        usage: "<role-name> <invites>",
        minArgsCount: 2,
        subcommands: [
          {
            trigger: "add <role> <invites>",
            description: "Adicione um cargo automatico após atingir um determinado número de convites",
          },
          {
            trigger: "remove role",
            description: "Remover a classificação de convite configurada para esse cargo",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "add",
            description: "Adicionar um novo Ranking de Convites",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "Cargo a ser dado",
                type: "ROLE",
                required: true,
              },
              {
                name: "invites",
                description: "Número de convites necessários para obter o cargo",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remover um ranking de convite configurada anteriormente",
            type: "SUB_COMMAND",
            options: [
              {
                name: "role",
                description: "Cargo com ranking de convite configurada",
                type: "ROLE",
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

    if (sub === "add") {
      const query = args[1];
      const invites = args[2];

      if (isNaN(invites)) return message.reply(`\`${invites}\` não é um número válido de convites?`);
      const role = message.mentions.roles.first() || findMatchingRoles(message.guild, query)[0];
      if (!role) return message.reply(`Nenhum cargo encontrada correspondente \`${query}\``);

      const response = await addInviteRank(message, role, invites);
      await message.reply(response);
    }

    //
    else if (sub === "remove") {
      const query = args[1];
      const role = message.mentions.roles.first() || findMatchingRoles(message.guild, query)[0];
      if (!role) return message.reply(`Nenhum cargo encontrada correspondente \`${query}\``);
      const response = await removeInviteRank(message, role);
      await message.reply(response);
    }

    //
    else {
      await message.reply("Nenhuma função correspondente!");
    }
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    //
    if (sub === "add") {
      const role = interaction.options.getRole("role");
      const invites = interaction.options.getInteger("invites");

      const response = await addInviteRank(interaction, role, invites);
      await interaction.followUp(response);
    }

    //
    else if (sub === "remove") {
      const role = interaction.options.getRole("role");
      const response = await removeInviteRank(interaction, role);
      await interaction.followUp(response);
    }
  }
};

async function addInviteRank({ guild }, role, invites) {
  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return `O rastreamento de convites está desativado neste servidor`;

  if (role.managed) {
    return "Você não pode atribuir uma função de bot";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Eu não posso atribuir a função de todos.";
  }

  if (!role.editable) {
    return "Não tenho permissão para mover membros para essa função. Essa função está abaixo da minha função mais alta?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);

  let msg = "";
  if (exists) {
    exists.invites = invites;
    msg += "Configuração anterior encontrada para esta função. Sobrescrever dados\n";
  }

  settings.invite.ranks.push({ _id: role.id, invites });
  await settings.save();
  return `${msg}Sucesso! Configuração salva.`;
}

async function removeInviteRank({ guild }, role) {
  const settings = await getSettings(guild);
  if (!settings.invite.tracking) return `O rastreamento de convites está desativado neste servidor`;

  if (role.managed) {
    return "Você não pode atribuir uma função de bot";
  }

  if (guild.roles.everyone.id === role.id) {
    return "Você não pode atribuir a função de todos.";
  }

  if (!role.editable) {
    return "Não tenho permissões para mover membros dessa função. Essa função está abaixo da minha função mais alta?";
  }

  const exists = settings.invite.ranks.find((obj) => obj._id === role.id);
  if (!exists) return "Nenhuma classificação de convite anterior configurada para esta função";

  // delete element from array
  const i = settings.invite.ranks.findIndex((obj) => obj._id === role.id);
  if (i > -1) settings.invite.ranks.splice(i, 1);

  await settings.save();
  return "Sucesso! Configuração salva.";
}
