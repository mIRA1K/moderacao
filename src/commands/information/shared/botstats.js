const { MessageEmbed, MessageActionRow, MessageButton } = require("discord.js");
const { EMBED_COLORS, SUPPORT_SERVER, DASHBOARD } = require("@root/config");
const { timeformat } = require("@utils/miscUtils");
const os = require("os");
const { outdent } = require("outdent");

module.exports = (client) => {
  // STATS
  const guilds = client.guilds.cache.size;
  const channels = client.channels.cache.size;
  const users = client.guilds.cache.reduce((size, g) => size + g.memberCount, 0);

  // CPU
  const platform = process.platform.replace(/win32/g, "Windows");
  const architecture = os.arch();
  const cores = os.cpus().length;
  const cpuUsage = `${(process.cpuUsage().user / 1024 / 1024).toFixed(2)} MB`;

  // RAM
  const botUsed = `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`;
  const botAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const botUsage = `${((process.memoryUsage().heapUsed / os.totalmem()) * 100).toFixed(1)}%`;

  const overallUsed = `${((os.totalmem() - os.freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallAvailable = `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`;
  const overallUsage = `${Math.floor(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`;

  let desc = "";
  desc += `❒ Total Servers: ${guilds}\n`;
  desc += `❒ Total Usuários: ${users}\n`;
  desc += `❒ Total Canais: ${channels}\n`;
  desc += `❒ Websocket Ping: ${client.ws.ping} ms\n`;
  desc += "\n";

  const embed = new MessageEmbed()
    .setTitle("Bot Informação")
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(client.user.displayAvatarURL())
    .setDescription(desc)
    .addField(
      "CPU:",
      outdent`
        ❯ **OS:** ${platform} [${architecture}]
        ❯ **Cores:** ${cores}
        ❯ **Usando:** ${cpuUsage}
        `,
      true
    )
    .addField(
      "Bot's RAM:",
      outdent`
        ❯ **Usando:** ${botUsed}
        ❯ **Disp:** ${botAvailable}
        ❯ **Usando:** ${botUsage}
        `,
      true
    )
    .addField(
      "PC RAM:",
      outdent`
      ❯ **Usando:** ${overallUsed}
      ❯ **Disp:** ${overallAvailable}
      ❯ **Usando:** ${overallUsage}
      `,
      true
    )
    .addField("Node Js versão", process.versions.node, false)
    .addField("Timer", "```" + timeformat(process.uptime()) + "```", false);

  // Buttons
  let components = [];
  components.push(new MessageButton().setLabel("Link do Bot").setURL(client.getInvite()).setStyle("LINK"));

  if (SUPPORT_SERVER) {
    components.push(new MessageButton().setLabel("Servidor Link").setURL(SUPPORT_SERVER).setStyle("LINK"));
  }

  if (DASHBOARD.enabled) {
    components.push(new MessageButton().setLabel("Painel de Controle").setURL(DASHBOARD.baseURL).setStyle("LINK"));
  }

  let buttonsRow = new MessageActionRow().addComponents(components);

  return { embeds: [embed], components: [buttonsRow] };
};
