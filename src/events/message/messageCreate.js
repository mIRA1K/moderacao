const { automodHandler, xpHandler } = require("@src/handlers");
const { getSettings } = require("@schemas/Guild");

/**
 * @param {import('@src/structures').BotClient} client
 * @param {import('discord.js').Message} message
 */
module.exports = async (client, message) => {
  if (!message.guild || message.author.bot) return;
  const settings = await getSettings(message.guild);
  const { prefix } = settings;

  // check for bot mentions
  if (message.content.includes(`${client.user.id}`)) message.reply(`Oii, me marcou? Meu prefixo é \`${settings.prefix}\`, caso precise de ajuda de **/help** e veja todos os meus comandos :wink: `);

  let isCommand = false;
  if (message.content.startsWith(prefix)) {
    const args = message.content.replace(`${prefix}`, "").split(/\s+/);
    const invoke = args.shift().toLowerCase();
    const cmd = client.getCommand(invoke);

    // command is found
    if (cmd) {
      isCommand = true;
      cmd.executeCommand(message, args, invoke, prefix);
    }
  }

  // if not a command
  if (!isCommand) {
    await automodHandler.performAutomod(message, settings);
    if (settings.ranking.enabled) xpHandler.handleXp(message);
  }
};
