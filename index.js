const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once("ready", () => {
  console.log(`Bot ${client.user.tag} jest online!`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId === "ticket_category") {
    const category = interaction.values[0];

    const names = {
      zakup: "🛒・zakup-titan-holo",
      nagroda: "🎁・nagroda",
      pomoc: "🛠️・pomoc",
      wspolpraca: "🤝・wspolpraca"
    };

    const channelName = names[category];

    const existing = interaction.guild.channels.cache.find(
      ch =>
        ch.name === channelName &&
        ch.type === ChannelType.GuildText &&
        ch.topic === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `❌ Masz już otwarty ticket: ${existing}`,
        ephemeral: true
      });
    }

    const channel = await interaction.guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      topic: `ticket-${interaction.user.id}`,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }
      ]
    });

    const embed = new EmbedBuilder()
      .setTitle("🎫 Titan Market")
      .setDescription(
        `Witaj ${interaction.user}!\n\n` +
        `Wybrałeś kategorię: **${channelName}**\n\n` +
        `Opisz tutaj, w czym możemy Ci pomóc.`
      );

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed]
    });

    await interaction.reply({
      content: `✅ Ticket został utworzony: ${channel}`,
      ephemeral: true
    });
  }
});

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET")
      .setDescription(
        "Wybierz kategorię ticketu z menu poniżej.\n\n" +
        "🛒 **Zakup Titan Holo**\n" +
        "🎁 **Nagroda**\n" +
        "🛠️ **Pomoc**\n" +
        "🤝 **Współpraca**"
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_category")
      .setPlaceholder("🎫 Wybierz kategorię ticketu")
      .addOptions([
        {
          label: "Zakup Titan Holo",
          description: "Chcesz kupić Titan Holo",
          value: "zakup",
          emoji: "🛒"
        },
        {
          label: "Nagroda",
          description: "Sprawa dotycząca nagrody",
          value: "nagroda",
          emoji: "🎁"
        },
        {
          label: "Pomoc",
          description: "Potrzebujesz pomocy",
          value: "pomoc",
          emoji: "🛠️"
        },
        {
          label: "Współpraca",
          description: "Chcesz nawiązać współpracę",
          value: "wspolpraca",
          emoji: "🤝"
        }
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await message.channel.send({
      embeds: [embed],
      components: [row]
    });
  }
});

client.login(process.env.TOKEN);
