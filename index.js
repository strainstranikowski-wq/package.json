const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// AKTYWACJA BOTA
// =========================

client.once("ready", () => {
  console.log(`🤖 Titan Market Bot aktywny jako ${client.user.tag}`);
});

// =========================
// !PING + !TICKET
// =========================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // !PING
  if (message.content === "!ping") {
    return message.reply("🏓 Pong! Bot działa!");
  }

  // !TICKET
  if (message.content !== "!ticket") return;

  // =========================
  // MENU METOD PŁATNOŚCI
  // =========================

  const embed = new EmbedBuilder()
    .setTitle("💳 METODY PŁATNOŚCI")
    .setDescription(
      "## <:Blik:1536522618348380331> BLIK — 0% PROWIZJI\n\n" +
      "## <:Psc:1536522696542781450> PSC — 15% PROWIZJI\n\n" +
      "## <:Mypsc:1536522757595078727> MYPSC — 25% PROWIZJI"
    );

  const paymentMenu = new StringSelectMenuBuilder()
    .setCustomId("payment_method")
    .setPlaceholder("💳 METODY PŁATNOŚCI")
    .addOptions([
      {
        label: "BLIK — 0% PROWIZJI",
        value: "blik",
        emoji: {
          id: "1536522618348380331",
          name: "Blik"
        }
      },
      {
        label: "PSC — 15% PROWIZJI",
        value: "psc",
        emoji: {
          id: "1536522696542781450",
          name: "Psc"
        }
      },
      {
        label: "MYPSC — 25% PROWIZJI",
        value: "mypsc",
        emoji: {
          id: "1536522757592878727",
          name: "Mypsc"
        }
      }
    ]);

  const row = new ActionRowBuilder()
    .addComponents(paymentMenu);

  await message.channel.send({
    embeds: [embed],
    components: [row]
  });
});

// =========================
// INTERAKCJE
// =========================

client.on("interactionCreate", async (interaction) => {

  // =========================
  // WYBÓR PŁATNOŚCI
  // =========================

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "payment_method"
  ) {

    const method = interaction.values[0];

    const names = {
      blik: "💳・zakup-blik",
      psc: "💳・zakup-psc",
      mypsc: "💳・zakup-mypsc"
    };

    // Sprawdzenie istniejącego ticketu
    const existing = interaction.guild.channels.cache.find(
      channel => channel.topic === `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `❌ Masz już otwarty ticket: ${existing}`,
        ephemeral: true
      });
    }

    // =========================
    // TWORZENIE TICKETU
    // =========================

    const channel = await interaction.guild.channels.create({
      name: names[method],
      type: ChannelType.GuildText,
      topic: `ticket-${interaction.user.id}`,

      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [
            PermissionsBitField.Flags.ViewChannel
          ]
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

    // =========================
    // PRZYCISK ZAMKNIĘCIA
    // =========================

    const closeButton = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Zamknij ticket")
      .setEmoji("🔒")
      .setStyle(ButtonStyle.Danger);

    const closeRow = new ActionRowBuilder()
      .addComponents(closeButton);

    // =========================
    // WYBRANA METODA
    // =========================

    let paymentText = "";

    if (method === "blik") {
      paymentText =
        "<:Blik:1536522618348380331> **BLIK**\n" +
        "💰 **0% PROWIZJI**";
    }

    if (method === "psc") {
      paymentText =
        "<:Psc:1536522696542781450> **PSC**\n" +
        "💰 **15% PROWIZJI**";
    }

    if (method === "mypsc") {
      paymentText =
        "<:Mypsc:1536522757595078727> **MYPSC**\n" +
        "💰 **25% PROWIZJI**";
    }

    const ticketEmbed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET")
      .setDescription(
        "# 💳 ZAKUP TITAN HOLO\n\n" +
        paymentText +
        "\n\n" +
        "Napisz poniżej, czego potrzebujesz."
      );

    // =========================
    // WIADOMOŚĆ W TICKIECIE
    // =========================

    await channel.send({
      content: `${interaction.user}`,
      embeds: [ticketEmbed],
      components: [closeRow]
    });

    await interaction.reply({
      content: `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });

    return;
  }

  // =========================
  // ZAMKNIĘCIE TICKETU
  // =========================

  if (
    interaction.isButton() &&
    interaction.customId === "close_ticket"
  ) {

    await interaction.reply({
      content: "🔒 Ticket zostanie zamknięty za 3 sekundy..."
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.log("❌ Błąd podczas zamykania ticketu:", error);
      }
    }, 3000);

    return;
  }
});

// =========================
// AKTYWACJA / LOGOWANIE BOTA
// =========================

client.login(process.env.TOKEN);
