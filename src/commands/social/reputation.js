const { Command } = require("@src/structures");
const { resolveMember } = require("@utils/guildUtils");
const { getUser } = require("@schemas/User");
const { MessageEmbed, Message } = require("discord.js");
const { diffHours, getRemainingTime } = require("@utils/miscUtils");
const { EMBED_COLORS } = require("@root/config");

module.exports = class Reputation extends Command {
  constructor(client) {
    super(client, {
      name: "rep",
      description: "Dar reputação a um usuário",
      category: "SOCIAL",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        aliases: ["reputation"],
        subcommands: [
          {
            trigger: "view [user]",
            description: "Ver a reputação de um usuário",
          },
          {
            trigger: "give [user]",
            description: "Dar reputação a um usuário",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "view",
            description: "Ver a reputação de um usuário",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O usuário para verificar a reputação de",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "give",
            description: "Dar reputação a um usuário",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O usuário para verificar a reputação de",
                type: "USER",
                required: true,
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
    const sub = args[0];
    let response;

    // status
    if (sub === "view") {
      let target = message.author;
      if (args.length > 1) {
        const resolved = (await resolveMember(message, args[1])) || message.member;
        if (resolved) target = resolved.user;
      }
      response = await viewReputation(target);
    }

    // give
    else if (sub === "give") {
      const target = await resolveMember(message, args[1]);
      if (!target) return message.reply("Forneça um usuário válido para dar reputação a");
      response = await giveReputation(message.author, target.user);
    }

    //
    else {
      response = "Uso incorreto do comando";
    }

    await message.reply(response);
  }

  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // status
    if (sub === "view") {
      const target = interaction.options.getUser("user") || interaction.user;
      response = await viewReputation(target);
    }

    // give
    if (sub === "give") {
      const target = interaction.options.getUser("user");
      response = await giveReputation(interaction.user, target);
    }

    await interaction.followUp(response);
  }
};

async function viewReputation(target) {
  const userData = await getUser(target.id);
  if (!userData) return `${target.tag} ainda não tem reputação`;

  const embed = new MessageEmbed()
    .setAuthor(`Reputação para ${target.username}`)
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setThumbnail(target.displayAvatarURL())
    .addField("Dado", userData.reputation?.given.toString(), true)
    .addField("Recebido", userData.reputation?.received.toString(), true);

  return { embeds: [embed] };
}

async function giveReputation(user, target) {
  if (target.bot) return "Você não pode dar reputação a bots";
  if (target.id === user.id) return "Você não pode dar reputação a si mesmo";

  const userData = await getUser(user.id);
  if (userData && userData.reputation.timestamp) {
    const lastRep = new Date(userData.reputation.timestamp);
    const diff = diffHours(new Date(), lastRep);
    if (diff < 24) {
      const nextUsage = lastRep.setHours(lastRep.getHours() + 24);
      return `Você pode executar este comando novamente em \`${getRemainingTime(nextUsage)}\``;
    }
  }

  const targetData = await getUser(target.id);

  userData.reputation.given += 1;
  userData.reputation.timestamp = new Date();
  targetData.reputation.received += 1;

  await userData.save();
  await targetData.save();

  const embed = new MessageEmbed()
    .setColor(EMBED_COLORS.BOT_EMBED)
    .setDescription(`${target.toString()} +1 Rep!`)
    .setFooter(`Por ${user.tag}`)
    .setTimestamp(Date.now());

  return { embeds: [embed] };
}
