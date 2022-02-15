const { MessageEmbed, Message, MessageActionRow, MessageButton, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { EMBED_COLORS } = require("@root/config.js");

// Schemas
const { getSettings } = require("@schemas/Guild");
const { createNewTicket } = require("@schemas/Message");

// Utils
const { parsePermissions } = require("@utils/botUtils");
const { canSendEmbeds, findMatchingRoles, getMatchingChannel } = require("@utils/guildUtils");
const { isTicketChannel, closeTicket, closeAllTickets } = require("@utils/ticketUtils");
const { isHex } = require("@utils/miscUtils");

const SETUP_TIMEOUT = 30 * 1000;

const SETUP_PERMS = ["VIEW_CHANNEL", "SEND_MESSAGES", "EMBED_LINKS"];

module.exports = class Ticket extends Command {
  constructor(client) {
    super(client, {
      name: "ticket",
      description: "Vários comandos de Tickets",
      category: "TICKET",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "setup",
            description: "Iniciar uma configuração de ticket interativo",
          },
          {
            trigger: "log <#channel>",
            description: "Configurar canal de registro para tickets",
          },
          {
            trigger: "limit <number>",
            description: "Definir o número máximo de ticket abertos simultâneos",
          },
          {
            trigger: "close",
            description: "Fechar o ticket",
          },
          {
            trigger: "closeall",
            description: "Feche todos os tickets abertos",
          },
          {
            trigger: "add <userId|roleId>",
            description: "Adicionar user/role para o ticket",
          },
          {
            trigger: "remove <userId|roleId>",
            description: "Remover user/role para o ticket",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "setup",
            description: "Configurar uma nova mensagem de ticket",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "O canal para onde a mensagem de criação de ticket deve ser enviada",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
              {
                name: "title",
                description: "O título da mensagem do ticket",
                type: "STRING",
                required: true,
              },
              {
                name: "role",
                description: "O cargo que pode ter acesso a tickets abertos recentemente",
                type: "ROLE",
                required: false,
              },
              {
                name: "color",
                description: "Cor hexadecimal para o ticket da embed",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "log",
            description: "Configurar canal de registro para tickets",
            type: "SUB_COMMAND",
            options: [
              {
                name: "channel",
                description: "Canal para onde os registros de tickets devem ser enviados",
                type: "CHANNEL",
                channelTypes: ["GUILD_TEXT"],
                required: true,
              },
            ],
          },
          {
            name: "limit",
            description: "Definir o número máximo de tickets abertos simultâneos",
            type: "SUB_COMMAND",
            options: [
              {
                name: "amount",
                description: "Número máximo de tickets",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "close",
            description: "Fecha o ticket [usado apenas no canal de tickets]",
            type: "SUB_COMMAND",
          },
          {
            name: "closeall",
            description: "Fecha todos os tickets abertos",
            type: "SUB_COMMAND",
          },
          {
            name: "add",
            description: "Adicionar usuário ao canal de tickets atual [usado apenas no canal de tickets]",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user_id",
                description: "O id do usuário a ser adicionado",
                type: "STRING",
                required: true,
              },
            ],
          },
          {
            name: "remove",
            description: "Remover usuário do canal de ticket [usado apenas no canal de tickets]",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O usuário a remover",
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
    const input = args[0].toLowerCase();
    let response;

    // Setup
    if (input === "setup") {
      if (!message.guild.me.permissions.has("MANAGE_CHANNELS")) {
        return message.reply("Está me faltando `Manage Channels` para criar canais de tickets");
      }
      return runInteractiveSetup(message);
    }

    // log ticket
    else if (input === "log") {
      if (args.length < 2) return message.reply("para crForneça um canal para o qual os registros de tickets devem ser enviadosiar canais de tickets");
      const target = getMatchingChannel(message.guild, args[1]);
      if (target.length === 0) return message.reply("Could not find any matching channel");
      response = await setupLogChannel(message, target);
    }

    // Set limit
    else if (input === "limit") {
      if (args.length < 2) return message.reply("Forneça um número");
      const limit = args[1];
      if (isNaN(limit)) return message.reply("Forneça um número de entrada");
      response = await setupLimit(message, limit);
    }

    // Close ticket
    else if (input === "close") {
      response = await close(message, message.author);
    }

    // Close all tickets
    else if (input === "closeall") {
      let sent = await message.reply("Fechando todos os Tickets abertos ...");
      response = await closeAll(message);
      return sent.editable ? sent.edit(response) : message.channel.send(response);
    }

    // Add user to ticket
    else if (input === "add") {
      if (args.length < 2) return message.reply("Forneça um usuário ou função para adicionar ao ticket");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await addToTicket(message, inputId);
    }

    // Remove user from ticket
    else if (input === "remove") {
      if (args.length < 2) return message.reply("Forneça um usuário ou função para remover");
      let inputId;
      if (message.mentions.users.size > 0) inputId = message.mentions.users.first().id;
      else if (message.mentions.roles.size > 0) inputId = message.mentions.roles.first().id;
      else inputId = args[1];
      response = await removeFromTicket(message, inputId);
    }

    // Invalid input
    else {
      return message.reply("Uso incorreto do comando");
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // setup
    if (sub === "setup") {
      const channel = interaction.options.getChannel("channel");
      const title = interaction.options.getString("title");
      const role = interaction.options.getRole("role");
      const color = interaction.options.getString("color");

      if (!interaction.guild.me.permissions.has("MANAGE_CHANNELS")) {
        return interaction.followUp("Está me faltando `Manage Channels` para criar canais de tickets");
      }

      if (color && !isHex(color)) return interaction.followUp("Please provide a valid hex color");
      if (role && (role.managed || interaction.guild.me.roles.highest.position < role.position)) {
        return interaction.followUp("Eu não tenho permissão para gerenciar esta função");
      }

      if (!canSendEmbeds(channel)) {
        return interaction.followUp(`Não preciso ter permissão para enviar incorporações em ${channel}`);
      }

      response = await setupTicket(interaction.guild, channel, title, role, color);
    }

    // Log channel
    else if (sub === "log") {
      const channel = interaction.options.getChannel("channel");
      response = await setupLogChannel(interaction, channel);
    }

    // Limit
    else if (sub === "limit") {
      const limit = interaction.options.getInteger("amount");
      response = await setupLimit(interaction, limit);
    }

    // Close
    else if (sub === "close") {
      response = await close(interaction, interaction.user);
    }

    // Close all
    else if (sub === "closeall") {
      response = await closeAll(interaction);
    }

    // Add to ticket
    else if (sub === "add") {
      const inputId = interaction.options.getString("user_id");
      response = await addToTicket(interaction, inputId);
    }

    // Remove from ticket
    else if (sub === "remove") {
      const user = interaction.options.getUser("user");
      response = await removeFromTicket(interaction, user.id);
    }

    await interaction.followUp(response);
  }
};

/**
 * @param {Message} message
 */
async function runInteractiveSetup({ channel, guild, author }) {
  const filter = (m) => m.author.id === author.id;

  const embed = new MessageEmbed()
    .setAuthor("Ticket Setup")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setFooter("Digite cancel para cancelar a configuração");

  let targetChannel;
  let title;
  let role;
  try {
    // wait for channel
    await channel.send({
      embeds: [embed.setDescription("Por favor `mencione o canal` em que a mensagem do ticket deve ser enviada")],
    });
    let reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    if (reply.content.toLowerCase() === "cancel") return reply.reply("Ticket setup foi cancelado");
    targetChannel = reply.mentions.channels.first();
    if (!targetChannel) return reply.reply("Ticket setup foi cancelado. You did not mention a channel");
    if (!targetChannel.isText() && !targetChannel.permissionsFor(guild.me).has(SETUP_PERMS)) {
      return reply.reply(
        `Ticket setup foi cancelado.\nI need ${parsePermissions(SETUP_PERMS)} in ${targetChannel}`
      );
    }

    // wait for title
    await channel.send({ embeds: [embed.setDescription("Por favor insira o `titulo` do ticket")] });
    reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    if (reply.content.toLowerCase() === "cancel") return reply.reply("Ticket setup foi cancelado");
    title = reply.content;

    // wait for roles
    const desc =
      "Quais cargos devem ter acesso para visualizar os tickets recém-criados?\n" +
      "Por favor, digite o nome de um cargo existente neste servidor.\n\n" +
      "Alternativamente, você pode digitar `none`";

    await channel.send({ embeds: [embed.setDescription(desc)] });
    reply = (await channel.awaitMessages({ filter, max: 1, time: SETUP_TIMEOUT })).first();
    const query = reply.content.toLowerCase();

    if (query === "cancel") return reply.reply("Ticket setup foi cancelado");
    if (query !== "none") {
      const roles = findMatchingRoles(guild, query);
      if (roles.length === 0) {
        return reply.reply(`Uh oh, Não consegui encontrar nenhuma função chamada ${query}! Ticket setup foi cancelado`);
      }
      role = roles[0];
      if (role.managed || guild.me.roles.highest.position < role.position) {
        return reply.reply("Ticket setup foi cancelado. Eu não tenho permissão para gerenciar o cargo");
      }
      await reply.reply(`Tudo bem! \`${role.name}\` agora pode ver os tickets recém-criados`);
    }
  } catch (ex) {
    return channel.send("Sem resposta por 30 segundos, a configuração foi cancelada");
  }

  const response = await setupTicket(guild, targetChannel, title, role);
  return channel.send(response);
}

async function setupTicket(guild, channel, title, role, color) {
  try {
    const embed = new MessageEmbed()
      .setAuthor("Ticket de Suporte")
      .setDescription(title)
      .setFooter("Você só pode ter 1 ticket aberto por vez!");

    if (color) embed.setColor(color);

    const row = new MessageActionRow().addComponents(
      new MessageButton().setLabel("Abrir o Ticket").setCustomId("TICKET_CREATE").setStyle("SUCCESS")
    );

    const tktMessage = await channel.send({ embeds: [embed], components: [row] });

    // save to Database
    await createNewTicket(guild.id, channel.id, tktMessage.id, title, role?.id);

    // send success
    return "Configuração salva! A mensagem do Ticket agora está configurada 🎉";
  } catch (ex) {
    guild.client.logger.error("ticketSetup", ex);
    return "Unexpected error occurred! Setup failed";
  }
}

async function setupLogChannel({ guild }, target) {
  if (!canSendEmbeds(target)) return `Oops! Eu tenho permissão para enviar incorporação para ${target}`;

  const settings = await getSettings(guild);
  settings.ticket.log_channel = target.id;
  await settings.save();

  return `Configuração salva! Os registros dos tickets serão enviados para ${target.toString()}`;
}

async function setupLimit({ guild }, limit) {
  if (Number.parseInt(limit, 10) < 5) return "O limite de tickets não pode ser inferior a 5";

  const settings = await getSettings(guild);
  settings.ticket.limit = limit;
  await settings.save();

  return `Configuração salva. Agora você pode ter no máximo \`${limit}\` tickets abertos`;
}

async function close({ channel, author }) {
  if (!isTicketChannel(channel)) return "Este comando só pode ser usado em canais de tickets";
  const status = await closeTicket(channel, author, "Fechado por um moderador");
  if (!status.success) return status.message;
}

async function closeAll({ guild }) {
  const stats = await closeAllTickets(guild);
  return `Concluído! Sucesso: \`${stats[0]}\` Falhou: \`${stats[1]}\``;
}

async function addToTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Este comando só pode ser usado no canal de tickets";
  if (!inputId || isNaN(inputId)) return "Oops! Você precisa inserir um válido userId/roleId";

  try {
    await channel.permissionOverwrites.create(inputId, {
      VIEW_CHANNEL: true,
      SEND_MESSAGES: true,
    });

    return "Done";
  } catch (ex) {
    return "Falha ao adicionar user/role. Você forneceu um ID valido?";
  }
}

async function removeFromTicket({ channel }, inputId) {
  if (!isTicketChannel(channel)) return "Este comando só pode ser usado no canal de tickets";
  if (!inputId || isNaN(inputId)) return "Oops! Você precisa inserir um válido userId/roleId";

  try {
    channel.permissionOverwrites.create(inputId, {
      VIEW_CHANNEL: false,
      SEND_MESSAGES: false,
    });
    return "Done";
  } catch (ex) {
    return "Falha ao remover user/role. Você forneceu um ID valido?";
  }
}
