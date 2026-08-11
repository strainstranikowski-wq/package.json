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
  console.log(`✅ Titan Market Bot online jako ${client.user.tag}`);
});

// !ping + !ticket
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    return message.reply("🏓 Pong!");
  }

  if (message.content === "!ticket") {
    const embed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET")
      .setDescription(
        "# WYBIERZ KATEGORIĘ TICKETU\n\n" +
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
          value: "zakup",
          emoji: {
            id: "1536522515092873319",
            name: "TitanHolo"
          }
        },
        {
          label: "Nagroda",
          value: "nagroda",
          emoji: "🎁"
        },
        {
          label: "Pomoc",
          value: "pomoc",
          emoji: "🛠️"
        },
        {
          label: "Współpraca",
          value: "wspolpraca",
          emoji: "🤝"
        }
      ]);

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }
});

// Tworzenie ticketu
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isStringSelectMenu()) return;
  if (interaction.customId !== "ticket_category") return;

  const names = {
    zakup: "🛒・zakup-titan-holo",
    nagroda: "🎁・nagroda",
    pomoc: "🛠️・pomoc",
    wspolpraca: "🤝・wspolpraca"
  };

  const existing = interaction.guild.channels.cache.find(
    channel => channel.topic === `ticket-${interaction.user.id}`
  );

  if (existing) {
    return interaction.reply({
      content: `❌ Masz już otwarty ticket: ${existing}`,
      ephemeral: true
    });
  }

  const channel = await interaction.guild.channels.create({
    name: names[interaction.values[0]],
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

  let description;

  if (interaction.values[0] === "zakup") {
    description =
      "# <:TitanHolo:1536522515092873319> ZAKUP TITAN HOLO\n\n" +
      "# <:Blik:1536522618348380331> BLIK — 0% PROWIZJI\n\n" +
      "# <:Psc:1536522696542781450> PSC — 15% PROWIZJI\n\n" +
      "# <:Mypsc:1536522757595078727> MYPSC — 25% PROWIZJI";
  } else if (interaction.values[0] === "nagroda") {
    description = "# 🎁 NAGRODA";
  } else if (interaction.values[0] === "pomoc") {
    description = "# 🛠️ POMOC";
  } else {
    description = "# 🤝 WSPÓŁPRACA";
  }

  const ticketEmbed = new EmbedBuilder()
    .setTitle("TITAN MARKET")
    .setDescription(description);

  await channel.send({
    content: `${interaction.user}`,
    embeds: [ticketEmbed]
  });

  await interaction.reply({
    content: `✅ Ticket utworzony: ${channel}`,
    ephemeral: true
  });
});

// URUCHOMIENIE BOTA
client.login(process.env.TOKEN);
