const { MessageEmbed } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true });
  client.logger.log(`Saiu do Servidor: ${guild.name} Membros: ${guild.memberCount}`);

  const settings = await getSettings(guild);
  settings.data.leftAt = new Date();
  await settings.save();

  if (!client.joinLeaveWebhook) return;

  const embed = new MessageEmbed()
    .setTitle("Saiu do Servidor")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.ERROR)
    .addField("Nome", guild.name, false)
    .addField("ID", guild.id, false)
    .addField("Dono", `${client.users.cache.get(guild.ownerId).tag} [\`${guild.ownerId}\`]`, false)
    .addField("Membros", `\`\`\`yaml\n${guild.memberCount}\`\`\``, false)
    .setFooter(`Servidores #${client.guilds.cache.size}`);

  client.joinLeaveWebhook.send({
    username: "Saiu do Servidor",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
