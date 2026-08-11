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
  EmbedBuilder,
  MessageFlags
} = require("discord.js");

// ======================================================
// RENDER - PORT
// ======================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Titan Market Bot ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 PORT ${PORT} DZIAŁA`);
});

// ======================================================
// USTAWIENIA
// ======================================================

const PURPLE = 0x8B5CF6;

const VERIFIED_ROLE = "✅ użytkownik";

const TITAN_EMOJI = "<:TitanHolo:1536522515092873319>";
const BLIK_EMOJI = "<:Blik:1536522618348380331>";
const PSC_EMOJI = "<:Psc:1536522696542781450>";
const MYPSC_EMOJI = "<:Mypsc:1536522757595078727>";

// ======================================================
// DANE
// ======================================================

const inviteCache = new Map();
const inviteCounts = new Map();

const dailyPurchases = new Map();

const giveawayUsers = new Set();

const vouchUsers = new Set();

// ======================================================
// CLIENT
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
// READY
// ======================================================

client.once("ready", async () => {
  console.log(`🤖 BOT AKTYWNY: ${client.user.tag}`);

  client.user.setActivity("Titan Market", {
    type: 3
  });

  // Zapamiętanie aktualnych zaproszeń
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
              inviter: invite.inviter?.id || null
            }
          ])
        )
      );
    } catch (error) {
      console.log(
        `⚠️ Nie można pobrać zaproszeń z ${guild.name}`
      );
    }
  }
});

// ======================================================
// LOBBY + ZAPROSZENIA
// ======================================================

client.on("guildMemberAdd", async member => {
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
            inviter: invite.inviter?.id || null
          }
        ])
      )
    );

    let inviteInfo =
      "❓ Nie udało się ustalić zaproszenia.";

    if (usedInvite?.inviter) {
      const inviterId =
        usedInvite.inviter;

      const key =
        `${guild.id}:${inviterId}`;

      const count =
        (inviteCounts.get(key) || 0) + 1;

      inviteCounts.set(key, count);

      inviteInfo =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Jego zaproszenia: **${count}**`;
    }

    const lobby =
      guild.channels.cache.find(
        channel =>
          channel.name === "lobby" &&
          channel.type === ChannelType.GuildText
      );

    if (!lobby) return;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("👋 NOWA OSOBA NA SERWERZE")
        .setDescription(
          `🎉 Witaj ${member}!\n\n` +
          `👤 **${member.user.tag}** właśnie dołączył.\n\n` +
          `${inviteInfo}`
        )
        .setTimestamp();

    await lobby.send({
      embeds: [embed]
    });

  } catch (error) {
    console.log("❌ LOBBY ERROR:", error.message);
  }
});

// ======================================================
// KOMENDY
// ======================================================

client.on("messageCreate", async message => {

  if (message.author.bot) return;

  // ====================================================
  // PING
  // ====================================================

  if (message.content === "!ping") {
    return message.reply(
      "🏓 **Pong! Titan Market Bot działa!**"
    );
  }

  // ====================================================
  // WERYFIKACJA
  // ====================================================

  if (message.content === "!weryfikacja") {

    const button =
      new ButtonBuilder()
        .setCustomId("verify_user")
        .setLabel("Zweryfikuj się")
        .setEmoji("✅")
        .setStyle(ButtonStyle.Success);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🛡️ WERYFIKACJA TITAN MARKET")
        .setDescription(
          "## 🔐 WERYFIKACJA\n\n" +
          "Kliknij przycisk poniżej, aby się zweryfikować.\n\n" +
          "✅ Po weryfikacji otrzymasz rolę:\n" +
          `**${VERIFIED_ROLE}**\n\n` +
          "💜 Witamy na Titan Market!"
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(button)
      ]
    });
  }

  // ====================================================
  // TICKET
  // ====================================================

  if (message.content === "!ticket") {

    const menu =
      new StringSelectMenuBuilder()
        .setCustomId("ticket_category")
        .setPlaceholder("🎫 Wybierz kategorię")
        .addOptions([
          {
            label: "Zakup Titan Holo",
            value: "zakup",
            description: "Kup Titan Holo",
            emoji: {
              id: "1536522515092873319",
              name: "TitanHolo"
            }
          },
          {
            label: "Nagroda",
            value: "nagroda",
            description: "Odbiór nagrody",
            emoji: "🎁"
          },
          {
            label: "Pomoc",
            value: "pomoc",
            description: "Potrzebujesz pomocy",
            emoji: "🛠️"
          },
          {
            label: "Współpraca",
            value: "wspolpraca",
            description: "Propozycja współpracy",
            emoji: "🤝"
          }
        ]);

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 TITAN MARKET — TICKET")
        .setDescription(
          "## 💳 METODY PŁATNOŚCI\n\n" +
          `${BLIK_EMOJI} **BLIK — 0% prowizji**\n` +
          `${PSC_EMOJI} **PSC — 15% prowizji**\n` +
          `${MYPSC_EMOJI} **MYPSC — 25% prowizji**\n\n` +
          "━━━━━━━━━━━━━━━━━━\n\n" +
          "## 🎫 WYBIERZ KATEGORIĘ\n\n" +
          "Wybierz kategorię z menu poniżej."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(menu)
      ]
    });
  }

  // ====================================================
  // SPRAWDŹ ZAPROSZENIA
  // ====================================================

  if (
    message.content === "!sprawdz" ||
    message.content === "!zaproszenia"
  ) {

    const key =
      `${message.guild.id}:${message.author.id}`;

    const count =
      inviteCounts.get(key) || 0;

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📨 TWOJE ZAPROSZENIA")
        .setDescription(
          `${message.author}\n\n` +
          `👥 Zaproszenia: **${count}**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // CENNIK
  // ====================================================

  if (message.content === "!cennik") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🛒 CENNIK — CASE PARADISE")
        .setDescription(
          `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**\n\n` +
          `${TITAN_EMOJI} 1 Titan → **1 zł**\n` +
          `${TITAN_EMOJI} 10 Titanów → **10 zł**\n` +
          `${TITAN_EMOJI} 50 Titanów → **50 zł**\n\n` +
          "🎫 Zakup przez **!ticket**"
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // PŁATNOŚCI
  // ====================================================

  if (message.content === "!platnosci") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("💳 METODY PŁATNOŚCI")
        .setDescription(
          `${BLIK_EMOJI} **BLIK**\n` +
          `Prowizja: **0%**\n\n` +

          `${PSC_EMOJI} **PSC**\n` +
          `Prowizja: **15%**\n\n` +

          `${MYPSC_EMOJI} **MYPSC**\n` +
          `Prowizja: **25%**`
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // REGULAMIN
  // ====================================================

  if (message.content === "!regulamin") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("📜 REGULAMIN TITAN MARKET")
        .setDescription(
          "**§1 — POSTANOWIENIA OGÓLNE**\n\n" +
          "1.1. Każdy użytkownik ma obowiązek przestrzegać regulaminu.\n" +
          "1.2. Dołączenie do serwera oznacza akceptację zasad.\n" +
          "1.3. Nieznajomość regulaminu nie zwalnia z jego przestrzegania.\n" +
          "1.4. Administracja może reagować na sytuacje nieopisane w regulaminie.\n\n" +

          "**§2 — KULTURA OSOBISTA**\n\n" +
          "2.1. Zakaz obrażania innych użytkowników.\n" +
          "2.2. Zakaz prowokowania i nękania.\n" +
          "2.3. Zakaz spamu i floodu.\n" +
          "2.4. Zakaz celowego przeszkadzania innym.\n" +
          "2.5. Zakaz rozpowszechniania treści NSFW.\n\n" +

          "**§3 — REKLAMY**\n\n" +
          "3.1. Zakaz reklamowania innych serwerów bez zgody administracji.\n" +
          "3.2. Zakaz wysyłania reklam na DM użytkowników.\n" +
          "3.3. Zakaz spamowania linkami.\n\n" +

          "**§4 — TICKETY**\n\n" +
          "4.1. Ticket służy do kontaktu z administracją.\n" +
          "4.2. Nie twórz ticketów bez powodu.\n" +
          "4.3. Podaj dokładną liczbę Titanów podczas zakupu.\n" +
          "4.4. Zakaz wysyłania fałszywych potwierdzeń płatności.\n" +
          "4.5. Nie spamuj administracji.\n" +
          "4.6. Po zakończeniu sprawy ticket może zostać zamknięty.\n\n" +

          "**§5 — PŁATNOŚCI**\n\n" +
          "5.1. BLIK — 0% prowizji.\n" +
          "5.2. PSC — 15% prowizji.\n" +
          "5.3. MYPSC — 25% prowizji.\n" +
          "5.4. Nie wysyłaj danych płatniczych na publicznych kanałach.\n\n" +

          "**§6 — VOUCH / LEGIT**\n\n" +
          "6.1. Vouch powinien pochodzić z prawdziwej transakcji.\n" +
          "6.2. Zakaz fałszywych opinii.\n" +
          "6.3. Zakaz wymuszania Vouchów.\n\n" +

          "**§7 — DROP**\n\n" +
          "7.1. Drop posiada określoną szansę na wygraną.\n" +
          "7.2. Zakaz używania multikont do zdobywania nagród.\n" +
          "7.3. Nadużycia mogą skutkować anulowaniem nagrody.\n\n" +

          "**§8 — KONKURSY**\n\n" +
          "8.1. Każdy użytkownik może wziąć udział zgodnie z zasadami konkursu.\n" +
          "8.2. Zakaz używania multikont.\n" +
          "8.3. Administracja może zakończyć konkurs w przypadku nadużyć.\n\n" +

          "**§9 — ZAPROSZENIA**\n\n" +
          "9.1. Zakaz fake invite.\n" +
          "9.2. Zakaz spamowania zaproszeniami.\n" +
          "9.3. Nieuczciwe zaproszenia mogą zostać usunięte.\n\n" +

          "**§10 — BEZPIECZEŃSTWO**\n\n" +
          "10.1. Nie podawaj nikomu hasła.\n" +
          "10.2. Administracja nigdy nie prosi o hasło.\n" +
          "10.3. Nie klikaj podejrzanych linków.\n\n" +

          "**§11 — KARY**\n\n" +
          "11.1. Ostrzeżenie.\n" +
          "11.2. Mute.\n" +
          "11.3. Kick.\n" +
          "11.4. Ban.\n\n" +

          "💜 **Titan Market — przestrzegaj zasad i baw się dobrze!**"
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // DROP
  // ====================================================

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
          "🍀 Masz małą szansę na wygranie **5% zniżki**.\n\n" +
          "🎁 Kliknij **Wylosuj**."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(button)
      ]
    });
  }

  // ====================================================
  // KONKURS
  // ====================================================

  if (message.content === "!konkursy") {

    giveawayUsers.clear();

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
          "🔥 **KONKURS ROZPOCZĘTY!**\n\n" +
          "Kliknij **🎉 Weź udział**.\n\n" +
          "👥 Uczestnicy: **0**"
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(button)
      ]
    });
  }

  // ====================================================
  // LOSOWANIE KONKURSU
  // ====================================================

  if (message.content === "!losuj") {

    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      return message.reply(
        "❌ Tylko administracja może losować."
      );
    }

    if (giveawayUsers.size === 0) {
      return message.reply(
        "❌ Nikt nie bierze udziału."
      );
    }

    const users =
      [...giveawayUsers];

    const winnerId =
      users[Math.floor(Math.random() * users.length)];

    giveawayUsers.clear();

    return message.channel.send(
      `🎉 **ZWYCIĘZCA KONKURSU!**\n\n` +
      `🏆 <@${winnerId}>`
    );
  }

  // ====================================================
  // CZY JESTEŚMY LEGIT
  // ====================================================

  if (message.content === "!legit") {

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("⭐ CZY JESTEŚMY LEGIT?")
        .setDescription(
          "Chcesz zobaczyć opinie klientów?\n\n" +
          "⭐ Wszystkie opinie znajdziesz na kanale **#vouch**.\n\n" +
          "💜 Titan Market"
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // VOUCH
  // ====================================================

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
          "Jeżeli transakcja przebiegła pomyślnie,\n\n" +
          "kliknij **⭐ LEGIT**."
        );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder()
          .addComponents(button)
      ]
    });
  }

  // ====================================================
  // DAILY
  // ====================================================

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
          "🔄 Każdy nowy dzień ma osobny licznik."
        );

    return message.channel.send({
      embeds: [embed]
    });
  }

  // ====================================================
  // POTWIERDŹ ZAKUP
  // ====================================================

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
      `✅ Zakup zapisany!\n` +
      `🛒 Dzisiejsze zakupy: **${count + 1}**`
    );
  }
});

// ======================================================
// INTERAKCJE
// ======================================================

client.on("interactionCreate", async interaction => {

  try {

    // ====================================================
    // WERYFIKACJA
    // ====================================================

    if (
      interaction.isButton() &&
      interaction.customId === "verify_user"
    ) {

      const role =
        interaction.guild.roles.cache.find(
          r => r.name === VERIFIED_ROLE
        );

      if (!role) {
        return interaction.reply({
          content:
            `❌ Nie znaleziono roli **${VERIFIED_ROLE}**.\n\n` +
            `Utwórz rolę dokładnie: **${VERIFIED_ROLE}**`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (
        interaction.member.roles.cache.has(role.id)
      ) {
        return interaction.reply({
          content:
            "✅ Jesteś już zweryfikowany!",
          flags: MessageFlags.Ephemeral
        });
      }

      try {

        await interaction.member.roles.add(role);

        return interaction.reply({
          content:
            `✅ **Zweryfikowano!**\n` +
            `Otrzymujesz rolę ${role}.`,
          flags: MessageFlags.Ephemeral
        });

      } catch (error) {

        console.log(
          "❌ ROLE ERROR:",
          error.message
        );

        return interaction.reply({
          content:
            "❌ Nie mogę nadać roli.\n\n" +
            "Sprawdź, czy **rola bota jest wyżej** niż `✅ użytkownik`.",
          flags: MessageFlags.Ephemeral
        });
      }
    }

    // ====================================================
    // TICKET
    // ====================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket_category"
    ) {

      const category =
        interaction.values[0];

      const existing =
        interaction.guild.channels.cache.find(
          channel =>
            channel.topic ===
            `ticket:${interaction.user.id}`
        );

      if (existing) {
        return interaction.reply({
          content:
            `❌ Masz już otwarty ticket: ${existing}`,
          flags: MessageFlags.Ephemeral
        });
      }

      const names = {
        zakup: "🛒・zakup-titan-holo",
        nagroda: "🎁・nagroda",
     
