const { Command } = require("@src/structures");
const { CommandInteraction } = require("discord.js");
const user = require("./shared/user");
const channelInfo = require("./shared/channel");
const guildInfo = require("./shared/guild");
const avatar = require("./shared/avatar");
const emojiInfo = require("./shared/emoji");
const botInfo = require("./shared/botstats");

module.exports = class InfoCommand extends Command {
  constructor(client) {
    super(client, {
      name: "info",
      description: "Mostrar várias informações",
      category: "INFORMATION",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: false,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "user",
            description: "Obter informações do usuário",
            type: "SUB_COMMAND",
            options: [
              {
                name: "name",
                description: "Nome do usuário",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "channel",
            description: "Obter informações do canal",
            type: "SUB_COMMAND",
            options: [
              {
                name: "name",
                description: "Nome do canal",
                type: "CHANNEL",
                required: false,
              },
            ],
          },
          {
            name: "guild",
            description: "Obter informações da guilda",
            type: "SUB_COMMAND",
          },
          {
            name: "bot",
            description: "Obter informações sobre o bot",
            type: "SUB_COMMAND",
          },
          {
            name: "avatar",
            description: "Exibe informações de avatar",
            type: "SUB_COMMAND",
            options: [
              {
                name: "name",
                description: "Nome do usuário",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "emoji",
            description: "Exibe informações de emoji",
            type: "SUB_COMMAND",
            options: [
              {
                name: "name",
                description: "Nome do emoji",
                type: "STRING",
                required: true,
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    if (!sub) return interaction.followUp("Não é um subcomando válido");
    let response;

    // user
    if (sub === "user") {
      let targetUser = interaction.options.getUser("name") || interaction.user;
      let target = await interaction.guild.members.fetch(targetUser);
      response = user(target);
    }

    // channel
    else if (sub === "channel") {
      let targetChannel = interaction.options.getChannel("name") || interaction.channel;
      response = channelInfo(targetChannel);
    }

    // guild
    else if (sub === "guild") {
      response = await guildInfo(interaction.guild);
    }

    // bot
    else if (sub === "bot") {
      response = botInfo(interaction.client);
    }

    // avatar
    else if (sub === "avatar") {
      let target = interaction.options.getUser("name") || interaction.user;
      response = avatar(target);
    }

    // emoji
    else if (sub === "emoji") {
      let emoji = interaction.options.getString("name");
      response = emojiInfo(emoji);
    }

    // return
    else {
      response = "Subcomando incorreto";
    }

    await interaction.followUp(response);
  }
};
