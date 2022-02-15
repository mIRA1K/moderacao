const { getConfig } = require("@schemas/Message");
const { closeTicket, openTicket } = require("@utils/ticketUtils");

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketOpen(interaction) {
  const config = await getConfig(interaction.guildId, interaction.channelId, interaction.message.id);
  if (!config) return;

  const status = await openTicket(interaction.guild, interaction.user, config.ticket);

  if (status === "MISSING_PERMISSIONS") {
    return interaction.followUp(
      "Não é possível criar canal de ticket, estou sem `Manage Channel` permissão. Contate o dono do servidor para obter ajuda!"
    );
  }

  if (status === "ALREADY_EXISTS") {
    return interaction.followUp(`Você já tem um ticket aberto`);
  }

  if (status === "TOO_MANY_TICKETS") {
    return interaction.followUp("Existem muitos tickets abertos. Tente mais tarde");
  }

  if (status === "FAILED") {
    return interaction.followUp("Falha ao criar canal de ticket, ocorreu um erro!");
  }

  await interaction.followUp(`Ticket criado! 🔥`);
}

/**
 * @param {import("discord.js").ButtonInteraction} interaction
 */
async function handleTicketClose(interaction) {
  const status = await closeTicket(interaction.channel, interaction.user);
  if (status === "MISSING_PERMISSIONS") {
    return interaction.followUp("Não é possível fechar o ticket, faltam permissões. Contate o dono do servidor para obter ajuda!");
  } else if (status == "ERROR") {
    return interaction.followUp("Falha ao fechar o ticket, ocorreu um erro!");
  }
}

module.exports = {
  handleTicketOpen,
  handleTicketClose,
};
