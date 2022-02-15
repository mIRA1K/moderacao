const { resolveMember } = require("@root/src/utils/guildUtils");
const { Command } = require("@src/structures");
const { Message, CommandInteraction } = require("discord.js");
const balance = require("./sub/balance");
const deposit = require("./sub/deposit");
const transfer = require("./sub/transfer");
const withdraw = require("./sub/withdraw");

module.exports = class BankCommand extends Command {
  constructor(client) {
    super(client, {
      name: "bank",
      description: "Acesse as operações bancárias",
      category: "ECONOMY",
      botPermissions: ["EMBED_LINKS"],
      command: {
        enabled: true,
        minArgsCount: 1,
        subcommands: [
          {
            trigger: "balance",
            description: "Verifique o seu saldo",
          },
          {
            trigger: "deposit <coins>",
            description: "Deposite moedas em sua conta bancária",
          },
          {
            trigger: "withdraw <coins>",
            description: "Retirar moedas da sua conta bancária",
          },
          {
            trigger: "transfer <user> <coins>",
            description: "Transferir moedas para outro usuário",
          },
        ],
      },
      slashCommand: {
        enabled: true,
        options: [
          {
            name: "balance",
            description: "Verifique o seu saldo de moedas",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "Nome do usuário",
                type: "USER",
                required: false,
              },
            ],
          },
          {
            name: "deposit",
            description: "Deposite moedas em sua conta bancária",
            type: "SUB_COMMAND",
            options: [
              {
                name: "coins",
                description: "Número de moedas para depositar",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "withdraw",
            description: "Retirar moedas da sua conta bancária",
            type: "SUB_COMMAND",
            options: [
              {
                name: "coins",
                description: "Número de moedas para retirar",
                type: "INTEGER",
                required: true,
              },
            ],
          },
          {
            name: "transfer",
            description: "Transferir moedas para outro usuário",
            type: "SUB_COMMAND",
            options: [
              {
                name: "user",
                description: "O usuário para quem as moedas devem ser transferidas",
                type: "USER",
                required: true,
              },
              {
                name: "coins",
                description: "A quantidade de moedas para transferir",
                type: "INTEGER",
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

    if (sub === "balance") {
      response = await balance(message.author);
    }

    //
    else if (sub === "deposit") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.reply("Forneça um número válido de moedas que você deseja depositar");
      response = await deposit(message.author, coins);
    }

    //
    else if (sub === "withdraw") {
      const coins = args.length && parseInt(args[1]);
      if (isNaN(coins)) return message.reply("Forneça um número válido de moedas que você deseja retirar");
      response = await withdraw(message.author, coins);
    }

    //
    else if (sub === "transfer") {
      if (args.length < 3) return message.reply("Forneça um usuário válido e moedas para transferir");
      const target = await resolveMember(message, args[1], true);
      if (!target) return message.reply("Forneça um usuário válido para transferir moedas para");
      const coins = parseInt(args[2]);
      if (isNaN(coins)) return message.reply("Forneça um número válido de moedas que você deseja transferir");
      response = await transfer(message.author, target.user, coins);
    }

    //
    else {
      return message.reply("Uso de comando inválido");
    }

    await message.reply(response);
  }

  /**
   * @param {CommandInteraction} interaction
   */
  async interactionRun(interaction) {
    const sub = interaction.options.getSubcommand();
    let response;

    // balance
    if (sub === "balance") {
      response = await balance(interaction.user);
    }

    // deposit
    else if (sub === "deposit") {
      const coins = interaction.options.getInteger("coins");
      response = await deposit(interaction.user, coins);
    }

    // withdraw
    else if (sub === "withdraw") {
      const coins = interaction.options.getInteger("coins");
      response = await withdraw(interaction.user, coins);
    }

    // transfer
    else if (sub === "transfer") {
      const user = interaction.options.getUser("user");
      const coins = interaction.options.getInteger("coins");
      response = await transfer(interaction, user, coins);
    }

    await interaction.followUp(response);
  }
};
