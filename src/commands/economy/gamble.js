const { Command } = require("@src/structures");
const { MessageEmbed, Message, CommandInteraction } = require("discord.js");
const { getUser } = require("@schemas/User");
const { EMBED_COLORS, ECONOMY } = require("@root/config.js");
const { getRandomInt } = require("@utils/miscUtils");

module.exports = class Gamble extends Command {
  constructor(client) {
    super(client, {
      name: "gumble",
      description: "Tente a sua sorte jogando",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        usage: "<amount>",
        minArgsCount: 1,
        aliases: [],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "coins",
            description: "Número de moedas para apostar",
            required: true,
            type: "INTEGER",
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
    const betAmount = parseInt(args[0]);
    if (isNaN(betAmount)) return message.reply("O valor da aposta deve ser um número válido de entrada");
    const response = await gamble(message.author, betAmount);
    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const betAmount = interaction.options.getInteger("coins");
    const response = await gamble(interaction.user, betAmount);
    await interaction.followUp(response);
  }
};

function getEmoji() {
  const ran = getRandomInt(9);
  switch (ran) {
    case 1:
      return "\uD83C\uDF52";
    case 2:
      return "\uD83C\uDF4C";
    case 3:
      return "\uD83C\uDF51";
    case 4:
      return "\uD83C\uDF45";
    case 5:
      return "\uD83C\uDF49";
    case 6:
      return "\uD83C\uDF47";
    case 7:
      return "\uD83C\uDF53";
    case 8:
      return "\uD83C\uDF50";
    case 9:
      return "\uD83C\uDF4D";
    default:
      return "\uD83C\uDF52";
  }
}

function calculateReward(amount, var1, var2, var3) {
  if (var1 === var2 && var2.equals === var3) return 3 * amount;
  if (var1 === var2 || var2 === var3 || var1 === var3) return 2 * amount;
  return 0;
}

async function gamble(user, betAmount) {
  if (isNaN(betAmount)) return "O valor da aposta deve ser um número válido de entrada";
  if (betAmount < 0) return "O valor da aposta não pode ser negativo";
  if (betAmount < 10) return "O valor da aposta não pode ser inferior a 10";

  const userDb = await getUser(user.id);
  if (userDb.coins < betAmount)
    return `Você não tem moedas suficientes para jogar!\n**Saldo de moedas: ** ${userDb.coins || 0} ${ECONOMY.CURRENCY}`;

  const slot1 = getEmoji();
  const slot2 = getEmoji();
  const slot3 = getEmoji();

  const str = `
    **Valor do jogo:** ${betAmount}${ECONOMY.CURRENCY}
    **Multiplicador:** 2x
    ╔══════════╗
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ‎‎‎‎║
    ╠══════════╣
    ║ ${slot1} ║ ${slot2} ║ ${slot3} ⟸
    ╠══════════╣
    ║ ${getEmoji()} ║ ${getEmoji()} ║ ${getEmoji()} ║
    ╚══════════╝
    `;

  const reward = calculateReward(betAmount, slot1, slot2, slot3);
  const result = (reward > 0 ? `Você ganhou: ${reward}` : `Você perdeu: ${betAmount}`) + ECONOMY.CURRENCY;
  const balance = reward - betAmount;

  userDb.coins += balance;
  await userDb.save();

  const embed = new MessageEmbed()
    .setAuthor(user.username, user.displayAvatarURL())
    .setColor(EMBED_COLORS.TRANSPARENT)
    .setThumbnail("https://i.pinimg.com/originals/9a/f1/4e/9af14e0ae92487516894faa9ea2c35dd.gif")
    .setDescription(str)
    .setFooter(`${result}\nSaldo do Wallet atualizado: ${userDb?.coins}${ECONOMY.CURRENCY}`);

  return { embeds: [embed] };
}
