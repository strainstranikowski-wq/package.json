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

// ======================================================
// 🤖 AKTYWACJA BOTA
// ======================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ======================================================
// 📊 ZMIENNE
// ======================================================

const inviteCache = new Map();
const inviteCounts = new Map();

// ======================================================
// 🤖 BOT ONLINE
// ======================================================

client.once("ready", async () => {
  console.log(`🤖 TITAN MARKET BOT AKTYWNY: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();

      inviteCache.set(
        guild.id,
        new Map(
          invites.map(invite => [
            invite.code,
            {
              uses: invite.uses || 0,
              inviter: invite.inviter?.id
            }
          ])
        )
      );
    } catch (error) {
      console.log("❌ Nie udało się pobrać zaproszeń.");
    }
  }
});

// ======================================================
// 👋 LOBBY + ZAPROSZENIA
// ======================================================

client.on("guildMemberAdd", async (member) => {
  try {
    const guild = member.guild;

    const oldInvites =
      inviteCache.get(guild.id) || new Map();

    const newInvites = await guild.invites.fetch();

    let usedInvite = null;

    for (const invite of newInvites.values()) {
      const old = oldInvites.get(invite.code);

      if (
        invite.uses &&
        (!old || invite.uses > old.uses)
      ) {
        usedInvite = invite;
        break;
      }
    }

    inviteCache.set(
      guild.id,
      new Map(
        newInvites.map(invite => [
          invite.code,
          {
            uses: invite.uses || 0,
            inviter: invite.inviter?.id
          }
        ])
      )
    );

    let inviterText = "❓ Nie udało się ustalić zaproszenia.";

    if (usedInvite?.inviter) {
      const inviterId = usedInvite.inviter;

      const current =
        inviteCounts.get(`${guild.id}-${inviterId}`) || 0;

      inviteCounts.set(
        `${guild.id}-${inviterId}`,
        current + 1
      );

      inviterText =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Zaproszenia: **${current + 1}**`;
    }

    const lobby = guild.channels.cache.find(
      channel =>
        channel.name === "lobby" &&
        channel.type === ChannelType.GuildText
    );

    if (lobby) {
      const embed = new EmbedBuilder()
        .setTitle("👋 NOWA OSOBA NA SERWERZE")
        .setDescription(
          `👤 **${member.user}** właśnie dołączył!\n\n` +
          `${inviterText}\n\n` +
          `🎉 Witamy na **Titan Market**!`
        );

      await lobby.send({
        embeds: [embed]
      });
    }

  } catch (error) {
    console.log("❌ Błąd lobby:", error);
  }
});

// ======================================================
// 🏓 !PING
// ======================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.content === "!ping") {
    return message.reply("🏓 Pong! Bot działa!");
  }

  // ====================================================
  // 🎫 !TICKET
  // ====================================================

  if (message.content === "!ticket") {

    const embed = new EmbedBuilder()
      .setTitle("🎫 TITAN MARKET")
      .setDescription(
        "## 🎫 OTWÓRZ TICKET\n\n" +
        "Wybierz metodę płatności poniżej."
      );

    const menu = new StringSelectMenuBuilder()
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
            id: "1536522757595078727",
            name: "Mypsc"
          }
        }
      ]);

    await message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });

    return;
  }

  // ====================================================
  // 📊 !ZAPROSZENIA
  // ====================================================

  if (message.content === "!zaproszenia") {

    const count =
      inviteCounts.get(
        `${message.guild.id}-${message.author.id}`
      ) || 0;

    return message.reply(
      `📨 **Twoje zaproszenia:** ${count}`
    );
  }

  // ====================================================
  // 🎁 !DROP
  // ====================================================

  if (message.content === "!drop") {

    const chance = Math.random();

    if (chance <= 0.05) {
      return message.reply(
        "🎉 **GRATULACJE!**\n\n" +
        "🎁 Wygrałeś **5% ZNIŻKI**!\n" +
        "💰 Zniżkę możesz wykorzystać przy zakupie."
      );
    }

    return message.reply(
      "❌ Niestety tym razem się nie udało.\n" +
      "🍀 Spróbuj ponownie później!"
    );
  }

  // ====================================================
  // 💰 !DAILY
  // ====================================================

  if (message.content === "!daily") {

    const key =
      `daily-${message.guild.id}-${message.author.id}`;

    if (!global.dailyCooldown) {
      global.dailyCooldown = new Map();
    }

    if (global.dailyCooldown.has(key)) {
      return message.reply(
        "⏰ Daily zostało już odebrane. Spróbuj później."
      );
    }

    global.dailyCooldown.set(key, Date.now());

    setTimeout(() => {
      global.dailyCooldown.delete(key);
    }, 24 * 60 * 60 * 1000);

    return message.reply(
      "💰 **DAILY TITAN MARKET**\n\n" +
      "🎁 Odebrano dzisiejszą nagrodę!"
    );
  }

  // ====================================================
  // 🛒 !CENNIK
  // ====================================================

  if (message.content === "!cennik") {

    const embed = new EmbedBuilder()
      .setTitle("🛒 CENNIK CASE PARADISE")
      .setDescription(
        "<:TitanHolo:1536522515092873319> **1 TITAN = 1 ZŁ**\n\n" +
        "💰 Kupujesz tyle Titanów, ile potrzebujesz.\n\n" +
        "🎫 Aby kupić, użyj **!ticket**."
      );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // 💳 !PLATNOSCI
  // ====================================================

  if (message.content === "!platnosci") {

    const embed = new EmbedBuilder()
      .setTitle("💳 METODY PŁATNOŚCI")
      .setDescription(
        "<:Blik:1536522618348380331> **BLIK — 0% PROWIZJI**\n\n" +
        "<:Psc:1536522696542781450> **PSC — 15% PROWIZJI**\n\n" +
        "<:Mypsc:1536522757595078727> **MYPSC — 25% PROWIZJI**"
      );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // 📜 !REGULAMIN
  // ====================================================

  if (message.content === "!regulamin") {

    const embed = new EmbedBuilder()
      .setTitle("📜 REGULAMIN TITAN MARKET")
      .setDescription(
        "1️⃣ Zakaz oszustw.\n\n" +
        "2️⃣ Zakaz fałszywych płatności.\n\n" +
        "3️⃣ Zakaz spamu.\n\n" +
        "4️⃣ Szanuj innych użytkowników.\n\n" +
        "5️⃣ Administracja może zamknąć ticket w przypadku łamania regulaminu."
      );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // ⭐ !LEGIT
  // ====================================================

  if (message.content === "!legit") {

    const embed = new EmbedBuilder()
      .setTitle("⭐ CZY JESTEŚMY LEGIT?")
      .setDescription(
        "Chcesz zobaczyć opinie klientów?\n\n" +
        "Kliknij przycisk poniżej, aby przejść do opinii."
      );

    const button = new ButtonBuilder()
      .setCustomId("show_vouches")
      .setLabel("Zobacz LEGIT")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ====================================================
  // 🎉 !KONKURSY
  // ====================================================

  if (message.content === "!konkursy") {

    const embed = new EmbedBuilder()
      .setTitle("🎉 KONKURSY")
      .setDescription(
        "🏆 Aktualne konkursy Titan Market\n\n" +
        "📢 Informacje o nowych konkursach będą publikowane tutaj."
      );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // ✅ !WERYFIKACJA
  // ====================================================

  if (message.content === "!weryfikacja") {

    const embed = new EmbedBuilder()
      .setTitle("✅ WERYFIKACJA")
      .setDescription(
        "Kliknij przycisk poniżej, aby się zweryfikować."
      );

    const button = new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("Weryfikuj się")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }
});

// ======================================================
// 🎫 INTERAKCJE
// ======================================================

client.on("interactionCreate", async (interaction) => {

  // ====================================================
  // 💳 WYBÓR PŁATNOŚCI
  // ====================================================

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

    const existing = interaction.guild.channels.cache.find(
      channel =>
        channel.topic ===
        `ticket-${interaction.user.id}`
    );

    if (existing) {
      return interaction.reply({
        content:
          `❌ Masz już otwarty ticket: ${existing}`,
        ephemeral: true
      });
    }

    const channel =
      await interaction.guild.channels.create({
        name: names[method],
        type: ChannelType.GuildText,
        topic:
          `ticket-${interaction.user.id}`,

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

    const closeButton =
      new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Zamknij ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

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

    const ticketEmbed =
      new EmbedBuilder()
        .setTitle("🎫 TITAN MARKET")
        .setDescription(
          "# 🛒 ZAKUP TITAN\n\n" +
          paymentText +
          "\n\n" +
          "<:TitanHolo:1536522515092873319> **1 TITAN = 1 ZŁ**\n\n" +
          "Napisz, ile Titanów chcesz kupić."
        );

    await channel.send({
      content: `${interaction.user}`,
      embeds: [ticketEmbed],
      components: [
        new ActionRowBuilder()
          .addComponents(closeButton)
      ]
    });

    await interaction.reply({
      content:
        `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });

    return;
  }

  // ====================================================
  // 🔒 ZAMKNIĘCIE TICKETU
  // ====================================================

  if (
    interaction.isButton() &&
    interaction.customId === "close_ticket"
  ) {

    await interaction.reply({
      content:
        "🔒 Ticket zostanie zamknięty za 3 sekundy..."
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch (error) {
        console.log(
          "❌ Błąd zamykania ticketu:",
          error
        );
      }
    }, 3000);

    return;
  }

  // ====================================================
  // ⭐ LEGIT / VOUCH
  // ====================================================

  if (
    interaction.isButton() &&
    interaction.customId === "show_vouches"
  ) {

    const vouchChannel =
      interaction.guild.channels.cache.find(
        channel =>
          channel.name === "vouch" &&
          channel.type === ChannelType.GuildText
      );

    if (!vouchChannel) {
      return interaction.reply({
        content:
          "❌ Nie znaleziono kanału #vouch.",
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        `⭐ Opinie klientów znajdziesz tutaj: ${vouchChannel}`,
      ephemeral: true
    });
  }

  // ====================================================
  // ✅ WERYFIKACJA
  // ====================================================

  if (
    interaction.isButton() &&
    interaction.customId === "verify"
  ) {

    await interaction.reply({
      content:
        "✅ Zostałeś zweryfikowany!",
      ephemeral: true
    });

    return;
  }
});

// ======================================================
// 🔐 LOGOWANIE BOTA
// ======================================================

client.login(process.env.TOKEN);
