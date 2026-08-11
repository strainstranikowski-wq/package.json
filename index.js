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

// ==================================================
// RENDER
// ==================================================

const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot ONLINE");
}).listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Render port działa:", PORT);
});

// ==================================================
// USTAWIENIA
// ==================================================

const PURPLE = 0x8B5CF6;

const VERIFIED_ROLE = "✅ użytkownik";

const TITAN = "<:TitanHolo:1536522515092873319>";
const BLIK = "<:Blik:1536522618348380331>";
const PSC = "<:Psc:1536522696542781450>";
const MYPSC = "<:Mypsc:1536522757595078727>";

const invites = new Map();
const daily = new Map();
const giveaway = new Set();

// ==================================================
// DISCORD CLIENT
// ==================================================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ==================================================
// READY
// ==================================================

client.once("ready", () => {
  console.log(`🤖 ZALOGOWANO JAKO ${client.user.tag}`);
});

// ==================================================
// NOWA OSOBA
// ==================================================

client.on("guildMemberAdd", async member => {
  try {
    const channel = member.guild.channels.cache.find(
      c => c.name === "lobby" && c.type === ChannelType.GuildText
    );

    if (!channel) return;

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("👋 NOWA OSOBA!")
      .setDescription(
        `🎉 Witaj ${member}!\n\n` +
        `👤 **${member.user.tag}** właśnie dołączył na serwer.\n\n` +
        `💜 Miłej zabawy na **Titan Market**!`
      )
      .setTimestamp();

    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.log("Lobby error:", err);
  }
});

// ==================================================
// KOMENDY
// ==================================================

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  // PING
  if (message.content === "!ping") {
    return message.reply("🏓 **Pong! Bot działa!**");
  }

  // ==================================================
  // WERYFIKACJA
  // ==================================================

  if (message.content === "!weryfikacja") {

    const button = new ButtonBuilder()
      .setCustomId("verify")
      .setLabel("Zweryfikuj się")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🛡️ WERYFIKACJA")
      .setDescription(
        "Aby uzyskać dostęp do serwera:\n\n" +
        "### Kliknij ✅ ZWERYFIKUJ SIĘ\n\n" +
        `Po weryfikacji otrzymasz rolę **${VERIFIED_ROLE}**.`
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ==================================================
  // TICKET
  // ==================================================

  if (message.content === "!ticket") {

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket")
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

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🎫 TITAN MARKET — TICKET")
      .setDescription(
        "## 💳 METODY PŁATNOŚCI\n\n" +
        `${BLIK} **BLIK — 0% prowizji**\n` +
        `${PSC} **PSC — 15% prowizji**\n` +
        `${MYPSC} **MYPSC — 25% prowizji**\n\n` +
        "━━━━━━━━━━━━━━━━━━\n\n" +
        "## 🎫 WYBIERZ KATEGORIĘ\n\n" +
        "Wybierz odpowiednią kategorię z menu."
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // ==================================================
  // CENNIK
  // ==================================================

  if (message.content === "!cennik") {

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🛒 CENNIK — CASE PARADISE")
      .setDescription(
        `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
        `${TITAN} 1 Titan → 1 zł\n` +
        `${TITAN} 10 Titanów → 10 zł\n` +
        `${TITAN} 50 Titanów → 50 zł\n\n` +
        "🎫 Zakup przez `!ticket`."
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ==================================================
  // PŁATNOŚCI
  // ==================================================

  if (message.content === "!platnosci") {

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("💳 METODY PŁATNOŚCI")
      .setDescription(
        `${BLIK} **BLIK**\n` +
        `Prowizja: **0%**\n\n` +

        `${PSC} **PSC**\n` +
        `Prowizja: **15%**\n\n` +

        `${MYPSC} **MyPSC**\n` +
        `Prowizja: **25%**`
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ==================================================
  // REGULAMIN
  // ==================================================

  if (message.content === "!regulamin") {

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("📜 REGULAMIN TITAN MARKET")
      .setDescription(
        "**§1 POSTANOWIENIA OGÓLNE**\n" +
        "1.1. Każdy użytkownik ma obowiązek przestrzegać regulaminu.\n" +
        "1.2. Administracja może reagować na łamanie zasad.\n" +
        "1.3. Zakaz wykorzystywania błędów serwera.\n\n" +

        "**§2 KULTURA**\n" +
        "2.1. Zakaz wyzywania innych osób.\n" +
        "2.2. Zakaz prowokowania.\n" +
        "2.3. Zakaz spamu i floodu.\n" +
        "2.4. Zakaz nękania użytkowników.\n\n" +

        "**§3 REKLAMY**\n" +
        "3.1. Zakaz reklamowania innych serwerów bez zgody administracji.\n" +
        "3.2. Zakaz wysyłania reklam na DM.\n\n" +

        "**§4 TICKETY**\n" +
        "4.1. Jeden użytkownik może posiadać jeden ticket.\n" +
        "4.2. Nie spamuj ticketami.\n" +
        "4.3. Podaj dokładnie, czego potrzebujesz.\n" +
        "4.4. Fałszywe potwierdzenia płatności są zabronione.\n\n" +

        "**§5 PŁATNOŚCI**\n" +
        "5.1. BLIK — 0% prowizji.\n" +
        "5.2. PSC — 15% prowizji.\n" +
        "5.3. MyPSC — 25% prowizji.\n" +
        "5.4. Nie wysyłaj danych płatniczych publicznie.\n\n" +

        "**§6 VOUCH**\n" +
        "6.1. Zakaz fałszywych opinii.\n" +
        "6.2. Nie wymuszaj Vouchów.\n" +
        "6.3. Vouch powinien pochodzić z prawdziwej transakcji.\n\n" +

        "**§7 DROP I KONKURSY**\n" +
        "7.1. Zakaz używania multikont.\n" +
        "7.2. Nieuczciwe zdobywanie nagród jest zabronione.\n" +
        "7.3. Administracja może zakończyć wydarzenie.\n\n" +

        "**§8 ZAPROSZENIA**\n" +
        "8.1. Zakaz fake invite.\n" +
        "8.2. Zakaz spamowania zaproszeniami.\n" +
        "8.3. Nieuczciwe zaproszenia mogą zostać usunięte.\n\n" +

        "**§9 BEZPIECZEŃSTWO**\n" +
        "9.1. Nie podawaj nikomu hasła.\n" +
        "9.2. Administracja nie prosi o hasło.\n" +
        "9.3. Uważaj na podejrzane linki.\n\n" +

        "**§10 KARY**\n" +
        "10.1. Ostrzeżenie.\n" +
        "10.2. Mute.\n" +
        "10.3. Kick.\n" +
        "10.4. Ban.\n\n" +

        "💜 **Titan Market — miłej zabawy!**"
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ==================================================
  // DROP
  // ==================================================

  if (message.content === "!drop") {

    const button = new ButtonBuilder()
      .setCustomId("drop")
      .setLabel("Wylosuj")
      .setEmoji("🎁")
      .setStyle(ButtonStyle.Primary);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🎁 DROP — 5% ZNIŻKI")
      .setDescription(
        "🍀 Szansa na wygranie zniżki jest mała.\n\n" +
        "Kliknij **🎁 Wylosuj**."
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ==================================================
  // KONKURS
  // ==================================================

  if (message.content === "!konkursy") {

    giveaway.clear();

    const button = new ButtonBuilder()
      .setCustomId("join_giveaway")
      .setLabel("Weź udział")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Success);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🎉 KONKURS TITAN MARKET")
      .setDescription(
        "🔥 Konkurs jest aktywny!\n\n" +
        "Kliknij **🎉 Weź udział**.\n\n" +
        "👥 Uczestnicy: **0**"
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ==================================================
  // LEGIT
  // ==================================================

  if (message.content === "!legit") {

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("⭐ CZY JESTEŚMY LEGIT?")
      .setDescription(
        "Chcesz zobaczyć opinie klientów?\n\n" +
        "⭐ Sprawdź kanał **#vouch**."
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ==================================================
  // VOUCH
  // ==================================================

  if (message.content === "!vouch") {

    const button = new ButtonBuilder()
      .setCustomId("vouch")
      .setLabel("LEGIT")
      .setEmoji("⭐")
      .setStyle(ButtonStyle.Success);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("⭐ ZOSTAW VOUCH")
      .setDescription(
        "Jeżeli transakcja przebiegła pomyślnie,\n" +
        "kliknij **⭐ LEGIT**."
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // ==================================================
  // DAILY
  // ==================================================

  if (message.content === "!daily") {

    const today =
      new Date().toLocaleDateString("pl-PL");

    const count = daily.get(today) || 0;

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("💰 DAILY — TITAN MARKET")
      .setDescription(
        `📅 **${today}**\n\n` +
        `🛒 Kupujących dzisiaj: **${count}**\n\n` +
        "🔄 Licznik resetuje się każdego dnia."
      );

    return message.channel.send({ embeds: [embed] });
  }

  // ==================================================
  // POTWIERDŹ ZAKUP
  // ==================================================

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

    const count = daily.get(today) || 0;

    daily.set(today, count + 1);

    return message.reply(
      `✅ Zakup zapisany!\n🛒 Dzisiaj: **${count + 1}**`
    );
  }
});

// ==================================================
// INTERAKCJE
// ==================================================

client.on("interactionCreate", async interaction => {

  try {

    // ==================================================
    // WERYFIKACJA
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "verify"
    ) {

      const role =
        interaction.guild.roles.cache.find(
          r => r.name === VERIFIED_ROLE
        );

      if (!role) {
        return interaction.reply({
          content:
            `❌ Nie znaleziono roli **${VERIFIED_ROLE}**.\n` +
            `Utwórz rolę dokładnie o nazwie: **${VERIFIED_ROLE}**`,
          ephemeral: true
        });
      }

      if (
        interaction.member.roles.cache.has(role.id)
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
            `✅ Zweryfikowano!\nOtrzymujesz rolę ${role}.`,
          ephemeral: true
        });

      } catch (error) {

        console.log(error);

        return interaction.reply({
          content:
            "❌ Nie mogę nadać roli.\n\n" +
            "Sprawdź, czy rola bota znajduje się **wyżej** niż `✅ użytkownik`.",
          ephemeral: true
        });
      }
    }

    // ==================================================
    // TICKET
    // ==================================================

    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === "ticket"
    ) {

      const category =
        interaction.values[0];

      const existing =
        interaction.guild.channels.cache.find(
          c =>
            c.topic ===
            `ticket:${interaction.user.id}`
        );

      if (existing) {
        return interaction.reply({
          content:
            `❌ Masz już ticket: ${existing}`,
          ephemeral: true
        });
      }

      const names = {
        zakup: "🛒・zakup-titan",
        nagroda: "🎁・nagroda",
        pomoc: "🛠️・pomoc",
        wspolpraca: "🤝・wspolpraca"
      };

      const channel =
        await interaction.guild.channels.create({
          name: names[category],
          type: ChannelType.GuildText,
          topic:
            `ticket:${interaction.user.id}`,

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
            },
            {
              id: client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.ManageChannels
              ]
            }
          ]
        });

      let text = "";

      if (category === "zakup") {
        text =
          `${TITAN} **ZAKUP TITAN HOLO**\n\n` +
          `${TITAN} **1 TITAN = 1 ZŁ**\n\n` +
          "## 💳 METODY PŁATNOŚCI\n\n" +
          `${BLIK} **BLIK — 0% prowizji**\n` +
          `${PSC} **PSC — 15% prowizji**\n` +
          `${MYPSC} **MyPSC — 25% prowizji**\n\n` +
          "Napisz, ile Titanów chcesz kupić.";
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

      const close =
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("Zamknij ticket")
          .setEmoji("🔒")
          .setStyle(ButtonStyle.Danger);

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("🎫 TITAN MARKET")
          .setDescription(text);

      await channel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(close)
        ]
      });

      return interaction.reply({
        content:
          `✅ Ticket utworzony: ${channel}`,
        ephemeral: true
      });
    }

    // ==================================================
    // ZAMKNIJ TICKET
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "close_ticket"
    ) {

      await interaction.reply(
        "🔒 Ticket zostanie zamknięty za 3 sekundy..."
      );

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);

      return;
    }

    // ==================================================
    // DROP
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "drop"
    ) {

      if (Math.random() < 0.05) {

        return interaction.reply({
          content:
            "🎉 **GRATULACJE! WYGRAŁEŚ 5% ZNIŻKI!** 💜",
          ephemeral: true
        });

      }

      return interaction.reply({
        content:
          "❌ Niestety nie wygrałeś. Spróbuj następnym razem! 🍀",
        ephemeral: true
      });
    }

    // ==================================================
    // KONKURS
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "join_giveaway"
    ) {

      if (
        giveaway.has(interaction.user.id)
      ) {
        return interaction.reply({
          content:
            "❌ Już bierzesz udział!",
          ephemeral: true
        });
      }

      giveaway.add(
        interaction.user.id
      );

      return interaction.reply({
        content:
          `🎉 Bierzesz udział w konkursie!\n` +
          `👥 Liczba uczestników: **${giveaway.size}**`,
        ephemeral: true
      });
    }

    // ==================================================
    // VOUCH
    // ==================================================

    if (
      interaction.isButton() &&
      interaction.customId === "vouch"
    ) {

      const channel =
        interaction.guild.channels.cache.find(
          c =>
            c.name === "vouch" &&
            c.type === ChannelType.GuildText
        );

      if (!channel) {
        return interaction.reply({
          content:
            "❌ Nie znaleziono kanału #vouch.",
          ephemeral: true
        });
      }

      const embed =
        new EmbedBuilder()
          .setColor(PURPLE)
          .setTitle("⭐ NOWY VOUCH")
          .setDescription(
            `👤 **Klient:** ${interaction.user}\n\n` +
            "💜 **LEGIT — POZYTYWNA OPINIA**"
          )
          .setTimestamp();

      await channel.send({
        embeds: [embed]
      });

      return interaction.reply({
        content:
          "⭐ Dziękujemy za Vouch!",
        ephemeral: true
      });
    }

  } catch (error) {

    console.error(
      "❌ INTERACTION ERROR:",
      error
    );

    if (
      !interaction.replied &&
      !interaction.deferred
    ) {
      await interaction.
