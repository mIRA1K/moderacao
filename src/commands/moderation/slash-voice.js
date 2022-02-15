const { Command } = require("@src/structures");
const { CommandInteraction } = require("discord.js");
const deafen = require("./shared/deafen");
const vmute = require("./shared/vmute");
const vunmute = require("./shared/vunmute");
const undeafen = require("./shared/undeafen");
const disconnect = require("./shared/disconnect");
const move = require("./shared/move");

// SLASH COMMAND ONLY

module.exports = class VoiceCommand extends Command {
  constructor(client) {
    super(client, {
      name: "voice",
      description: "Comandos de moderação de voz",
      category: "MODERATION",
      userPermissions: ["MUTE_MEMBERS", "MOVE_MEMBERS", "DEAFEN_MEMBERS"],
      botPermissions: ["MUTE_MEMBERS", "MOVE_MEMBERS", "DEAFEN_MEMBERS"],
      command: {
        enabled: false,
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "mute",
            description: "Silenciar a voz de um membro",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "Razão para mutar",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "unmute",
            description: "Ativar o som da voz de um membro silenciado",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "Razão para ativar o som",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "deafen",
            description: "Ensurdecer um membro no canal de voz",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "Razão para Deafen",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "undeafen",
            description: "Ensurdecer um membro no canal de voz",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "Razão para Undeafen",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "kick",
            description: "Expulsar um membro do canal de voz",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "reason",
                description: "Razão para expulsar",
                type: "STRING",
                required: false,
              },
            ],
          },
          {
            name: "move",
            description: "Mover um membro de um canal de voz para outro",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O membro alvo",
                type: "USER",
                required: true,
              },
              {
                name: "channel",
                description: "O canal para o qual mover o membro",
                type: "CHANNEL",
                channelTypes: ["GUILD_VOICE", "GUILD_STAGE_VOICE"],
                required: true,
              },
              {
                name: "reason",
                description: "Razão para mover",
                type: "STRING",
                required: false,
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
    const reason = interaction.options.getString("reason");

    const user = interaction.options.getUser("user");
    const target = await interaction.guild.members.fetch(user.id);

    let response;

    if (sub === "mute") response = await vmute(interaction, target, reason);
    else if (sub === "unmute") response = await vunmute(interaction, target, reason);
    else if (sub === "deafen") response = await deafen(interaction, target, reason);
    else if (sub === "undeafen") response = await undeafen(interaction, target, reason);
    else if (sub === "kick") response = await disconnect(interaction, target, reason);
    else if (sub == "move") {
      const channel = interaction.options.getChannel("channel");
      response = await move(interaction, target, reason, channel);
    }

    await interaction.followUp(response);
  }
};
