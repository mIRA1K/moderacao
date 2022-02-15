const { MessageEmbed } = require("discord.js");
const { getSettings: registerGuild } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Guild} guild
 */
module.exports = async (client, guild) => {
  if (!guild.members.cache.has(guild.ownerId)) await guild.fetchOwner({ cache: true });
  client.logger.log(`Entrou no Servidor: ${guild.name} Membros: ${guild.memberCount}`);
  await registerGuild(guild);

  if (!client.joinLeaveWebhook) return;

  const embed = new MessageEmbed()
    .setTitle("Entrou no Servidor")
    .setThumbnail(guild.iconURL())
    .setColor(client.config.EMBED_COLORS.SUCCESS)
    .addField("Nome", guild.name, false)
    .addField("ID", guild.id, false)
    .addField("Dono", `${client.users.cache.get(guild.ownerId).tag} [\`${guild.ownerId}\`]`, false)
    .addField("Members", `\`\`\`yaml\n${guild.memberCount}\`\`\``, false)
    .setFooter(`Servidores #${client.guilds.cache.size}`);

  client.joinLeaveWebhook.send({
    username: "Entrou no Servidor",
    avatarURL: client.user.displayAvatarURL(),
    embeds: [embed],
  });
};
