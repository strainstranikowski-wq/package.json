const http = require("http");

const PORT = process.env.PORT || 3000;

// =====================================================
// 🌐 RENDER — PORT
// =====================================================

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Titan Market Bot is online!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 Port ${PORT} działa`);
});

// =====================================================
// 🤖 DISCORD
// =====================================================

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

const VERIFIED_ROLE_NAME = "✅ użytkownik";

const TITAN_EMOJI = "<:TitanHolo:1536522515092873319>";
const BLIK_EMOJI = "<:Blik:1536522618348380331>";
const PSC_EMOJI = "<:Psc:1536522696542781450>";
const MYPSC_EMOJI = "<:Mypsc:1536522757595078727>";

const inviteCounts = new Map();
const inviteCache = new Map();

const dailyPurchases = new Map();

const giveawayUsers = new Set();

let giveawayRunning = false;
let giveawayMessage = null;

// =====================================================
// 🤖 READY
// =====================================================

client.once("ready", async () => {
  console.log(`🤖 TITAN MARKET BOT AKTYWNY: ${client.user.tag}`);

  for (const guild of client.guilds.cache.values()) {
    try {
      const invites = await guild.invites.fetch();

      const cache = new Map();

      for (const invite of invites.values()) {
        cache.set(invite.code, {
          uses: invite.uses || 0,
          inviter: invite.inviter ? invite.inviter.id : null
        });
      }

      inviteCache.set(guild.id, cache);

    } catch (error) {
      console.log(
        `⚠️ Nie można pobrać zaproszeń dla ${guild.name}`
      );
    }
  }
});

// =====================================================
// 👋 LOBBY + ZAPROSZENIA
// =====================================================

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

    const newCache = new Map();

    for (const invite of newInvites.values()) {
      newCache.set(invite.code, {
        uses: invite.uses || 0,
        inviter: invite.inviter
          ? invite.inviter.id
          : null
      });
    }

    inviteCache.set(guild.id, newCache);

    let inviteText =
      "❓ Nie udało się ustalić zaproszenia.";

    if (usedInvite && usedInvite.inviter) {
      const inviterId = usedInvite.inviter.id;
      const key = `${guild.id}-${inviterId}`;

      const count =
        (inviteCounts.get(key) || 0) + 1;

      inviteCounts.set(key, count);

      inviteText =
        `👤 Zaprosił: <@${inviterId}>\n` +
        `📨 Zaproszenia: **${count}**`;
    }

    const lobby =
      guild.channels.cache.find(
        channel =>
          channel.name === "lobby" &&
          channel.type === ChannelType.GuildText
      );

    if (!lobby) {
      console.log("⚠️ Nie znaleziono kanału #lobby.");
      return;
    }

    const embed =
      new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("👋 NOWA OSOBA NA SERWERZE")
        .setDescription(
          `🎉 Witaj ${member}!\n\n` +
          `👤 **${member.user.tag}** dołączył na serwer.\n\n` +
          inviteText
        )
        .setTimestamp();

    await lobby.send({
      embeds: [embed]
    });

  } catch (error) {
    console.error("❌ Błąd lobby:", error);
  }
});

// =====================================================
// 💬 KOMENDY
// =====================================================

client.on("messageCreate", async message => {

  try {

    if (message.author.bot) return;

    // =================================================
    // 🏓 PING
    // =================================================

    if (message.content === "!ping") {
      return message.reply(
        "🏓 **Pong! Titan Market Bot działa!**"
      );
    }

    // =================================================
    // 🎫 TICKET
    // =================================================

    if (message.content === "!ticket") {

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎫 TITAN MARKET — TICKET")
          .setDescription(
            "## 💳 METODY PŁATNOŚCI\n\n" +
            `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n` +
            `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n` +
            `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**\n\n` +
            "━━━━━━━━━━━━━━━━━━━━\n\n" +
            "## 🎫 WYBIERZ KATEGORIĘ\n\n" +
            "Kliknij menu poniżej i wybierz, czego potrzebujesz."
          );

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
              description: "Sprawa dotycząca nagrody",
              emoji: "🎁"
            },
            {
              label: "Pomoc",
              value: "pomoc",
              description: "Potrzebujesz pomocy?",
              emoji: "🛠️"
            },
            {
              label: "Współpraca",
              value: "wspolpraca",
              description: "Propozycja współpracy",
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

    // =================================================
    // 🛡️ WERYFIKACJA
    // =================================================

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
            "Aby uzyskać dostęp do serwera, kliknij przycisk poniżej.\n\n" +
            `Po weryfikacji otrzymasz rolę **${VERIFIED_ROLE_NAME}**.\n\n` +
            "💜 Miłej zabawy na Titan Market!"
          );

      return message.channel.send({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(button)
        ]
      });
    }

    // =================================================
    // 📩 ZAPROSZENIA
    // =================================================

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
            `👥 Zaproszenia: **${count}**`
          );

      return message.channel.send({
        embeds: [embed]
      });
    }

    // =================================================
    // 🛒 CENNIK
    // =================================================

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

    // =================================================
    // 💳 PŁATNOŚCI
    // =================================================

    if (message.content === "!platnosci") {

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("💳 METODY PŁATNOŚCI")
          .setDescription(
            `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n\n` +
            `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n\n` +
            `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**`
          );

      return message.channel.send({
        embeds: [embed]
      });
    }

    // =================================================
    // 📜 REGULAMIN
    // =================================================

    if (message.content === "!regulamin") {

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("📜 REGULAMIN TITAN MARKET")
          .setDescription(
            "**§1. Postanowienia ogólne**\n\n" +
            "1.1. Dołączając do serwera akceptujesz regulamin.\n" +
            "1.2. Każdy użytkownik ma obowiązek stosować się do poleceń administracji.\n" +
            "1.3. Nieznajomość regulaminu nie zwalnia z jego przestrzegania.\n\n" +

            "**§2. Kultura osobista**\n\n" +
            "2.1. Zakaz wyzywania i obrażania innych osób.\n" +
            "2.2. Zakaz prowokowania użytkowników.\n" +
            "2.3. Zakaz spamu i floodu.\n" +
            "2.4. Zakaz celowego utrudniania pracy administracji.\n\n" +

            "**§3. Reklamy**\n\n" +
            "3.1. Zakaz reklamowania innych serwerów bez zgody administracji.\n" +
            "3.2. Zakaz wysyłania reklam w DM użytkowników serwera.\n" +
            "3.3. Zakaz spamowania linkami.\n\n" +

            "**§4. Tickety**\n\n" +
            "4.1. Ticket służy do kontaktu z administracją.\n" +
            "4.2. Nie twórz wielu ticketów bez potrzeby.\n" +
            "4.3. Podczas zakupu podaj dokładną liczbę Titanów.\n" +
            "4.4. Nie wysyłaj fałszywych potwierdzeń płatności.\n" +
            "4.5. Po zakończeniu sprawy ticket może zostać zamknięty.\n\n" +

            "**§5. Płatności**\n\n" +
            "5.1. BLIK — 0% prowizji.\n" +
            "5.2. PSC — 15% prowizji.\n" +
            "5.3. MYPSC — 25% prowizji.\n\n" +

            "**§6. Vouch / LEGIT**\n\n" +
            "6.1. Zakaz fałszywych opinii.\n" +
            "6.2. Zakaz wymuszania Vouchów.\n" +
            "6.3. Opinie powinny dotyczyć prawdziwych transakcji.\n\n" +

            "**§7. Konkursy i dropy**\n\n" +
            "7.1. Zakaz używania dodatkowych kont do zdobywania nagród.\n" +
            "7.2. Administracja może zakończyć wydarzenie.\n" +
            "7.3. Próby oszustwa mogą zakończyć się dyskwalifikacją.\n\n" +

            "**§8. Zaproszenia**\n\n" +
            "8.1. Zakaz fałszywych zaproszeń.\n" +
            "8.2. Zakaz spamowania zaproszeniami.\n" +
            "8.3. Nieuczciwie zdobyte zaproszenia mogą zostać usunięte.\n\n" +

            "**§9. Bezpieczeństwo**\n\n" +
            "9.1. Nie podawaj nikomu hasła.\n" +
            "9.2. Administracja nigdy nie prosi o hasło.\n" +
            "9.3. Nie klikaj podejrzanych linków.\n\n" +

            "**§10. Kary**\n\n" +
            "10.1. Za łamanie regulaminu może zostać nadane ostrzeżenie, mute, kick lub ban.\n" +
            "10.2. Administracja może dostosować karę do sytuacji.\n\n" +

            "💜 **Titan Market — szanuj innych i przestrzegaj zasad.**"
          );

      return message.channel.send({
        embeds: [embed]
      });
    }

    // =================================================
    // 🎁 DROP
    // =================================================

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
            "🍀 Szansa na wygraną jest mała.\n\n" +
            "🎁 Kliknij **Wylosuj**."
          );

      return message.channel.send({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(button)
        ]
      });
    }

    // =================================================
    // 🎉 KONKURS
    // =================================================

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

    // =================================================
    // ⭐ LEGIT
    // =================================================

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
            "Chcesz zobaczyć opinie klientów?\n\n" +
            "Kliknij **⭐ Zobacz LEGIT**."
          );

      return message.channel.send({
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(button)
        ]
      });
    }

    // =================================================
    // ⭐ VOUCH
    // =================================================

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
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(button)
        ]
      });
    }

    // =================================================
    // 💰 DAILY
    // =================================================

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
            "🔄 Nowy dzień zaczyna licznik od zera."
          );

      return message.channel.send({
        embeds: [embed]
      });
    }

    // =================================================
    // ✅ POTWIERDZENIE ZAKUPU
    // =================================================

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

  } catch (error) {
    console.error(
      "❌ BŁĄD messageCreate:",
      error
    );
  }
});

// =====================================================
// 🎫 INTERAKCJE
// =====================================================

client.on("interactionCreate", async interaction => {

  try {

    // =================================================
    // 🛡️ WERYFIKACJA
    // =================================================

    if (
      interaction.isButton() &&
      interaction.customId === "verify_user"
    ) {

      const role =
        interaction.guild.roles.cache.find(
          role =>
            role.name === VERIFIED_ROLE_NAME
        );

      if (!role) {
        return interaction.reply({
          content:
            `❌ Nie znaleziono roli **${VERIFIED_ROLE_NAME}**.`,
          ephemeral: true
        });
      }

      if (
        interaction.member.roles.cache.has(
          role.id
        )
      ) {
        return interaction.reply({
          content:
            "✅ Jesteś już zweryfikowany!",
          ephemeral: true
        });
      }

      try {

        await interaction.member.roles.add(role);

        return interaction.reply({
          content:
            `✅ **Zweryfikowano!** Otrzymujesz rolę ${role}.`,
          ephemeral: true
        });

      } catch (error) {

        console.error(
          "❌ Błąd nadawania roli:",
          error
        );

        return interaction.reply({
          content:
            "❌ Nie mogę nadać roli. Ustaw rolę bota wyżej niż `✅ użytkownik`.",
          ephemeral: true
        });
      }
    }

    // =================================================
    // 🎫 WYBÓR KATEGORII TICKETA
    // =================================================

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
  
