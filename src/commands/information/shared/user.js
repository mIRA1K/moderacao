const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

module.exports = (member) => {
  let color = member.displayHexColor;
  if (color === "#000000") color = EMBED_COLORS.BOT_EMBED;

  const embed = new MessageEmbed()
    .setAuthor(`User information for ${member.displayName}`, member.user.displayAvatarURL())
    .setThumbnail(member.user.displayAvatarURL())
    .setColor(color)
    .addField("Tag do Usuário", member.user.tag, true)
    .addField("ID", member.id, true)
    .addField("Entrou no Servidor", member.joinedAt.toUTCString())
    .addField("Registrado no Discord", member.user.createdAt.toUTCString())
    .addField(`Cargos [${member.roles.cache.size}]`, member.roles.cache.map((r) => r.name).join(", "), false)
    .addField("Avatar-URL", member.user.displayAvatarURL({ format: "png" }))
    .setFooter(`Pedido por ${member.user.tag}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
};
