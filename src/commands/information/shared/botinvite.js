const { MessageEmbed, MessageButton, MessageActionRow } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");

module.exports = (client) => {
  const embed = new MessageEmbed()
    .setAuthor("Convite do Bot 🥰")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription("Heey! Obrigado por considerar a possibilidade de me convidar \nUse o botão abaixo para navegar para onde quiser");

  // Buttons
  let components = [];
  components.push(new MessageButton().setLabel("Convite do Bot").setURL(client.getInvite()).setStyle("LINK"));

  if (SUPPORT_SERVER) {
    components.push(new MessageButton().setLabel("Link do Servidor").setURL(SUPPORT_SERVER).setStyle("LINK"));
  }

  if (DASHBOARD.enabled) {
    components.push(new MessageButton().setLabel("Painel de Controle").setURL(DASHBOARD.baseURL).setStyle("LINK"));
  }

  let buttonsRow = new MessageActionRow().addComponents(components);
  return { embeds: [embed], components: [buttonsRow] };
};
