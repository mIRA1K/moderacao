const { Util, MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");

module.exports = (emoji) => {
  let custom = Util.parseEmoji(emoji);
  if (!custom.id) return "Este não é um emoji de servidor válido";

  let url = `https://cdn.discordapp.com/emojis/${custom.id}.${custom.animated ? "gif?v=1" : "png"}`;

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setAuthor("Emoji Info")
    .setDescription(
      `**Id:** ${custom.id}\n` + `**Nome:** ${custom.name}\n` + `**Animado?:** ${custom.animated ? "Yes" : "No"}`
    )
    .setImage(url);

  return { embeds: [embed] };
};
