const { MessageEmbed } = require("discord.js");
const { EMBED_COLORS } = require("@root/config");
const { outdent } = require("outdent");

const channelTypes = {
  GUILD_TEXT: "Texto",
  GUILD_PUBLIC_THREAD: "Public Thread",
  GUILD_PRIVATE_THREAD: "Private Thread",
  GUILD_NEWS: "Noticias",
  GUILD_NEWS_THREAD: "Noticias Thread",
  GUILD_VOICE: "Voice",
  GUILD_STAGE_VOICE: "Stage Voice",
};

module.exports = (channel) => {
  const { id, name, topic, parent, position, type } = channel;

  let desc = outdent`
    ❯ ID: **${id}**
    ❯ Nome: **${name}**
    ❯ Tipo: **${channelTypes[type] || type}**
    ❯ Categoria: **${parent || "NA"}**
    ❯ Tópico: **${topic || "Nenhum tópico setado"}**\n
    `;

  if (type === "GUILD_TEXT") {
    const { rateLimitPerUser, nsfw } = channel;
    desc += outdent`
      ❯ Posição: **${position}**
      ❯ Slowmode: **${rateLimitPerUser}**
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_PUBLIC_THREAD" || type === "GUILD_PRIVATE_THREAD") {
    const { ownerId, archived, locked } = channel;
    desc += outdent`
      ❯ Owner Id: **${ownerId}**
      ❯ Is Archived: **${archived ? "✓" : "✕"}**
      ❯ Is Locked: **${locked ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_NEWS" || type === "GUILD_NEWS_THREAD") {
    const { nsfw } = channel;
    desc += outdent`
      ❯ isNSFW: **${nsfw ? "✓" : "✕"}**
      `;
  }

  if (type === "GUILD_VOICE" || type === "GUILD_STAGE_VOICE ") {
    const { bitrate, userLimit, full } = channel;
    desc += outdent`
      ❯ Position: **${position}**
      ❯ Bitrate: **${bitrate}**
      ❯ User Limit: **${userLimit}**
      ❯ isFull: **${full ? "✓" : "✕"}**
      `;
  }

  const embed = new MessageEmbed().setAuthor("Channel Details").setColor(EMBED_COLORS.BOT_EMBED).setDescription(desc);

  return { embeds: [embed] };
};
