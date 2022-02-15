const { Message, CommandInteraction } = require("discord.js");
const { Command } = require("@src/structures");
const { getMemberStats } = require("@utils/guildUtils");
const { getSettings } = require("@schemas/Guild");

module.exports = class CounterSetup extends Command {
  constructor(client) {
    super(client, {
      name: "counter",
      description: "Configurar canal de contador do servidor",
      category: "ADMIN",
      userPermissions: ["MANAGE_GUILD"],
      botPermissions: ["MANAGE_CHANNELS"],
      command: {
        enabled: true,
        usage: "<type> <channel-name>",
        minArgsCount: 1,
      },
      slashCommand: {
        enabled: true,
        ephemeral: true,
        options: [
          {
            name: "type",
            description: "Tipo de canal do contador",
            type: "STRING",
            required: true,
            choices: [
              {
                name: "users",
                value: "USERS",
              },
              {
                name: "members",
                value: "MEMBERS",
              },
              {
                name: "bots",
                value: "BOTS",
              },
            ],
          },
          {
            name: "name",
            description: "Nome do canal do contador",
            type: "STRING",
            required: true,
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
    const type = args[0].toLowerCase();
    if (!type || !["users", "members", "bots"].includes(type)) {
      return message.reply("Argumentos incorretos foram passados! Tipos de contador: `users/members/bots`");
    }
    if (args.length < 2) return message.reply("Uso incorreto! Você não forneceu o nome");
    args.shift();
    let channelName = args.join(" ");

    const response = await setupCounter(message.guild, type, channelName);
    return message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const type = interaction.options.getString("type");
    const name = interaction.options.getString("name");

    const response = await setupCounter(interaction.guild, type, name);
    return interaction.followUp(response);
  }
};

async function setupCounter(guild, type, name) {
  let channelName = name;

  const stats = await getMemberStats(guild);
  if (type.toUpperCase() === "USERS") channelName += ` : ${stats[0]}`;
  else if (type.toUpperCase() === "MEMBERS") channelName += ` : ${stats[2]}`;
  else if (type.toUpperCase() === "BOTS") channelName += ` : ${stats[1]}`;

  const vc = await guild.channels.create(channelName, {
    type: "GUILD_VOICE",
    permissionOverwrites: [
      {
        id: guild.roles.everyone,
        deny: ["CONNECT"],
      },
      {
        id: guild.me.id,
        allow: ["VIEW_CHANNEL", "MANAGE_CHANNELS", "CONNECT"],
      },
    ],
  });

  const settings = await getSettings(guild);

  const exists = settings.counters.find((v) => v.counter_type === type);
  if (exists) {
    exists.name = name;
    exists.channel_id = vc.id;
  } else {
    settings.counters.push({
      counter_type: type,
      channel_id: vc.id,
      name,
    });
  }

  settings.data.bots = stats[1];
  await settings.save();

  return "Configuração salva! Canal de contador criado";
}
