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

// ===============================
// 🌐 RENDER PORT
// ===============================

const PORT = process.env.PORT || 10000;

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Titan Market Bot działa!");
}).listen(PORT, "0.0.0.0", () => {
  console.log(`🌐 PORT ${PORT} DZIAŁA`);
});

// ===============================
// 🤖 DISCORD
// ===============================

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===============================
// 💜 USTAWIENIA
// ===============================

const PURPLE = 0x8B5CF6;
const VERIFIED_ROLE_NAME = "✅ użytkownik";

const TITAN_EMOJI = "<:TitanHolo:1536522515092873319>";
const BLIK_EMOJI = "<:Blik:1536522618348380331>";
const PSC_EMOJI = "<:Psc:1536522696542781450>";
const MYPSC_EMOJI = "<:Mypsc:1536522757595078727>";

const inviteCounts = new Map();
const inviteCache = new Map();
const dailyPurchases = new Map();

// ===============================
// 🤖 READY
// ===============================

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
      console.log("⚠️ Nie można pobrać zaproszeń.");
    }
  }
});

// ===============================
// 👋 POWITANIE
// ===============================

client.on("guildMemberAdd", async member => {
  try {
    const lobby = member.guild.channels.cache.find(
      channel =>
        channel.name === "lobby" &&
        channel.type === ChannelType.GuildText
    );

    if (!lobby) return;

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("👋 NOWA OSOBA")
      .setDescription(
        `🎉 Witaj ${member}!\n\n` +
        `👤 **${member.user.tag}** dołączył na Titan Market.`
      )
      .setTimestamp();

    await lobby.send({ embeds: [embed] });
  } catch (error) {
    console.log("❌ Błąd powitania:", error);
  }
});

// ===============================
// 💬 KOMENDY
// ===============================

client.on("messageCreate", async message => {
  if (message.author.bot) return;
  if (!message.guild) return;

  // !ping
  if (message.content === "!ping") {
    return message.reply("🏓 **Pong! Titan Market Bot działa!**");
  }

  // !cennik
  if (message.content === "!cennik") {
    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🛒 CENNIK — CASE PARADISE")
      .setDescription(
        `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**\n\n` +
        "💰 Kupujesz tyle Titanów, ile potrzebujesz.\n\n" +
        "🎫 Aby kupić, użyj `!ticket`."
      );

    return message.channel.send({ embeds: [embed] });
  }

  // !platnosci
  if (message.content === "!platnosci") {
    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("💳 METODY PŁATNOŚCI")
      .setDescription(
        `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n\n` +
        `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n\n` +
        `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**`
      );

    return message.channel.send({ embeds: [embed] });
  }

  // !regulamin
  if (message.content === "!regulamin") {
    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("📜 REGULAMIN TITAN MARKET")
      .setDescription(
        "**§1. OGÓLNE**\n" +
        "1.1. Dołączając do serwera akceptujesz regulamin.\n" +
        "1.2. Szanuj innych użytkowników i administrację.\n" +
        "1.3. Zakaz spamu i floodu.\n\n" +

        "**§2. KULTURA**\n" +
        "2.1. Zakaz wyzywania i obrażania.\n" +
        "2.2. Zakaz prowokowania innych osób.\n" +
        "2.3. Zakaz celowego utrudniania pracy administracji.\n\n" +

        "**§3. REKLAMY**\n" +
        "3.1. Zakaz reklamowania innych serwerów bez zgody administracji.\n" +
        "3.2. Zakaz wysyłania reklam na DM.\n\n" +

        "**§4. TICKETY**\n" +
        "4.1. Ticket służy do kontaktu z administracją.\n" +
        "4.2. Nie twórz wielu ticketów bez potrzeby.\n" +
        "4.3. Podczas zakupu podaj liczbę Titanów.\n" +
        "4.4. Zakaz fałszywych potwierdzeń płatności.\n\n" +

        "**§5. PŁATNOŚCI**\n" +
        "5.1. BLIK — 0% prowizji.\n" +
        "5.2. PSC — 15% prowizji.\n" +
        "5.3. MYPSC — 25% prowizji.\n\n" +

        "**§6. VOUCH**\n" +
        "6.1. Zakaz fałszywych opinii.\n" +
        "6.2. Zakaz wymuszania Vouchów.\n\n" +

        "**§7. ZAPROSZENIA**\n" +
        "7.1. Zakaz fałszywych zaproszeń.\n" +
        "7.2. Zakaz spamowania zaproszeniami.\n\n" +

        "**§8. BEZPIECZEŃSTWO**\n" +
        "8.1. Nie podawaj nikomu hasła.\n" +
        "8.2. Administracja nie prosi o hasła.\n" +
        "8.3. Nie klikaj podejrzanych linków.\n\n" +

        "**§9. KARY**\n" +
        "9.1. Możliwe są ostrzeżenia, mute, kick lub ban.\n\n" +

        "💜 **Titan Market — miłego korzystania z serwera!**"
      );

    return message.channel.send({ embeds: [embed] });
  }

  // !weryfikacja
  if (message.content === "!weryfikacja") {
    const button = new ButtonBuilder()
      .setCustomId("verify_user")
      .setLabel("Zweryfikuj się")
      .setEmoji("✅")
      .setStyle(ButtonStyle.Success);

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🛡️ WERYFIKACJA TITAN MARKET")
      .setDescription(
        "Kliknij przycisk poniżej, aby się zweryfikować.\n\n" +
        `Po weryfikacji otrzymasz rolę **${VERIFIED_ROLE_NAME}**.`
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(button)
      ]
    });
  }

  // !ticket
  if (message.content === "!ticket") {
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

    const embed = new EmbedBuilder()
      .setColor(PURPLE)
      .setTitle("🎫 TITAN MARKET — TICKET")
      .setDescription(
        "## 💳 METODY PŁATNOŚCI\n\n" +
        `${BLIK_EMOJI} **BLIK — 0% PROWIZJI**\n` +
        `${PSC_EMOJI} **PSC — 15% PROWIZJI**\n` +
        `${MYPSC_EMOJI} **MYPSC — 25% PROWIZJI**\n\n` +
        "Wybierz kategorię poniżej."
      );

    return message.channel.send({
      embeds: [embed],
      components: [
        new ActionRowBuilder().addComponents(menu)
      ]
    });
  }

  // !sprawdz
  if (
    message.content === "!sprawdz" ||
    message.content === "!zaproszenia"
  ) {
    const key = `${message.guild.id}-${message.author.id}`;
    const count = inviteCounts.get(key) || 0;

    return message.reply(
      `📨 **Twoje zaproszenia:** ${count}`
    );
  }

  // !daily
  if (message.content === "!daily") {
    const today = new Date().toLocaleDateString("pl-PL");
    const count = dailyPurchases.get(today) || 0;

    return message.reply(
      `💰 **DAILY**\n📅 ${today}\n🛒 Dzisiejsze zakupy: **${count}**`
    );
  }

  // !potwierdz
  if (message.content === "!potwierdz") {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageGuild
      )
    ) {
      return message.reply("❌ Tylko administracja może użyć tej komendy.");
    }

    const today = new Date().toLocaleDateString("pl-PL");
    const count = dailyPurchases.get(today) || 0;

    dailyPurchases.set(today, count + 1);

    return message.reply(
      `✅ Zakup potwierdzony!\n🛒 Dzisiaj: **${count + 1}**`
    );
  }
});

// ===============================
// 🖱️ PRZYCISKI + MENU
// ===============================

client.on("interactionCreate", async interaction => {

  // 🛡️ WERYFIKACJA
  if (
    interaction.isButton() &&
    interaction.customId === "verify_user"
  ) {
    const role = interaction.guild.roles.cache.find(
      r => r.name === VERIFIED_ROLE_NAME
    );

    if (!role) {
      return interaction.reply({
        content: `❌ Nie znaleziono roli **${VERIFIED_ROLE_NAME}**.`,
        ephemeral: true
      });
    }

    if (role.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.reply({
        content:
          "❌ Bot nie może nadać tej roli. Przenieś rolę bota wyżej niż `✅ użytkownik`.",
        ephemeral: true
      });
    }

    if (interaction.member.roles.cache.has(role.id)) {
      return interaction.reply({
        content: "✅ Jesteś już zweryfikowany!",
        ephemeral: true
      });
    }

    try {
      await interaction.member.roles.add(role);

      return interaction.reply({
        content: `✅ Zweryfikowano! Otrzymujesz rolę ${role}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error("❌ Błąd nadawania roli:", error);

      return interaction.reply({
        content: "❌ Nie mogę nadać roli. Sprawdź uprawnienia bota.",
        ephemeral: true
      });
    }
  }

  // 🎫 MENU TICKET
  if (
    interaction.isStringSelectMenu() &&
    interaction.customId === "ticket_category"
  ) {
    const category = interaction.values[0];

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

    const names = {
      zakup: "zakup-titan-holo",
      nagroda: "nagroda",
      pomoc: "pomoc",
      wspolpraca: "wspolpraca"
    };

    try {
      const channel =
        await interaction.guild.channels.create({
          name: `🎫・${names[category]}`,
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

      const closeButton = new ButtonBuilder()
        .setCustomId("close_ticket")
        .setLabel("Zamknij ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      let text = "";

      if (category === "zakup") {
        text =
          `${TITAN_EMOJI} **ZAKUP TITAN HOLO**\n\n` +
          `${TITAN_EMOJI} **1 TITAN = 1 ZŁ**\n\n` +
          `${BLIK_EMOJI} BLIK — 0% prowizji\n` +
          `${PSC_EMOJI} PSC — 15% prowizji\n` +
          `${MYPSC_EMOJI} MYPSC — 25% prowizji\n\n` +
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
          "Opisz swoją propozycję.";
      }

      const embed = new EmbedBuilder()
        .setColor(PURPLE)
        .setTitle("🎫 TITAN MARKET")
        .setDescription(text);

      await channel.send({
        content: `${interaction.user}`,
        embeds: [embed],
        components: [
          new ActionRowBuilder().addComponents(closeButton)
        ]
      });

      return interaction.reply({
        content: `✅ Ticket utworzony: ${channel}`,
        ephemeral: true
      });

    } catch (error) {
      console.error("❌ Błąd tworzenia ticketu:", error);

      return interaction.reply({
        content:
          "❌ Nie udało się utworzyć ticketu. Sprawdź uprawnienia bota.",
        ephemeral: true
      });
    }
  }

  // 🔒 ZAMKNIĘCIE TICKETU
  if (
    interaction.isButton() &&
    interaction.customId === "close_ticket"
  ) {
    if (!interaction.channel) return;

    await interaction.reply("🔒 Ticket zostanie zamknięty za 3 sekundy.");

    setTimeout(() => {
      interaction.channel.delete().catch(() => {});
    }, 3000);
  }
});

// ===============================
// 🔑 LOGOWANIE
// ===============================

if (!process.env.TOKEN) {
  console.error("❌ BRAK TOKEN W RENDER!");
  process.exit(1);
}

client.login(process.env.TOKEN)
  .then(() => {
    console.log("🔑 LOGOWANIE DISCORD OK");
  })
  .catch(error => {
    console.error("❌ BŁĄD LOGOWANIA DISCORD:");
    console.error(error);
    process.exit(1);
  });
