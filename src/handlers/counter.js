const { setVoiceChannelName, getMemberStats } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");

/**
 * Updates the counter channel for all the guildId's present in the update queue
 * @param {import('@src/structures').BotClient} client
 */
async function updateCounterChannels(client) {
  client.counterUpdateQueue.forEach(async (guildId) => {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    try {
      const settings = await getSettings(guild);

      const all = guild.memberCount;
      const bots = settings.data.bots;
      const members = all - bots;

      for (const config of settings.counters) {
        const chId = config.channel_id;
        const vc = guild.channels.cache.get(chId);
        if (!vc) continue;

        let channelName;
        if (config.counter_type === "USERS") channelName = `${config.name} : ${all}`;
        if (config.counter_type === "MEMBERS") channelName = `${config.name} : ${members}`;
        if (config.counter_type === "BOTS") channelName = `${config.name} : ${bots}`;

        setVoiceChannelName(vc, channelName);
      }
    } catch (ex) {
      client.logger.error(`Erro ao atualizar os canais do contador para guildId: ${guildId}`, ex);
    } finally {
      // remove guildId from cache
      const i = client.counterUpdateQueue.indexOf(guild.id);
      if (i > -1) client.counterUpdateQueue.splice(i, 1);
    }
  });
}

/**
 * Initialize guild counters at startup
 * @param {import("discord.js").Guild} guild
 * @param {Object} settings
 */
async function init(guild, settings) {
  if (settings.counters.find((doc) => ["MEMBERS", "BOTS"].includes(doc.counter_type))) {
    const stats = await getMemberStats(guild);
    settings.data.bots = stats[1]; // update bot count in database
    await settings.save();
  }

  // schedule for update
  if (!guild.client.counterUpdateQueue.includes(guild.id)) guild.client.counterUpdateQueue.push(guild.id);
  return true;
}

module.exports = { init, updateCounterChannels };