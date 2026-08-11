const http = require("http");

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot is online!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Port ${PORT} działa`);
});

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

// =====================================================
// 🤖 AKTYWACJA BOTA
// =====================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =====================================================
// 💜 USTAWIENIA
// =====================================================

const PURPLE = 0x8B5CF6;

const TITAN_EMOJI =
  "<:TitanHolo:1536522515092873319>";

const BLIK_EMOJI =
  "<:Blik:1536522618348380331>";

const PSC_EMOJI =
  "<:Psc:1536522696542781450>";

const MYPSC_EMOJI =
  "<:Mypsc:1536522757595078727>";

// =====================================================
// 📊 DANE
// =====================================================

const inviteCounts = new Map();
const inviteCache = new Map();
const dailyPurchases = new Map();

const giveawayUsers = new Set();

let giveawayRunning = false;
let giveawayMessage = null;

// =====================================================
// 🤖 BOT GOTOWY
// =====================================================

client.once("ready", async () => {
  console.log(
    `🤖 TITAN MARKET BOT AKTYWNY: ${client.user.tag}`
  );

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
      console.log("⚠️ Nie można pobrać zaproszeń.");
    }
  }
});

// =====================================================
// 👋 LOBBY + ZAPROSZENIA
// =====================================================

client.on("guildMemberAdd", async (member) => {
  try {
    const guild = member.guild;

    const oldInvites =
      inviteCache.get(guild.id) || new Map();

    const newInvites =
      await guild.invites.fetch();

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

    let inviteText =
      "❓ Nie udało się ustalić zaproszenia.";

    if (usedInvite?.inviter) {
      const inviterId = usedInvite.inviter;
      const key = `${guild.id}-${inviterId}`;

      const count =
        (inviteCounts.get(key) || 0) + 1;

      inviteCounts.set(key, count);

      inviteText =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Ma teraz **${count} zaproszeń**`;
    }

    const lobby =
      guild.channels.cache.find(
        channel =>
          channel.name === "lobby" &&
          channel.type === ChannelType.GuildText
      );

    if (lobby) {
      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("👋 NOWA OSOBA")
          .setDescription(
            `🎉 Witaj ${member.user}!\n\n` +
            `👤 **${member.user.tag}** dołączył na serwer.\n\n` +
            inviteText
          )
          .setTimestamp();

      await lobby.send({
        embeds: [embed]
      });
    }
  } catch (error) {
    console.log("❌ Błąd lobby:", error);
  }
});

// =====================================================
// 💬 KOMENDY
// =====================================================

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  // 🏓 PING

  if (message.content === "!ping") {
    return message.reply(
      "🏓 **Pong! Titan Market Bot działa!**"
    );
  }

  // 🎫 TICKET

  if (message.content === "!ticket") {
    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 UTWÓRZ TICKET")
        .setDescription(
          "### 💳 METODY PŁATNOŚCI\n\n" +
          `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n` +
          `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n` +
          `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**\n\n` +
          "━━━━━━━━━━━━━━━━━━━━\n\n" +
          "### 🎫 WYBIERZ KATEGORIĘ\n" +
          "Wybierz odpowiednią kategorię poniżej."
        );

    const menu =
      new StringSelectMenuBuilder()
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

    await message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });

    return;
  }

  // 📩 SPRAWDZANIE ZAPROSZEŃ

  if (
    message.content === "!sprawdz" ||
    message.content === "!zaproszenia"
  ) {
    const key =
      `${message.guild.id}-${message.author.id}`;

    const count =
      inviteCounts.get(key) || 0;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📨 TWOJE ZAPROSZENIA")
        .setDescription(
          `${message.author}\n\n` +
          `📩 Zaproszenia: **${count}**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // 🛒 CENNIK

  if (message.content === "!cennik") {
    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🛒 CENNIK — CASE PARADISE")
        .setDescription(
          `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**\n\n` +
          "💰 Kupujesz tyle Titanów, ile potrzebujesz.\n\n" +
          "🎫 Aby kupić, użyj `!ticket`."
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // 💳 PŁATNOŚCI

  if (message.content === "!platnosci") {
    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("💳 METODY PŁATNOŚCI")
        .setDescription(
          `${BLIK_EMOJI} **BLIK**\n` +
          `> 0% prowizji\n\n` +
          `${PSC_EMOJI} **PSC**\n` +
          `> 15% prowizji\n\n` +
          `${MYPSC_EMOJI} **MYPSC**\n` +
          `> 25% prowizji`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // 📜 REGULAMIN

  if (message.content === "!regulamin") {
    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📜 REGULAMIN TITAN MARKET")
        .setDescription(
          "**1. Szanuj innych użytkowników.**\n" +
          "Zakaz wyzywania, prowokowania i spamowania.\n\n" +

          "**2. Zakaz oszustw.**\n" +
          "Nie wysyłaj fałszywych potwierdzeń płatności.\n\n" +

          "**3. Zakaz reklamowania innych serwerów.**\n" +
          "Bez zgody administracji nie reklamuj innych serwerów.\n\n" +

          "**4. Tickety.**\n" +
          "Opisz dokładnie, czego potrzebujesz i nie spamuj.\n\n" +

          "**5. Płatności.**\n" +
          "Podawaj prawdziwe informacje dotyczące płatności.\n\n" +

          "**6. Vouch.**\n" +
          "Zakaz fałszywych opinii.\n\n" +

          "**7. Konkursy i dropy.**\n" +
          "Każdy uczestnik musi przestrzegać zasad wydarzenia.\n\n" +

          "**8. Administracja.**\n" +
          "Administracja może zamknąć ticket w przypadku łamania regulaminu.\n\n" +

          "💜 Dołączając do Titan Market akceptujesz regulamin."
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // 🎁 DROP

  if (message.content === "!drop") {
    const button =
      new ButtonBuilder()
        .setCustomId("drop_button")
        .setLabel("Wylosuj")
        .setEmoji("🎁")
        .setStyle(ButtonStyle.Primary);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎁 DROP — 5% ZNIŻKI")
        .setDescription(
          "Masz szansę wygrać **5% zniżki**!\n\n" +
          "🍀 Szansa jest mała.\n" +
          "🎁 Kliknij **Wylosuj**."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // 🎉 KONKURSY

  if (message.content === "!konkursy") {
    giveawayUsers.clear();
    giveawayRunning = true;

    const button =
      new ButtonBuilder()
        .setCustomId("giveaway_join")
        .setLabel("Weź udział")
        .setEmoji("🎉")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎉 KONKURS TITAN MARKET")
        .setDescription(
          "🔥 Konkurs trwa!\n\n" +
          "Kliknij **🎉 Weź udział**.\n\n" +
          "👥 Uczestnicy: **0**"
        );

    giveawayMessage =
      await message.channel.send({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(button)
        ]
      });

    return;
  }

  // ⭐ CZY JESTEŚMY LEGIT

  if (message.content === "!legit") {
    const button =
      new ButtonBuilder()
        .setCustomId("show_vouch")
        .setLabel("Zobacz LEGIT")
        .setEmoji("⭐")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ CZY JESTEŚMY LEGIT?")
        .setDescription(
          "Chcesz zobaczyć opinie naszych klientów?\n\n" +
          "Kliknij przycisk poniżej."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ⭐ VOUCH

  if (message.content === "!vouch") {
    const button =
      new ButtonBuilder()
        .setCustomId("leave_vouch")
        .setLabel("LEGIT")
        .setEmoji("⭐")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ ZOSTAW VOUCH")
        .setDescription(
          "Jeśli wszystko przebiegło pomyślnie,\n" +
          "kliknij **⭐ LEGIT**."
        );

    return message.channel.send({
      embeds: [
        embed
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // 💰 DAILY

  if (message.content === "!daily") {
    const today =
      new Date().toLocaleDateString("pl-PL");

    const count =
      dailyPurchases.get(today) || 0;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("💰 DAILY — TITAN MARKET")
        .setDescription(
          `📅 **${today}**\n\n` +
          `🛒 Dzisiaj kupiło: **${count} osób**\n\n` +
          "🔄 Licznik resetuje się każdego dnia."
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ✅ POTWIERDZENIE ZAKUPU

  if (message.content === "!potwierdz") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      return message.reply(
        "❌ Tylko administracja może potwierdzić zakup."
      );
    }

    const today =
      new Date().toLocaleDateString("pl-PL");

    const count =
      dailyPurchases.get(today) || 0;

    dailyPurchases.set(
      today,
      count + 1
    );

    return message.reply(
      `✅ Zakup potwierdzony!\n` +
      `🛒 Dzisiejsze zakupy: **${count + 1}**`
    );
  }
});

// =====================================================
// 🎫 INTERAKCJE
// =====================================================

client.on("interactionCreate", async (interaction) => {

  // 🎫 WYBÓR KATEGORII

  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_category"
  ) {

    const category =
      interaction.values[0];

    const names = {
      zakup: "🛒・zakup-titan-holo",
      nagroda: "🎁・nagroda",
      pomoc: "🛠️・pomoc",
      wspolpraca: "🤝・wspolpraca"
    };

    const existing =
      interaction.guild.channels.cache.find(
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
        name: names[category],
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

    let description = "";

    if (category === "zakup") {
      description =
        `# ${TITAN_EMOJI} ZAKUP TITAN HOLO\n\n` +
        "### 💳 METODY PŁATNOŚCI\n\n" +
        `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n` +
        `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n` +
        `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**\n\n` +
        `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**`;
    }

    if (category === "nagroda") {
      description =
        "# 🎁 NAGRODA\n\n" +
        "Opisz, jaką nagrodę chcesz odebrać.";
    }

    if (category === "pomoc") {
      description =
        "# 🛠️ POMOC\n\n" +
        "Opisz swój problem.";
    }

    if (category === "wspolpraca") {
      description =
        "# 🤝 WSPÓŁPRACA\n\n" +
        "Opisz swoją propozycję współpracy.";
    }

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 TITAN MARKET")
        .setDescription(description);

    await channel.send({
      content: `${interaction.user}`,
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(closeButton)
      ]
    });

    await interaction.reply({
      content:
        `✅ Ticket utworzony: ${channel}`,
      ephemeral: true
    });

    return;
  }

  // 🔒 ZAMKNIĘCIE TICKETU

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

  // 🎁 DROP

  if (
    interaction.isButton() &&
    interaction.customId === "drop_button"
  ) {

    const won =
      Math.random() <= 0.05;

    if (won) {
      return interaction.reply({
        content:
          "🎉 **GRATULACJE!**\n\n" +
          "🎁 Wygrałeś **5% ZNIŻKI**!",
        ephemeral: true
      });
    }

    return interaction.reply({
      content:
        "❌ Tym razem się nie udało!\n" +
        "🍀 Spróbuj ponownie później.",
      ephemeral: true
    });
  }

  // 🎉 KONKURS

  if (
    interaction.isButton() &&
    interaction.customId === "giveaway_join"
  ) {

    if (!giveawayRunning) {
      return interaction.reply({
        content:
          "❌ Ten konkurs jest już zakończony.",
        ephemeral: true
      });
    }

    if (giveawayUsers.has(interaction.user.id)) {
      return interaction.reply({
        content:
          "❌ Już bierzesz udział w konkursie!",
        ephemeral: true
      });
    }

    giveawayUsers.add(
      interaction.user.id
    );

    if (giveawayMessage) {

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎉 KONKURS TITAN MARKET")
          .setDescription(
            "🔥 Konkurs trwa!\n\n" +
            "Kliknij **🎉 Weź udział**.\n\n" +
            `👥 Uczestnicy: **${giveawayUsers.size}**`
          );

      await giveawayMessage.edit({
        embeds: [embed]
      });
    }

    return interaction.reply({
      content:
        "🎉 Zostałeś dodany do konkursu!",
      ephemeral: true
    });
  }

  // ⭐ VOUCH

  if (
    interaction.isButton() &&
    interaction.customId === "leave_vouch"
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

    const vouchEmbed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ NOWY VOUCH")
        .setDescription(
          `👤 Klient: ${interaction.user}\n\n` +
          "💜 **LEGIT / POZYTYWNA OPINIA**\n\n" +
          "Dziękujemy za zakup w Titan Market!"
        )
        .setTimestamp();

    await vouchChannel.send({
      embeds: [vouchEmbed]
    });

    return interaction.reply({
      content:
        "⭐ Dzięki! Twój Vouch został dodany!",
      ephemeral: true
    });
  }

  // ⭐ POKAŻ VOUCH

  if (
    interaction.isButton() &&
    interaction.customId === "show_vouch"
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
        `⭐ Opinie znajdziesz tutaj: ${vouchChannel}`,
      ephemeral: true
    });
  }
});

// =====================================================
// 🔐 URUCHOMIENIE
// =====================================================

client.login(process.env.TOKEN);
