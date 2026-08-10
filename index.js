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
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once("ready", () => {
  console.log(`Bot ${client.user.tag} jest online!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ticket") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET")
      .setDescription(
        "Wybierz kategorię ticketu:\n\n" +
        "🛒 **Zakup Titan Holo**\n" +
        "🎁 **Nagroda**\n" +
        "🛠️ **Pomoc**\n" +
        "🤝 **Współpraca**"
      );

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_category")
      .setPlaceholder("🎫 Wybierz kategorię")
      .addOptions([
        {
          label: "Zakup Titan Holo",
          description: "Kupno Titan Holo",
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
          description: "Chcesz współpracować",
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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;

  if (interaction.customId !== "ticket_category") return;

  const categories = {
    zakup: ["🛒", "zakup-titan-holo"],
    nagroda: ["🎁", "nagroda"],
    pomoc: ["🛠️", "pomoc"],
    wspolpraca: ["🤝", "wspolpraca"]
  };

  const [emoji, name] = categories[interaction.values[0]];

  const existing = interaction.guild.channels.cache.find(
    channel =>
      channel.topic === `ticket-${interaction.user.id}`
  );

  if (existing) {
    return interaction.reply({
      content: `❌ Masz już otwarty ticket: ${existing}`,
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.create({
    name: `${emoji}-${name}`,
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

  const ticketEmbed = new EmbedBuilder()
    .setTitle(`${emoji} Titan Market`)
    .setDescription(
      `Witaj ${interaction.user}!\n\n` +
      `Kategoria: **${name}**\n\n` +
      `Napisz tutaj, w czym możemy Ci pomóc.`
    );

  await channel.send({
    content: `${interaction.user}`,
    embeds: [ticketEmbed]
  });

  await interaction.reply({
    content: `✅ Ticket utworzony: ${channel}`,
    ephemeral: true
  });
});

client.login(process.env.TOKEN);
