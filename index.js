const http = require("http");
const {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

// =========================
// RENDER
// =========================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Render działa na porcie " + PORT);
});

// =========================
// DISCORD
// =========================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// =========================
// USTAWIENIA
// =========================

const PURPLE = 0x8B5CF6;

const VERIFIED_ROLE = "✅ użytkownik";

const TITAN = "<:TitanHolo:1536522515092873319>";
const BLIK = "<:Blik:1536522618348380331>";
const PSC = "<:Psc:1536522696542781450>";
const MYPSC = "<:Mypsc:1536522757595078727>";

const invites = new Map();
const daily = new Map();
const legitRequests = new Set();
const giveawayUsers = new Set();

function admin(member) {
  return member.permissions.has(
    PermissionsBitField.Flags.Administrator
  );
}

function findChannel(guild, name) {
  return guild.channels.cache.find(
    c =>
      c.name === name &&
      c.type === ChannelType.GuildText
  );
}

// =========================
// READY
// =========================

client.once("ready", async () => {
  console.log("🤖 TITAN MARKET BOT AKTYWNY: " + client.user.tag);

  for (const guild of client.guilds.cache.values()) {
    try {
      const list = await guild.invites.fetch();

      invites.set(
        guild.id,
        new Map(
          list.map(i => [i.code, i.uses || 0])
        )
      );
    } catch {
      console.log("⚠️ Nie można pobrać zaproszeń.");
    }
  }
});

// =========================
// NOWA OSOBA
// =========================

client.on("guildMemberAdd", async member => {
  try {
    const lobby = findChannel(member.guild, "lobby");

    if (!lobby) return;

    await lobby.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("👋 NOWA OSOBA")
          .setDescription(
            `🎉 Witaj ${member}!\n\n` +
            `👤 **${member.user.tag}** dołączył na Titan Market.`
          )
          .setTimestamp()
      ]
    });
  } catch (e) {
    console.log("❌ Lobby:", e.message);
  }
});

// =========================
// KOMENDY
// =========================

client.on("messageCreate", async message => {
  if (message.author.bot || !message.guild) return;

  const cmd = message.content.trim();

  // PING
  if (cmd === "!ping") {
    return message.reply("🏓 **PONG! Bot działa!**");
  }

  // LOBBY
  if (cmd === "!lobby") {
    if (!admin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("👋 WITAMY NA TITAN MARKET")
          .setDescription(
            "💜 **Witaj na Titan Market!**\n\n" +
            "🛒 Titan Market\n" +
            "🎫 Tickety\n" +
            "🎁 Konkursy i dropy\n" +
            "⭐ Vouch / LEGIT\n" +
            "🛡️ Weryfikacja"
          )
      ]
    });
  }

  // WERYFIKACJA
  if (cmd === "!weryfikacja") {
    const button = new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("Zweryfikuj się")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🛡️ WERYFIKACJA")
          .setDescription(
            "Kliknij **✅ Zweryfikuj się**, aby otrzymać rolę:\n\n" +
            `**${VERIFIED_ROLE}**`
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // CENNIK
  if (cmd === "!cennik") {
    const button = new ButtonBuilder()
      .setCustomId("price_ticket")
      .setLabel("Otwórz ticket")
      .setEmoji("🎫")
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🛒 CENNIK — CASE PARADISE")
          .setDescription(
            `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
            "💰 Kup dowolną liczbę Titanów.\n\n" +
            "🎫 Kliknij przycisk poniżej, aby rozpocząć zakup."
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // PŁATNOŚCI
  if (cmd === "!platnosci") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💳 METODY PŁATNOŚCI")
          .setDescription(
            `${BLIK} **BLIK — 0%**\n\n` +
            `${PSC} **PSC — 15%**\n\n` +
            `${MYPSC} **MYPSC — 25%**`
          )
      ]
    });
  }

  // TICKET
  if (cmd === "!ticket") {
    return sendTicketMenu(message.channel);
  }

  // ZAPROSZENIA
  if (cmd === "!zaproszenia" || cmd === "!sprawdz") {
    const key = message.guild.id + "-" + message.author.id;
    const count = invites.get(key) || 0;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📨 TWOJE ZAPROSZENIA")
          .setDescription(
            `${message.author}\n\n` +
            `👥 Zaproszenia: **${count}**`
          )
      ]
    });
  }

  // DROP
  if (cmd === "!drop") {
    const button = new ButtonBuilder()
      .setCustomId("drop")
      .setLabel("Wylosuj")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Primary);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎁 DROP TITAN MARKET")
          .setDescription(
            "🍀 Spróbuj szczęścia!\n\n" +
            "Kliknij **🎁 Wylosuj**."
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // KONKURS
  if (cmd === "!konkursy") {
    if (!admin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    giveawayUsers.clear();

    const button = new ButtonBuilder()
      .setCustomId("giveaway")
      .setLabel("Weź udział")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎉 KONKURS TITAN MARKET")
          .setDescription(
            "🔥 Konkurs wystartował!\n\n" +
            "Kliknij **🎉 Weź udział**."
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // LEGIT
  if (cmd === "!legit") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ CZY JESTEŚMY LEGIT?")
          .setDescription(
            "Prawdziwe potwierdzenia klientów znajdują się na kanale **vouch**.\n\n" +
            "⭐ Potwierdzenia są dodawane po akceptacji klienta."
          )
      ]
    });
  }

  // POTWIERDŹ KLIENTA
  if (cmd.startsWith("!potwierdz")) {
    if (!admin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    const user = message.mentions.users.first();

    if (!user) {
      return message.reply(
        "❌ Użycie: `!potwierdz @klient`"
      );
    }

    legitRequests.add(
      message.guild.id + "-" + user.id
    );

    const button = new ButtonBuilder()
      .setCustomId("legit_" + user.id)
      .setLabel("Potwierdzam transakcję")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ POTWIERDZENIE TRANSAKCJI")
          .setDescription(
            `👤 Klient: <@${user.id}>\n\n` +
            "Jeżeli wszystko przebiegło prawidłowo, " +
            "klient może kliknąć przycisk poniżej."
          )
      ],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // DAILY
  if (cmd === "!daily") {
    const date = new Date().toLocaleDateString("pl-PL");
    const count = daily.get(date) || 0;

    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💰 DAILY — TITAN MARKET")
          .setDescription(
            `📅 **${date}**\n\n` +
            `🛒 Potwierdzonych zakupów: **${count}**`
          )
      ]
    });
  }

  // DODANIE ZAKUPU DO DAILY
  if (cmd === "!zakup") {
    if (!admin(message.member)) {
      return message.reply("❌ Tylko administracja.");
    }

    const date = new Date().toLocaleDateString("pl-PL");
    const count = daily.get(date) || 0;

    daily.set(date, count + 1);

    return message.reply(
      `✅ Dodano zakup do DAILY. Razem: **${count + 1}**`
    );
  }

  // REGULAMIN
  if (cmd === "!regulamin") {
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📜 REGULAMIN TITAN MARKET")
          .setDescription(
            "**§1 OGÓLNE**\n" +
            "• Przestrzegaj zasad Discorda i serwera.\n" +
            "• Szanuj innych użytkowników.\n" +
            "• Zakaz podszywania się pod administrację.\n\n" +

            "**§2 KULTURA**\n" +
            "• Zakaz wyzywania i nękania.\n" +
            "• Zakaz prowokowania.\n" +
            "• Zakaz treści pełnych nienawiści.\n" +
            "• Zakaz NSFW w nieprzeznaczonych kanałach.\n\n" +

            "**§3 SPAM I REKLAMY**\n" +
            "• Zakaz spamu i floodu.\n" +
            "• Zakaz reklam bez zgody administracji.\n" +
            "• Zakaz masowego oznaczania.\n\n" +

            "**§4 BEZPIECZEŃSTWO**\n" +
            "• Nigdy nie podawaj hasła ani kodu logowania.\n" +
            "• Nie klikaj podejrzanych linków.\n" +
            "• Nie próbuj kraść danych innych osób.\n\n" +

            "**§5 TICKETY**\n" +
            "• Ticket służy do konkretnej sprawy.\n" +
            "• Nie twórz wielu ticketów bez powodu.\n" +
            "• Zakaz fałszywych dowodów płatności.\n" +
            "• Ticket zamyka tylko administracja.\n\n" +

            "**§6 VOUCH / LEGIT**\n" +
            "• Vouch tylko za prawdziwą transakcję.\n" +
            "• Zakaz fałszywych opinii.\n" +
            "• Zakaz wymuszania Vouchów.\n\n" +

            "**§7 ZAPROSZENIA**\n" +
            "• Zakaz fałszywych zaproszeń.\n" +
            "• Zakaz nabijania zaproszeń dodatkowymi kontami.\n\n" +

            "**§8 KONKURSY**\n" +
            "• Zakaz używania dodatkowych kont do zdobywania nagród.\n" +
            "• Oszustwa mogą skutkować dyskwalifikacją.\n\n" +

            "**§9 KARY**\n" +
            "• Ostrzeżenie\n" +
            "• Timeout\n" +
            "• Kick\n" +
            "• Ban\n\n" +

            "💜 **Titan Market — szanuj innych i przestrzegaj zasad.**"
          )
      ]
    });
  }
});

// =========================
// MENU TICKET
// =========================

async function sendTicketMenu(channel) {
  const menu = new StringSelectMenuBuilder()
    .setCustomId("ticket_menu")
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

  await channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 TITAN MARKET — TICKET")
        .setDescription(
          `${BLIK} **BLIK — 0%**\n` +
          `${PSC} **PSC — 15%**\n` +
          `${MYPSC} **MYPSC — 25%**\n\n` +
          "🎫 Wybierz kategorię z menu."
        )
    ],
    components: [
      new ActionRowBuilder().addComponents(menu)
    ]
  });
}

// =========================
// INTERAKCJE
// =========================

client.on("interactionCreate", async interaction => {

  // WERYFIKACJA
  if (
    interaction.isButton() &&
    interaction.customId === "verify"
  ) {
    const role = interaction.guild.roles.cache.find(
      r => r.name === VERIFIED_ROLE
    );

    if (!role) {
      return interaction.reply({
        content: `❌ Nie znaleziono roli **${VERIFIED_ROLE}**.`,
        ephemeral: true
      });
    }

    const bot = interaction.guild.members.me;

    if (
      !bot ||
      role.position >= bot.roles.highest.position
    ) {
      return interaction.reply({
        content:
          "❌ Przenieś rolę bota wyżej niż rolę `✅ użytkownik`.",
        ephemeral: true
      });
    }

    try {
      await interaction.member.roles.add(role);

      return interaction.reply({
        content: "✅ **Zweryfikowano!**",
        ephemeral: true
      });
    } catch (e) {
      console.log("❌ Rola:", e.message);

      return interaction.reply({
        content: "❌ Bot nie może nadać tej roli.",
        ephemeral: true
      });
    }
  }

  // CENNIK -> TICKET
  if (
    interaction.isButton() &&
    interaction.customId === "price_ticket"
  ) {
    await sendTicketMenu(interaction.channel);

    return interaction.reply({
      content: "🎫 Wybierz kategorię ticketu powyżej.",
      ephemeral: true
    });
  }

  // DROP
  if (
    interaction.isButton() &&
    interaction.customId === "drop"
  ) {
    if (Math.random() < 0.05) {
      return interaction.reply({
        content: "🎉 **GRATULACJE! Wygrałeś 5% zniżki!**",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: "😢 Tym razem się nie udało!",
      ephemeral: true
    });
  }

  // KONKURS
  if (
    interaction.isButton() &&
    interaction.customId === "giveaway"
  ) {
    if (giveawayUsers.has(interaction.user.id)) {
      return interaction.reply({
        content: "⚠️ Już bierzesz udział!",
        ephemeral: true
      });
    }

    giveawayUsers.add(interaction.user.id);

    return interaction.reply({
      content: "🎉 **Dołączono do konkursu!**",
      ephemeral: true
    });
  }

  // LEGIT
  if (
    interaction.isButton() &&
    interaction.customId.startsWith("legit_")
  ) {
    const id = interaction.customId.replace("legit_", "");

    if (interaction.user.id !== id) {
      return interaction.reply({
        content: "❌ Ten przycisk nie jest dla Ciebie.",
        ephemeral: true
      });
    }

    const key = interaction.guild.id + "-" + id;

    if (!legitRequests.has(key)) {
      return interaction.reply({
        content: "❌ To potwierdzenie już nie jest aktywne.",
        ephemeral: true
      });
    }

    const vouch = findChannel(
      interaction.guild,
      "vouch"
    );

    if (!vouch) {
      return interaction.reply({
        content: "❌ Nie znaleziono kanału `vouch`.",
        ephemeral: true
      });
    }

    await vouch.send({
      embeds: [
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ POTWIERDZONA TRANSAKCJA")
          .setDescription(
            `👤 Klient: ${interaction.user}\n\n` +
            "✅ Klient potwierdził poprawną transakcję.\n\n" +
            "💜 Titan Market"
          )
          .setTimestamp()
      ]
    });

    legitRequests.delete(key);

    return interaction.reply({
      content:
        "⭐ Dziękujemy! Potwierdzenie zostało dodane do `vouch`.",
      ephemeral: true
    });
  }

  // WYBÓR TICKETU
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_menu"
  ) {
    const category = interaction.values[0];

    const already = interaction.guild.channels.cache.find(
      c =>
        c.topic ===
        "ticket-" + interaction.user.id
    );

    if (already) {
      return interaction.reply({
        content: `❌ Masz już ticket: ${already}`,
        ephemeral: true
      });
    }

    const names = {
      zakup: "zakup-titan",
      nagroda: "nagroda",
      pomoc: "pomoc",
      wspolpraca: "wspolpraca"
    };

    try {
      const channel =
        await interaction.guild.channels.create({
          name: "🎫・" + names[category],
          type: ChannelType.GuildText,
          topic:
            "ticket-" + interaction.user.id,

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

      const close = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Zamknij ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      let text = "";

      if (category === "zakup") {
        text =
          `${TITAN} **ZAKUP TITAN HOLO**\n\n` +
          `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
          `${BLIK} BLIK — 0%\n` +
          `${PSC} PSC — 15%\n` +
          `${MYPSC} MYPSC — 25%\n\n` +
          "💬 Napisz, ile Titanów chcesz kupić.";
      }

      if (category === "nagroda") {
        text =
          "🎁 **NAGRODA**\n\n" +
          "Napisz, jaką nagrodę chcesz odebrać.";
      }

      if (category === "pomoc") {
        text =
          "🛠️ **POMOC**\n\n" +
          "Opisz swój problem.";
      }

      if (category === "wspolpraca") {
        text =
          "🤝 **WSPÓŁPRACA**\n\n" +
          "Napisz swoją propozycję.";
      }

      await channel.send({
        content: `${interaction.user}`,
        embeds: [
          new EmbedBuilder()
            .setColor(PURPLE)
            .setTitle("🎫 TITAN MARKET")
            .setDescription(text)
        ],
        components: [
          new ActionRowBuilder().addComponents(close)
        ]
      });

      return interaction.reply({
        content: `✅ Ticket utworzony: ${channel}`,
        ephemeral: true
      });

    } catch (e) {
      console.log("❌ Ticket:", e);

      return interaction.reply({
        content:
          "❌ Nie udało się utworzyć ticketu. Sprawdź uprawnienia bota.",
        ephemeral: true
      });
    }
  }

  // ZAMYKANIE TICKETU
  if (
    interaction.isButton() &&
    interaction.customId === "close_ticket"
  ) {
    if (!admin(interaction.member)) {
      return interaction.reply({
        content:
          "❌ **Tylko administracja może zamknąć ticket.**",
        ephemeral: true
      });
    }

    await interaction.reply(
      "🔒 Ticket zostanie zamknięty za 3 sekundy."
    );

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

// =========================
// TOKEN
// =========================

if (!process.env.TOKEN) {
  console.error("❌ BRAK TOKEN W RENDER!");
  process.exit(1);
}

client.login(process.env.TOKEN)
  .then(() => {
    console.log("🔑 LOGOWANIE DISCORD OK");
  })
  .catch(error => {
    console.error("❌ BŁĄD TOKENU:", error.message);
    process.exit(1);
  });
