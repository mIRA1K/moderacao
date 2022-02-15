const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const { getSettings } = require("@schemas/Guild");

module.exports = class FlagTranslation extends Command {
  constructor(client) {
    super(client, {
      name: "flagtranslation",
      description: "Configurar a tradução da bandeira no servidor",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      command: {
        enabled: true,
        aliases: ["flagtr"],
        minArgsCount: 1,
        usage: "<on|off>",
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "status",
            description: "Habilitado ou Desabilitado",
            required: true,
            type: "STRING",
            choices: [
              {
                name: "ON",
                value: "ON",
              },
              {
                name: "OFF",
                value: "OFF",
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * @param {Message} message
   * @param {string[]} args
   */
  async messageRun(message, args) {
    const status = args[0].toLowerCase();
    if (!["on", "off"].includes(status)) return message.reply("Status inválido. O valor deve ser `on/off`");

    const response = await setFlagTranslation(message.guild, status);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const response = await setFlagTranslation(interaction.guild, interaction.options.getString("status"));
    await interaction.followUp(response);
  }
};

async function setFlagTranslation(guild, input) {
  const status = input.toLowerCase() === "on" ? true : false;

  const settings = await getSettings(guild);
  settings.flag_translation.enabled = status;
  await settings.save();

  return `Configuração salva! A tradução da bandeira é agora ${status ? "enabled" : "disabled"}`;
}
